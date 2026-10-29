"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ChatLine, LoadingChatLine } from "@/components/chat/ChatLine";
import { downloadChatPdf } from "@/lib/download-chat-pdf";
import { ontologyById, ontologyContextFor } from "@/lib/ontology";
import { SATI_SYSTEM_PROMPT } from "@/lib/system-prompt";
import { ChatMessage } from "@/lib/types";

const starter: ChatMessage = {
  role: "assistant",
  content: "Hello. What in the Pāli world shall we look at? We can talk through a teaching, or I can guide a short meditation.",
};

const spokenPlaceholder = "…";
const speakers = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar"] as const;
const speechSpeed = 0.85;

type TalkSession = {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  audio: HTMLAudioElement;
  sender: RTCRtpSender;
  silent: MediaStreamTrack | null;
  silentContext: AudioContext | null;
  mic: MediaStream | null;
  remote: MediaStream | null;
  mix: AudioContext | null;
  mixDest: MediaStreamAudioDestinationNode | null;
  micNode: MediaStreamAudioSourceNode | null;
  recorder: MediaRecorder | null;
  chunks: Blob[];
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
}

function shortError(text: string) {
  try {
    const json = JSON.parse(text) as { error?: { message?: string } | string };
    const message = typeof json.error === "string" ? json.error : json.error?.message;
    if (message) return message;
  } catch {
    // The upstream body was plain text.
  }
  return text.slice(0, 280);
}

function instructionsFor(text: string) {
  const note = ontologyContextFor(text);
  return note ? `${SATI_SYSTEM_PROMPT}\n\n${note}` : SATI_SYSTEM_PROMPT;
}

function waitForIce(pc: RTCPeerConnection) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise<void>(resolve => {
    const timer = window.setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", done);
      resolve();
    }, 2500);
    function done() {
      if (pc.iceGatheringState !== "complete") return;
      window.clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", done);
      resolve();
    }
    pc.addEventListener("icegatheringstatechange", done);
  });
}

function requestMicrophone() {
  const devices = navigator.mediaDevices;
  if (devices && typeof devices.getUserMedia === "function") return devices.getUserMedia({ audio: true });
  const legacy = (
    navigator as Navigator & {
      webkitGetUserMedia?: (constraints: MediaStreamConstraints, ok: (stream: MediaStream) => void, err: (reason: unknown) => void) => void;
    }
  ).webkitGetUserMedia;
  if (typeof legacy === "function") {
    return new Promise<MediaStream>((resolve, reject) => legacy.call(navigator, { audio: true }, resolve, reject));
  }
  if (!window.isSecureContext) {
    throw new Error("The microphone is unavailable on this address. Open the page at http://localhost:3000. Sati can still speak when you type.");
  }
  throw new Error("This browser is not offering a microphone. Sati can still speak when you type.");
}

async function startPlayback(audio: HTMLAudioElement) {
  audio.muted = false;
  audio.volume = 1;
  await audio.play();
}

function makeSilentTrack() {
  const context = new AudioContext();
  const destination = context.createMediaStreamDestination();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  gain.gain.value = 0;
  oscillator.connect(gain).connect(destination);
  oscillator.start();
  return { context, track: destination.stream.getAudioTracks()[0] };
}

