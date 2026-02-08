"use client";

import type React from "react";

export interface LogoMarqueeProps {
  title?: string;
  description?: string;
  logos?: Array<{
    name: string;
    logo: React.ReactNode;
  }>;
  speed?: "slow" | "normal" | "fast";
  direction?: "left" | "right";
  pauseOnHover?: boolean;
}

const SPEED_MAP = {
  slow: "60s",
  normal: "40s",
  fast: "20s",
};

export function LogoMarquee({
  title = "Trusted by industry leaders",
  description = "Join thousands of companies already using our platform",
  logos = [],
  speed = "normal",
  direction = "left",
  pauseOnHover = true,
}: LogoMarqueeProps) {
  const animationDuration = SPEED_MAP[speed];
  const animationDirection = direction === "right" ? "reverse" : "normal";

  return (
    <section className="overflow-hidden py-20">
      <style>
        {`
          @keyframes marquee-scroll {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }

          .marquee-track {
            animation: marquee-scroll var(--marquee-duration, 40s) linear infinite;
            animation-direction: var(--marquee-direction, normal);
          }

          .marquee-container:hover .marquee-track {
            animation-play-state: var(--marquee-pause-on-hover, running);
          }

          @media (prefers-reduced-motion: reduce) {
            .marquee-track {
              animation: none;
            }
          }
        `}
      </style>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-2xl text-foreground lg:text-3xl">
            {title}
          </h2>
          <p className="text-foreground/70 text-lg">{description}</p>
        </div>

        <div
          className="marquee-container relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <div
            className="marquee-track flex w-max"
            style={
              {
                "--marquee-duration": animationDuration,
                "--marquee-direction": animationDirection,
                "--marquee-pause-on-hover": pauseOnHover ? "paused" : "running",
              } as React.CSSProperties
            }
          >
            {logos.map((logo, index) => (
                <div
                  className="flex shrink-0 items-center justify-center px-12 py-5 opacity-90 transition-opacity duration-200 *:fill-foreground hover:opacity-100"
                  key={`first-${logo.name}-${index}`}
                >
                  {logo.logo}
                </div>
            ))}
            {logos.map((logo, index) => (
                <div
                  className="flex shrink-0 items-center justify-center px-12 py-5 opacity-90 transition-opacity duration-200 *:fill-foreground hover:opacity-100"
                  key={`second-${logo.name}-${index}`}
                >
                  {logo.logo}
                </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LogoMarquee;
