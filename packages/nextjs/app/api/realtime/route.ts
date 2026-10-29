import { openRealtimeCall, requireOpenAIKey } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const missingKey = requireOpenAIKey();
  if (missingKey) return missingKey;

  const sdp = await request.text();
  if (!sdp.includes("v=0")) {
    return Response.json({ error: "Expected a WebRTC offer." }, { status: 400 });
  }

  const voice = new URL(request.url).searchParams.get("voice") ?? "echo";
  const upstream = await openRealtimeCall(sdp, voice);
  const answer = await upstream.text();
  if (!upstream.ok) {
    return Response.json({ error: answer || "The realtime session could not start." }, { status: upstream.status });
  }

  return new Response(answer, { headers: { "Content-Type": "application/sdp" } });
}
