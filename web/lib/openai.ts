import { SATI_SYSTEM_PROMPT } from "@/lib/system-prompt";
import { ChatMessage } from "@/lib/types";

function openaiHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
  };
  if (process.env.OPENAI_API_ORG) {
    headers["OpenAI-Organization"] = process.env.OPENAI_API_ORG;
  }
  return headers;
}

export function requireOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "Missing OPENAI_API_KEY in web/.env.local" }, { status: 500 });
  }
  return null;
}

export function chatModel() {
  return process.env.OPENAI_MODEL || "gpt-6-luna";
}

export function realtimeModel() {
  return process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1";
}

const realtimeVoices = new Set(["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar"]);

export async function openRealtimeCall(sdp: string, voice = "echo") {
  const session = {
    type: "realtime",
    model: realtimeModel(),
    instructions: SATI_SYSTEM_PROMPT,
    output_modalities: ["text"],
    audio: {
      input: {
        transcription: { model: "gpt-4o-mini-transcribe" },
        turn_detection: null,
        noise_reduction: { type: "near_field" },
      },
      output: { voice: realtimeVoices.has(voice) ? voice : "echo", speed: 0.85 },
    },
  };
  const body = new FormData();
  body.set("sdp", sdp);
  body.set("session", JSON.stringify(session));
  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
  };
  if (process.env.OPENAI_API_ORG) headers["OpenAI-Organization"] = process.env.OPENAI_API_ORG;
  return fetch("https://api.openai.com/v1/realtime/calls", { method: "POST", headers, body });
}

function usesReasoning(model: string) {
  return /^(gpt-6|gpt-5|o\d)/.test(model);
}

export async function openAIChat(
  messages: { role: string; content: string }[],
  stream: boolean,
  maxTokens?: number,
) {
  const model = chatModel();
  const limit = maxTokens ?? (process.env.AI_MAX_TOKENS ? parseInt(process.env.AI_MAX_TOKENS, 10) : 1000);
  const body: Record<string, unknown> = {
    model,
    messages,
    stream,
    max_completion_tokens: limit,
  };

  if (usesReasoning(model)) {
    body.reasoning_effort = process.env.OPENAI_REASONING_EFFORT || "low";
  } else {
    body.temperature = process.env.AI_TEMP ? parseFloat(process.env.AI_TEMP) : 0.5;
    body.top_p = 1;
    body.frequency_penalty = 0;
    body.presence_penalty = 0;
  }

  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: openaiHeaders(),
    body: JSON.stringify(body),
  });
}

export async function createChatCompletion(messages: ChatMessage[], stream: boolean, ontologyNote?: string) {
  const system = ontologyNote ? `${SATI_SYSTEM_PROMPT}\n\n${ontologyNote}` : SATI_SYSTEM_PROMPT;
  return openAIChat([{ role: "system", content: system }, ...messages], stream);
}

export function streamChatText(response: Response) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const body = response.body;
  if (!body) {
    return new ReadableStream({
      start(controller) {
        controller.close();
      },
    });
  }

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const text = json.choices?.[0]?.delta?.content || "";
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // Ignore a partial SSE frame and keep reading.
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
