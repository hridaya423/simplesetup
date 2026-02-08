"use client";

import { useRef } from "react";
import type { MouseEvent, ReactNode } from "react";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
};

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(255, 152, 164, 0.26)",
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) {
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
    cardRef.current.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <div ref={cardRef} onMouseMove={handleMouseMove} className={cx("card-spotlight", className)}>
      {children}
    </div>
  );
}
