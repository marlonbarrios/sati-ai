import { ontologyContextFor } from "@/lib/ontology";
import { createChatCompletion, requireOpenAIKey, streamChatText } from "@/lib/openai";
import { ChatMessage } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const missingKey = requireOpenAIKey();
  if (missingKey) return missingKey;

  const body = await request.json();
  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  const messages: ChatMessage[] = incoming
    .filter(
      (message: ChatMessage) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-10);

  if (messages.length === 0) {
    return Response.json({ error: "Send a message to begin." }, { status: 400 });
  }

  const ontologyNote = ontologyContextFor(messages.map(message => message.content).join("\n"));
  const completion = await createChatCompletion(messages, true, ontologyNote);
  if (!completion.ok) {
    const detail = await completion.text();
    return Response.json({ error: detail || "OpenAI request failed." }, { status: completion.status });
  }

  return new Response(streamChatText(completion), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
