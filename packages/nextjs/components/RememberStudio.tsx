"use client";

import { useState } from "react";

export function RememberStudio() {
  const [generatedText, setGeneratedText] = useState("");
  const [imageUrl, setImageUrl] = useState("/loading.gif");
  const [imageModel, setImageModel] = useState("");
  const [canDownload, setCanDownload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setIsLoading(true);
    setError("");
    setCanDownload(false);
    setGeneratedText("");
    setImageModel("");
    setImageUrl("/loading.gif");

    try {
      const response = await fetch("/api/remember", { method: "POST" });
      const data = await response.json();
      if (!response.ok && !data.image) {
        setGeneratedText(data.text || "");
        throw new Error(data.error || "Could not generate this remembrance.");
      }
      setGeneratedText(data.text || "");
      if (data.image) {
        setImageUrl(`data:${data.mediaType || "image/png"};base64,${data.image}`);
        setImageModel(data.imageModel || "");
        setCanDownload(true);
      }
      if (!response.ok) {
        throw new Error(data.error || "Could not generate this remembrance.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate this remembrance.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `sati-remembrance-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          className={`btn btn-primary space-x-3 rounded-full px-10 ${
            isLoading ? "loading before:!mx-0 before:!h-4 before:!w-4" : ""
          }`}
          onClick={() => void generate()}
          disabled={isLoading}
        >
          {isLoading ? "" : "Generate"}
        </button>
        {canDownload && (
          <button className="btn btn-secondary rounded-full px-10" onClick={downloadImage}>
            Download image
          </button>
        )}
      </div>
      {error && <p className="px-5 text-center text-error md:w-1/2">{error}</p>}
      <div className="my-8 rounded border px-5 md:w-1/2">
        <p className="mx-auto my-6 w-3/4 text-center font-bold">{generatedText}</p>
        <div className="mb-4 flex w-full justify-center">
          {/* Generated images are data URLs, so the browser can save them directly. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img width={512} height={512} alt="A remembrance from the three marks" src={imageUrl} />
        </div>
        {imageModel && <p className="mb-6 text-center text-sm">Image model: {imageModel}</p>}
      </div>
    </>
  );
}
