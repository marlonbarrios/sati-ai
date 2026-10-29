"use client";

import { RefObject, useEffect } from "react";

export const useOutsideClick = (ref: RefObject<HTMLDivElement | null>, callback: () => void) => {
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      if (ref.current && !ref.current.contains(event.target)) callback();
    }

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [ref, callback]);
};