export function Chat({ topicId }: { topicId?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([starter]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voice, setVoice] = useState(true);
  const [speaker, setSpeaker] = useState<(typeof speakers)[number]>("echo");
  const [micReady, setMicReady] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [error, setError] = useState("");
  const startedTopic = useRef(false);
  const sessionRef = useRef<TalkSession | null>(null);
  const openingRef = useRef<Promise<void> | null>(null);
  const preparedRef = useRef<{ context: AudioContext; track: MediaStreamTrack; mix: AudioContext } | null>(null);
  const voiceRef = useRef(true);
  const speakerRef = useRef<(typeof speakers)[number]>("echo");
  const heardRef = useRef(false);
  const listeningRef = useRef(false);
  const replyOpen = useRef(false);
  const voiceReply = useRef<number | null>(null);
  const updateWaiters = useRef<Array<() => void>>([]);

  const appendAssistant = (delta: string) => {
    if (!delta) return;
    setLoading(false);
    setMessages(current => {
      const next = [...current];
      const last = next[next.length - 1];
      if (replyOpen.current && last?.role === "assistant") {
        next[next.length - 1] = { role: "assistant", content: last.content + delta };
        return next;
      }
      replyOpen.current = true;
      return [...next, { role: "assistant", content: delta }];
    });
  };

  const finishReply = () => {
    replyOpen.current = false;
    setLoading(false);
  };

  const useTranscript = (text: string) => {
    const spoken = text.trim();
    if (!spoken) return;
    setMessages(current => {
      const next = [...current];
      const index = next.findLastIndex(message => message.role === "user" && message.content === spokenPlaceholder);
      if (index >= 0) {
        next[index] = { role: "user", content: spoken };
        return next;
      }
      return [...next, { role: "user", content: spoken }];
    });
    const session = sessionRef.current;
    if (session?.dc.readyState === "open") {
      session.dc.send(
        JSON.stringify({
          type: "session.update",
          session: { type: "realtime", instructions: instructionsFor(spoken) },
        }),
      );
    }
    if (voiceReply.current !== null) {
      window.clearTimeout(voiceReply.current);
      voiceReply.current = null;
      session?.dc.send(JSON.stringify({ type: "response.create" }));
      setLoading(true);
    }
  };

  const onRealtimeEvent = (event: {
    type?: string;
    delta?: string;
    transcript?: string;
    error?: { message?: string };
  }) => {
    const type = event.type ?? "";
    if (type === "session.updated") {
      const waiter = updateWaiters.current.shift();
      waiter?.();
    }
    if (type === "error") {
      const message = event.error?.message ?? "The realtime model could not answer.";
      if (/buffer|no audio|empty/i.test(message)) return;
      setError(message);
      finishReply();
      return;
    }
    if (type.endsWith("input_audio_transcription.completed") || type.endsWith("input_audio_transcription.done")) {
      useTranscript(event.transcript ?? "");
      return;
    }
    const audioTranscript = type.includes("audio_transcript") || type.includes("output_audio_transcript");
    const textDelta = type.endsWith("output_text.delta") || type === "response.text.delta";
    if (audioTranscript) heardRef.current = true;
    if (voiceRef.current && audioTranscript && type.endsWith(".delta")) appendAssistant(event.delta ?? "");
    if (!voiceRef.current && textDelta) appendAssistant(event.delta ?? "");
    if (type === "response.done" || type === "response.output_audio_transcript.done" || type === "response.output_text.done") {
      if (type === "response.done") finishReply();
    }
  };

  const prepareAudio = () => {
    if (preparedRef.current) {
      void preparedRef.current.context.resume();
      void preparedRef.current.mix.resume();
      return preparedRef.current;
    }
    const silent = makeSilentTrack();
    void silent.context.resume();
    const mix = new AudioContext();
    void mix.resume();
    preparedRef.current = { context: silent.context, track: silent.track, mix };
    return preparedRef.current;
  };

  const audioOutput = () => ({ voice: speakerRef.current, speed: speechSpeed });

  const releaseSession = () => {
    const session = sessionRef.current;
    if (!session) return;
    session.mic?.getTracks().forEach(track => track.stop());
    if (session.recorder && session.recorder.state !== "inactive") session.recorder.stop();
    session.audio.remove();
    session.pc.close();
    sessionRef.current = null;
    heardRef.current = false;
    setMicReady(false);
  };

  const ensureSession = () => {
    if (sessionRef.current?.dc.readyState === "open") return Promise.resolve();
    if (openingRef.current) return openingRef.current;
    openingRef.current = connect().finally(() => {
      openingRef.current = null;
    });
    return openingRef.current;
  };

  const connect = async () => {
    const pc = new RTCPeerConnection();
    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.playsInline = true;
    audio.setAttribute("playsinline", "");
    audio.muted = !voiceRef.current;
    document.body.appendChild(audio);
    const prepared = preparedRef.current;
    const sender = prepared ? pc.addTrack(prepared.track) : pc.addTransceiver("audio", { direction: "sendrecv" }).sender;
    if (voiceRef.current && prepared) {
      audio.srcObject = new MediaStream([prepared.track]);
      audio.muted = false;
      void audio.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true));
    }
    if (prepared) await prepared.context.resume();
    const dc = pc.createDataChannel("oai-events");
    const session: TalkSession = {
      pc,
      dc,
      audio,
      sender,
      silent: prepared?.track ?? null,
      silentContext: prepared?.context ?? null,
      mic: null,
      remote: null,
      mix: null,
      mixDest: null,
      micNode: null,
      recorder: null,
      chunks: [],
    };
    sessionRef.current = session;
    pc.addEventListener("track", event => {
      const stream = event.streams[0];
      if (!stream) return;
      session.remote = stream;
      session.audio.srcObject = stream;
      if (session.mix && session.mixDest) session.mix.createMediaStreamSource(stream).connect(session.mixDest);
      if (voiceRef.current) {
        session.audio.muted = false;
        void startPlayback(session.audio).then(() => setNeedsTap(false)).catch(() => setNeedsTap(true));
      }
    });
    dc.addEventListener("message", async message => {
      try {
        const raw = typeof message.data === "string" ? message.data : await message.data.text();
        onRealtimeEvent(JSON.parse(raw));
      } catch {
        // Ignore a malformed event frame.
      }
    });
    const opened = new Promise<void>((resolve, reject) => {
      dc.addEventListener("open", () => resolve(), { once: true });
      dc.addEventListener("error", () => reject(new Error("The realtime channel closed.")), { once: true });
    });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIce(pc);
    const response = await fetch(`/api/realtime?voice=${encodeURIComponent(speakerRef.current)}`, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: pc.localDescription?.sdp ?? "",
    });
    if (!response.ok) {
      const failure = await response.text();
      throw new Error(shortError(failure) || "The realtime session could not start.");
    }
    await pc.setRemoteDescription({ type: "answer", sdp: await response.text() });
    await opened;
    if (pc.connectionState === "closed") return;
    dc.send(
      JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          output_modalities: voiceRef.current ? ["audio"] : ["text"],
          ...(voiceRef.current ? { audio: { output: audioOutput() } } : {}),
        },
      }),
    );
  };

  const ensureRecorder = (session: TalkSession) => {
    if (session.recorder || typeof MediaRecorder === "undefined" || !preparedRef.current) return;
    const mix = preparedRef.current.mix;
    void mix.resume();
    const mixDest = mix.createMediaStreamDestination();
    session.mix = mix;
    session.mixDest = mixDest;
    if (session.remote) mix.createMediaStreamSource(session.remote).connect(mixDest);
    const recorder = new MediaRecorder(mixDest.stream);
    recorder.addEventListener("dataavailable", event => {
      if (event.data.size === 0) return;
      session.chunks.push(event.data);
      setHasAudio(true);
    });
    recorder.start(1000);
    session.recorder = recorder;
  };

  const beginTalk = async () => {
    if (voiceRef.current) prepareAudio();
    const session = sessionRef.current;
    if (!voiceRef.current || !session?.mic || listeningRef.current) return;
    const track = session.mic.getAudioTracks()[0];
    if (!track) return;
    track.enabled = true;
    if (session.mix && session.mixDest && !session.micNode) {
      session.micNode = session.mix.createMediaStreamSource(session.mic);
      session.micNode.connect(session.mixDest);
    }
    listeningRef.current = true;
    setListening(true);
  };

  const endTalk = () => {
    const session = sessionRef.current;
    if (!listeningRef.current || !session) return;
    const track = session.mic?.getAudioTracks()[0];
    if (track) track.enabled = false;
    session.micNode?.disconnect();
    session.micNode = null;
    listeningRef.current = false;
    setListening(false);
    setMessages(current => [...current, { role: "user", content: spokenPlaceholder }]);
    if (session.dc.readyState !== "open") return;
    session.dc.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    voiceReply.current = window.setTimeout(() => {
      voiceReply.current = null;
      if (session.dc.readyState === "open") session.dc.send(JSON.stringify({ type: "response.create" }));
      setLoading(true);
    }, 2500);
  };

  const beginTalkRef = useRef(beginTalk);
  const endTalkRef = useRef(endTalk);
  beginTalkRef.current = beginTalk;
  endTalkRef.current = endTalk;

  const sendText = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    if (voiceRef.current && navigator.userActivation?.isActive) prepareAudio();
    setError("");
    setLoading(true);
    setInput("");
    setMessages(current => [...current, { role: "user", content: trimmed }]);
    try {
      await ensureSession();
      const session = sessionRef.current;
      if (!session || session.dc.readyState !== "open") throw new Error("The realtime session is not open.");
      const modalities = voiceRef.current ? ["audio"] : ["text"];
      const updated = new Promise<void>(resolve => {
        const timer = window.setTimeout(resolve, 1500);
        updateWaiters.current.push(() => {
          window.clearTimeout(timer);
          resolve();
        });
      });
      session.dc.send(
        JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            output_modalities: modalities,
            instructions: instructionsFor(trimmed),
            ...(modalities[0] === "audio" ? { audio: { output: audioOutput() } } : {}),
          },
        }),
      );
      await updated;
      session.dc.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: { type: "message", role: "user", content: [{ type: "input_text", text: trimmed }] },
        }),
      );
      session.dc.send(JSON.stringify({ type: "response.create", response: { output_modalities: modalities } }));
    } catch (caught) {
      setLoading(false);
      setError(caught instanceof Error ? caught.message : "The teacher could not reply.");
    }
  };

  const sendTextRef = useRef(sendText);
  sendTextRef.current = sendText;

  const chooseVoice = async (next: boolean) => {
    setError("");
    if (!next) {
      voiceRef.current = false;
      setVoice(false);
      if (listeningRef.current) endTalk();
      const session = sessionRef.current;
      if (!session) return;
      session.audio.muted = true;
      session.audio.pause();
      session.mic?.getTracks().forEach(track => track.stop());
      session.mic = null;
      session.micNode?.disconnect();
      session.micNode = null;
      await session.sender.replaceTrack(session.silent);
      if (session.dc.readyState === "open") {
        session.dc.send(
          JSON.stringify({
            type: "session.update",
            session: { type: "realtime", output_modalities: ["text"] },
          }),
        );
      }
      return;
    }

    try {
      prepareAudio();
      voiceRef.current = true;
      setVoice(true);
      await ensureSession();
      const session = sessionRef.current;
      if (!session) throw new Error("The realtime session is not open.");
      ensureRecorder(session);
      if (session.dc.readyState === "open") {
        session.dc.send(
          JSON.stringify({
            type: "session.update",
            session: { type: "realtime", output_modalities: ["audio"], audio: { output: audioOutput() } },
          }),
        );
      }
      try {
        await startPlayback(session.audio);
        setNeedsTap(false);
      } catch {
        setNeedsTap(true);
      }
      try {
        const mic = await requestMicrophone();
        const track = mic.getAudioTracks()[0];
        track.enabled = false;
        await session.sender.replaceTrack(track);
        session.mic = mic;
        setMicReady(true);
        setError("");
      } catch (caught) {
        setMicReady(false);
        setError(caught instanceof Error ? caught.message : "The microphone could not start. Sati can still speak when you type.");
      }
    } catch (caught) {
      voiceRef.current = false;
      setVoice(false);
      setMicReady(false);
      setError(caught instanceof Error ? caught.message : "Voice could not start. Typing still works.");
    }
  };

  const chooseSpeaker = (next: string) => {
    if (!speakers.includes(next as (typeof speakers)[number])) return;
    const name = next as (typeof speakers)[number];
    speakerRef.current = name;
    setSpeaker(name);
    const session = sessionRef.current;
    if (!session || session.dc.readyState !== "open") return;
    if (heardRef.current) {
      releaseSession();
      if (voiceRef.current) void chooseVoice(true);
      return;
    }
    session.dc.send(
      JSON.stringify({
        type: "session.update",
        session: { type: "realtime", audio: { output: audioOutput() } },
      }),
    );
  };

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || !voiceRef.current || isTypingTarget(event.target)) return;
      event.preventDefault();
      void beginTalkRef.current();
    };
    const up = (event: KeyboardEvent) => {
      if (event.code !== "Space" || !listeningRef.current) return;
      event.preventDefault();
      endTalkRef.current();
    };
    const boot = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-voice-toggle], [data-voice-menu]")) return;
      if (!voiceRef.current || sessionRef.current || openingRef.current) return;
      prepareAudio();
      void chooseVoice(true);
    };
    window.addEventListener("pointerdown", boot);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("keydown", boot);
    return () => {
      window.removeEventListener("pointerdown", boot);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("keydown", boot);
      const session = sessionRef.current;
      session?.mic?.getTracks().forEach(track => track.stop());
      session?.silent?.stop();
      session?.recorder?.stop();
      void session?.mix?.close();
      void session?.silentContext?.close();
      session?.audio.remove();
      session?.pc.close();
      sessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!topicId) return;
    const entry = ontologyById(topicId);
    if (!entry) return;
    let cancel = false;
    const timer = window.setTimeout(() => {
      if (cancel || startedTopic.current) return;
      startedTopic.current = true;
      document.getElementById("talk")?.scrollIntoView({ behavior: "smooth", block: "start" });
      void sendTextRef.current(`${entry.pali} (${entry.gloss}). Please talk with me about this.`);
    }, 0);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [topicId]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendText(input);
  };

  const savePdf = async () => {
    setSavingPdf(true);
    setError("");
    try {
      await downloadChatPdf(messages);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the PDF.");
    } finally {
      setSavingPdf(false);
    }
  };

  const saveAudio = () => {
    const session = sessionRef.current;
    if (!session || session.chunks.length === 0) return;
    const blob = new Blob(session.chunks, { type: session.recorder?.mimeType || "audio/webm" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sati-conversation.webm";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="talk" className="mb-4 rounded-2xl border-base-300 lg:border lg:p-6">
      {messages.map(({ content, role }, index) => (
        <ChatLine key={`${role}-${index}`} role={role} content={content} />
      ))}

      {listening && <p className="clear-both text-sm">Listening…</p>}
      {loading && !listening && <LoadingChatLine />}

      {messages.length < 2 && (
        <span className="mx-auto flex flex-grow clear-both">
          {voice
            ? micReady
              ? "Voice is on. Hold the space bar, or hold Talk, and you can still type."
              : "Voice is on. Click once, or press a key, so the browser can play the sound. Then type or hold Talk."
            : "Voice is off. Type a message in your preferred language."}
        </span>
      )}

      {error && <p className="clear-both text-error">{error}</p>}

      <div className="mt-6 flex clear-both flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold" data-voice-toggle="">
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={voice}
            aria-label={voice ? "Turn voice off" : "Turn voice on"}
            onChange={event => void chooseVoice(event.target.checked)}
          />
          Voice
        </label>
        <select
          aria-label="Sati's voice"
          data-voice-menu=""
          className="rounded-md border border-base-300 bg-base-100 px-2 py-2 text-sm font-semibold text-base-content"
          value={speaker}
          onChange={event => chooseSpeaker(event.target.value)}
        >
          {speakers.map(name => (
            <option key={name} value={name}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </option>
          ))}
        </select>
        {needsTap && voice && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              const prepared = prepareAudio();
              const session = sessionRef.current;
              if (!session) {
                void chooseVoice(true);
                return;
              }
              if (!session.silent) {
                session.silent = prepared.track;
                session.silentContext = prepared.context;
                void session.sender.replaceTrack(prepared.track);
              }
              ensureRecorder(session);
              void startPlayback(session.audio).then(() => setNeedsTap(false)).catch(() => setNeedsTap(true));
            }}
          >
            Hear Sati
          </button>
        )}
        {voice && (
          <button
            type="button"
            className={`btn btn-sm ${listening ? "btn-primary" : "btn-outline"}`}
            onPointerDown={event => {
              event.preventDefault();
              void beginTalk();
            }}
            onPointerUp={() => endTalk()}
            onPointerLeave={() => {
              if (listeningRef.current) endTalk();
            }}
          >
            {listening ? "Listening" : "Hold to talk"}
          </button>
        )}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm font-semibold text-base-content hover:bg-base-200 disabled:opacity-50"
          onClick={() => void savePdf()}
          disabled={loading || savingPdf || messages.length < 2}
        >
          {savingPdf ? "Preparing PDF..." : "Download PDF"}
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm font-semibold text-base-content hover:bg-base-200 disabled:opacity-50"
          onClick={saveAudio}
          disabled={!hasAudio}
        >
          Download audio
        </button>
      </div>

      <form className="mt-4 flex clear-both" onSubmit={onSubmit}>
        <input
          type="text"
          aria-label="chat input"
          required
          className="min-w-0 flex-auto appearance-none rounded-md border border-base-300 bg-base-100 px-3 py-[calc(theme(spacing.2)-1px)] text-sm text-base-content shadow-md placeholder:text-base-content/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
          value={input}
          onChange={event => setInput(event.target.value)}
          placeholder="A Pāli term, a teaching, or a request for meditation guidance..."
        />
        <button type="submit" className="btn btn-primary ml-4 flex-none rounded-md px-3 py-2 text-sm font-semibold">
          Say
        </button>
      </form>
    </div>
  );
}
