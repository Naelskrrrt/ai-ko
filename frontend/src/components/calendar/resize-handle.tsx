"use client";

import React from "react";
import { CalendarEvent } from "@/core/types/calendar";
import clsx from "clsx";

interface ResizeHandleProps {
  event: CalendarEvent;
  type: "top" | "bottom";
  onResizeStart: (
    event: CalendarEvent,
    type: "top" | "bottom",
    e: React.MouseEvent
  ) => void;
  className?: string;
}

export function ResizeHandle({
  event,
  type,
  onResizeStart,
  className,
}: ResizeHandleProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onResizeStart(event, type, e);
  };

  return (
    <div
      className={clsx(
        "resize-handle absolute left-0 right-0 h-4 cursor-ns-resize z-20",
        "hover:bg-white/40 transition-all duration-200",
        "opacity-0 group-hover:opacity-100",
        type === "top" ? "top-0 -mt-2" : "bottom-0 -mb-2",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={(e) => {
        e.currentTarget.style.cursor = "ns-resize";
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.cursor = "ns-resize";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Indicateur visuel plus visible et plus grand */}
      <div
        className={clsx(
          "absolute left-1/2 transform -translate-x-1/2 w-3 h-1 rounded-full",
          "bg-white/90 hover:bg-white transition-colors shadow-sm",
          type === "top" ? "top-1.5" : "bottom-1.5"
        )}
      />
    </div>
  );
}
