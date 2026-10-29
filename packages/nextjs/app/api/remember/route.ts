import { REMEMBER_PROMPT } from "@/lib/system-prompt";
import { openAIChat, requireOpenAIKey } from "@/lib/openai";

export const maxDuration = 60;

export async function POST() {
  const missingKey = requireOpenAIKey();
  if (missingKey) return missingKey;

  const textResponse = await openAIChat(
    [
      {
        role: "system",
        content: "You write brief Buddhist teaching poems. Stay within the requested length.",
      },
      { role: "user", content: REMEMBER_PROMPT },
    ],
    false,
    500,
  );

  if (!textResponse.ok) {
    const detail = await textResponse.text();
    return Response.json({ error: detail || "Could not write the teaching." }, { status: textResponse.status });
  }

  const textJson = await textResponse.json();
  const text = textJson.choices?.[0]?.message?.content?.trim() || "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };
  if (process.env.OPENAI_API_ORG) {
    headers["OpenAI-Organization"] = process.env.OPENAI_API_ORG;
  }

  const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";
  const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: imageModel,
      prompt: `Black and white, minimalist, pure light, abstract. No words or letters. A contemplative image for this teaching:\n\n${text}`,
      n: 1,
      size: "1024x1024",
      quality: "low",
      output_format: "png",
    }),
  });

  if (!imageResponse.ok) {
    const detail = await imageResponse.text();
    return Response.json(
      { text, error: detail || "The poem was written, but the image could not be generated." },
      { status: imageResponse.status },
    );
  }

  const imageJson = await imageResponse.json();
  const image = imageJson.data?.[0]?.b64_json || "";
  if (!image) {
    return Response.json({ text, error: "The poem was written, but no image came back." }, { status: 502 });
  }

  return Response.json({ text, image, mediaType: "image/png", imageModel });
}
