"use client";

import clsx from "clsx";
import Balancer from "react-wrap-balancer";
import { ChatMessage } from "@/lib/types";

const convertNewLines = (text: string) =>
  text.split("\n").map((line, i) => (
    <span key={i}>
      {line}
      <br />
    </span>
  ));

export const LoadingChatLine = () => (
  <div className="flex min-w-full animate-pulse px-4 py-5 sm:px-6">
    <div className="flex flex-grow space-x-3">
      <div className="min-w-0 flex-1">
        <p className="font-large text-xxl text-base-content">Sati-AI</p>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 h-2 rounded bg-base-300"></div>
            <div className="col-span-1 h-2 rounded bg-base-300"></div>
          </div>
          <div className="h-2 rounded bg-base-300"></div>
        </div>
      </div>
    </div>
  </div>
);

export function ChatLine({ role = "assistant", content }: ChatMessage) {
  if (!content) return null;

  return (
    <div className={role !== "assistant" ? "float-right clear-both" : "float-left clear-both"}>
      <div className="float-right mb-5 rounded-lg bg-base-100 px-4 py-5 shadow-lg ring-1 ring-base-300 sm:px-6">
        <div className="flex space-x-3">
          <div className="flex-1 gap-4">
            <p className="font-large text-xxl text-base-content">{role === "assistant" ? "Sati-AI" : "You"}</p>
            <p className={clsx("text text-base-content", role === "assistant" ? "font-semibold" : "opacity-70")}>
              <Balancer>{convertNewLines(content)}</Balancer>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
