"use client";

import React from "react";

export function Tooltip({ content, children }: { content: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max max-w-[320px] -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-white/90 shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
        {content}
      </span>
    </span>
  );
}

