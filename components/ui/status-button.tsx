"use client";

import { useEffect, useMemo, useState } from "react";

type ButtonState = "idle" | "loading" | "success";

type StatusButtonProps = {
  className?: string;
  idleLabel?: string;
  loadingLabel?: string;
  successLabel?: string;
};

export default function StatusButton({
  className,
  idleLabel = "Save setup",
  loadingLabel = "Saving",
  successLabel = "Saved",
}: StatusButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");

  useEffect(() => {
    if (state === "idle") {
      return;
    }

    const firstTimer = setTimeout(() => {
      setState((current) => (current === "loading" ? "success" : current));
    }, 1200);

    const secondTimer = setTimeout(() => {
      setState("idle");
    }, 3100);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
    };
  }, [state]);

  const label = useMemo(() => {
    switch (state) {
      case "loading":
        return loadingLabel;
      case "success":
        return successLabel;
      default:
        return idleLabel;
    }
  }, [idleLabel, loadingLabel, state, successLabel]);

  return (
    <button
      type="button"
      className={`status-button ${className ?? ""}`.trim()}
      disabled={state !== "idle"}
      onClick={() => {
        setState("loading");
      }}
    >
      <span aria-live="polite">{label}</span>
      {state === "loading" ? <span className="status-spinner" /> : null}
      {state === "success" ? <span className="status-check">✓</span> : null}
    </button>
  );
}
