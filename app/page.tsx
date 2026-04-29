"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LogoMarquee } from "../components/ui/smoothui/logo-cloud-3";

interface TerminalProps {
  isAnimated?: boolean;
}

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}


function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [React.RefObject<T | null>, boolean] {
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isInView];
}


function NavCTA() {
  return (
    <a
      href="https://github.com/hridaya423/simplesetup/releases/latest"
      target="_blank"
      rel="noopener noreferrer"
      className="nav-cta"
    >
      <span className="nav-cta-text">Download</span>
    </a>
  );
}

const TERMINAL_FLAGS = [
  { text: " --ssl", delay: 50 },
  { text: " --domain", delay: 50 },
  { text: " example.com", delay: 30 },
];

function Terminal({ isAnimated = true }: TerminalProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [showLine, setShowLine] = useState(0);
  const [typedCommand, setTypedCommand] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const fullCommand = "simplesetup install n8n";

  useEffect(() => {
    if (!isAnimated || prefersReducedMotion) {
      setShowLine(10);
      setTypedCommand(`${fullCommand}${TERMINAL_FLAGS.map((f) => f.text).join("")}`);
      return;
    }

    let currentText = "";
    let currentFlagIndex = 0;
    let charIndex = 0;
    let isTypingFlags = false;

    const typeNextChar = () => {
      if (!isTypingFlags) {
        if (charIndex < fullCommand.length) {
          currentText += fullCommand[charIndex];
          setTypedCommand(currentText);
          charIndex++;
          setTimeout(typeNextChar, 30 + Math.random() * 20);
        } else {
          isTypingFlags = true;
          charIndex = 0;
          setTimeout(typeNextChar, 200);
        }
      } else if (currentFlagIndex < TERMINAL_FLAGS.length) {
        const flag = TERMINAL_FLAGS[currentFlagIndex];
        if (charIndex < flag.text.length) {
          currentText += flag.text[charIndex];
          setTypedCommand(currentText);
          charIndex++;
          setTimeout(typeNextChar, flag.delay + Math.random() * 15);
        } else {
          currentFlagIndex++;
          charIndex = 0;
          setTimeout(typeNextChar, 150);
        }
      } else {
        setIsTyping(false);
      }
    };

    const startTyping = setTimeout(() => {
      setIsTyping(true);
      typeNextChar();
    }, 500);

    return () => clearTimeout(startTyping);
  }, [isAnimated, prefersReducedMotion, TERMINAL_FLAGS]);

  useEffect(() => {
    if (!isAnimated || prefersReducedMotion) {
      setShowLine(10);
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    const startLines = setTimeout(() => {
      for (let i = 0; i <= 8; i++) {
        const timer = setTimeout(() => setShowLine(i), i * 600);
        timers.push(timer);
      }
    }, 2500);

    timers.push(startLines);

    return () => timers.forEach(clearTimeout);
  }, [isAnimated, prefersReducedMotion]);

  const renderTypedCommand = () => {
    const parts = typedCommand.match(/(simplesetup install n8n)( --ssl)?( --domain)?( ops\.example\.com)?/);
    if (!parts) return typedCommand;

    return (
      <>
        <span className="base-cmd">{parts[1] || ""}</span>
        {parts[2] && <span className="terminal-flag">{parts[2]}</span>}
        {parts[3] && <span className="terminal-flag">{parts[3]}</span>}
        {parts[4] && <span className="terminal-value">{parts[4]}</span>}
      </>
    );
  };

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-controls">
          <span className="terminal-dot close" />
          <span className="terminal-dot minimize" />
          <span className="terminal-dot maximize" />
        </div>
        <span className="terminal-title">simplesetup — zsh</span>
        <div style={{ width: 52 }} />
      </div>
      <div className="terminal-body">
        <div className="terminal-line">
          <span className="terminal-prompt">$</span>
          <span className="terminal-command typing-line">
            {renderTypedCommand()}
            <span
              className={`typing-cursor ${isTyping ? "typing" : ""}`}
              aria-hidden="true"
            />
          </span>
        </div>

        {showLine >= 1 && (
          <div
            className="terminal-output animate-fade-in"
            style={{ marginTop: "0.5rem" }}
          >
            <div className="progress-bar">
              <span className="progress-fill">■■■■■■■■■■</span>
              <span className="progress-empty">□□□□□□□□□□</span>
              <span
                style={{ marginLeft: "0.5rem", color: "var(--term-gray)" }}
              >
                Initializing...
              </span>
            </div>
          </div>
        )}

        {showLine >= 2 && (
          <div className="terminal-output success animate-fade-in">
            ✓ Checking prerequisites
          </div>
        )}

        {showLine >= 3 && (
          <div className="terminal-output success animate-fade-in">
            ✓ Generating SSL certificates
          </div>
        )}

        {showLine >= 4 && (
          <div className="terminal-output success animate-fade-in">
            ✓ Configuring Docker Compose
          </div>
        )}

        {showLine >= 5 && (
          <div
            className="terminal-output animate-fade-in"
            style={{ marginTop: "0.25rem" }}
          >
            <div className="progress-bar">
              <span className="progress-fill">■■■■■■■■■■■■■■■■</span>
              <span className="progress-empty">□□□□</span>
              <span
                style={{ marginLeft: "0.5rem", color: "var(--term-gray)" }}
              >
                Deploying...
              </span>
            </div>
          </div>
        )}

        {showLine >= 6 && (
          <div className="terminal-output success animate-fade-in">
            ✓ Starting services
          </div>
        )}

        {showLine >= 7 && (
          <div className="terminal-output success animate-fade-in">
            ✓ Health check passed
          </div>
        )}

        {showLine >= 8 && (
          <>
            <div style={{ marginTop: "0.75rem" }} />
            <div
              className="terminal-output accent animate-fade-in"
              style={{ fontWeight: 500 }}
            >
              n8n deployed at{" "}
              <a
                href="https://example.com"
                className="terminal-link"
                style={{ color: "var(--term-cyan)", textDecoration: "underline" }}
              >
                https://example.com
              </a>
            </div>
            <div style={{ marginTop: "0.75rem" }} />
            <div className="terminal-line">
              <span className="terminal-prompt">$</span>
              <span className="terminal-cursor" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StepItem({
  step,
  index,
  isInView,
}: {
  step: (typeof steps)[0];
  index: number;
  isInView: boolean;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const titles = ["Download", "Run", "Ready"];

  return (
    <div
      className={`step ${isInView ? "animate-in" : ""}`}
      style={{
        transitionDelay: prefersReducedMotion ? "0ms" : `${index * 150}ms`,
      }}
    >
      <div className="step-number">{step.number}</div>
      <div className="step-content">
        <h3 className="step-title">{titles[index]}</h3>
        <p className="step-command">
          <span className="dollar">$ </span>
          {step.command}
        </p>
        <p className="step-description">{step.description}</p>
      </div>
    </div>
  );
}

function CTACopyButton() {
  return (
    <a
      href="https://github.com/hridaya423/simplesetup/releases/latest"
      target="_blank"
      rel="noopener noreferrer"
      className="btn-primary"
    >
      Get the latest release
    </a>
  );
}

function LaunchTuiButton() {
  return (
    <a
      href="https://github.com/hridaya423/simplesetup/releases/latest"
      target="_blank"
      rel="noopener noreferrer"
      className="btn-primary"
    >
      Download CLI
    </a>
  );
}
const heroTools = ["OpenClaw"];

const logoTools = [
  { name: "n8n", slug: "n8n" },
  { name: "Supabase", slug: "supabase" },
  { name: "PostHog", slug: "posthog" },
  { name: "Grafana", slug: "grafana" },
  { name: "GitLab", slug: "gitlab" },
  { name: "Ghost", slug: "ghost" },
  { name: "Nextcloud", slug: "nextcloud" },
  { name: "Appwrite", slug: "appwrite" },
  { name: "Strapi", slug: "strapi" },
  { name: "Directus", slug: "directus" },
  { name: "Mastodon", slug: "mastodon" },
  { name: "MinIO", slug: "minio" },
].map((tool) => ({
  name: tool.name,
  logo: (
    <span className="logo-chip" aria-label={tool.name} title={tool.name}>
      <img
        src={`https://cdn.simpleicons.org/${tool.slug}/f8f8f2`}
        alt={tool.name}
        className="logo-chip-image"
        loading="lazy"
      />
    </span>
  ),
}));

const steps = [
  {
    number: "01",
    command: "download simplesetup",
    description: "Grab the binary for your platform from GitHub Releases. No install needed.",
  },
  {
    number: "02",
    command: "./simplesetup --tool openclaw",
    description: "Launch the TUI, pick your auth provider, channels, and run the guided OpenClaw wizard.",
  },
  {
    number: "03",
    command: "openclaw status --deep",
    description: "OpenClaw is set up with your config, channels, and diagnostics ready to go.",
    isSuccess: true,
  },
];

export default function Home() {
  const [stepsRef, stepsInView] = useInView<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <div className="site-shell">
      <div className="noise-overlay" aria-hidden="true" />

      <div className="top-banner">
        <span className="top-banner-text">
          Only OpenClaw flow is setup right now — more tools coming soon
        </span>
      </div>

      <header className="nav-shell">
        <nav className="nav-inner">
          <a href="#" className="brand-text">
            simple<span>setup</span>
          </a>

          <div className="nav-links">
            <a href="#tools">Tools</a>
            <a href="#how-it-works">How it works</a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>

          <NavCTA />
        </nav>
      </header>

      <main className="main-shell">
        <section className="hero-section">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="hero-eyebrow">
                {"OPEN SOURCE • SELF-HOSTED • ONE COMMAND"}
              </span>

              <h1 className="hero-title">
                <span className="hero-title-line">simple</span>
                <span className="hero-title-line hero-title-accent">setup</span>
              </h1>

              <p className="hero-text">
                Guided OpenClaw setup through a terminal UI. Pick your auth,
                channels, and deploy with real commands. No config files to write.
              </p>

              <div className="hero-actions">
                <LaunchTuiButton />
                <a href="#how-it-works" className="btn-secondary">
                  See how it works
                </a>
              </div>

              <div className="tool-tags">
                {heroTools.map((tool) => (
                  <span key={tool} className="tool-tag">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            <div className="hero-terminal">
              <Terminal isAnimated={true} />
            </div>
          </div>
        </section>

        <section id="tools">
          <LogoMarquee
            title="On the roadmap"
            description="OpenClaw is ready now. More self-hosted tools coming next."
            logos={logoTools}
            speed="slow"
            pauseOnHover={true}
          />
        </section>

        <section id="how-it-works" className="section">
          <div className="section-header">
            <span className="section-eyebrow">Getting Started</span>
            <h2 className="section-title">How it works</h2>
            <p className="section-description">
              Three simple steps from zero to deployed. No complex
              configuration, no surprises.
            </p>
          </div>

          <div ref={stepsRef} className="steps-container">
            {steps.map((step, index) => (
              <StepItem
                key={step.number}
                step={step}
                index={index}
                isInView={stepsInView}
              />
            ))}
          </div>
        </section>

        <section className="section">
          <div className="cta-section">
            <div className="cta-content">
              <h2 className="cta-title">Start your first setup now</h2>
              <p className="cta-text">
                Download the CLI for your platform, run it, and follow the guided OpenClaw
                setup flow.
              </p>

              <CTACopyButton />
              <p className="cta-link-row">
                Or build from source with <code>npm run build:cli</code>
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="download-section">
            <span className="section-eyebrow">Install</span>
            <h2 className="section-title">Get the CLI</h2>
            <p className="section-description">
              Download a standalone binary for your platform. No dependencies required.
            </p>

            <div className="install-methods">
              <div className="install-card">
                <div className="install-card-header">
                  <span className="install-icon">⬇</span>
                  <span className="install-type">Binary</span>
                </div>
                <h3 className="install-title">GitHub Releases</h3>
                <p className="install-description">
                  Standalone binaries. No Node.js required. Works offline.
                </p>
                <div className="download-links">
                  <a
                    href="https://github.com/hridaya423/simplesetup/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    macOS (Apple Silicon)
                  </a>
                  <a
                    href="https://github.com/hridaya423/simplesetup/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    macOS (Intel)
                  </a>
                  <a
                    href="https://github.com/hridaya423/simplesetup/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    Linux (x64)
                  </a>
                  <a
                    href="https://github.com/hridaya423/simplesetup/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    Linux (ARM64)
                  </a>
                  <a
                    href="https://github.com/hridaya423/simplesetup/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    Windows (x64)
                  </a>
                </div>
              </div>

              <div className="install-card">
                <div className="install-card-header">
                  <span className="install-icon">⚒</span>
                  <span className="install-type">Source</span>
                </div>
                <h3 className="install-title">Build from source</h3>
                <p className="install-description">
                  Clone the repo, install deps, and run with Node 20+.
                </p>
                <div className="install-command-wrapper">
                  <code className="install-command-code">
                    <span className="dollar">$</span>
                    <span className="cmd"> git clone https://github.com/hridaya423/simplesetup.git</span>
                  </code>
                </div>
                <div className="install-command-wrapper" style={{ marginTop: "0.5rem" }}>
                  <code className="install-command-code">
                    <span className="dollar">$</span>
                    <span className="cmd"> cd simplesetup && npm install</span>
                  </code>
                </div>
                <div className="install-command-wrapper" style={{ marginTop: "0.5rem" }}>
                  <code className="install-command-code">
                    <span className="dollar">$</span>
                    <span className="cmd"> npm run tui:openclaw</span>
                  </code>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            simple<span>setup</span>
          </div>
          <p className="footer-tagline">
            Self-host open-source tools with one command.
          </p>
          <div className="footer-links">
            <a href="#" className="footer-link">GitHub</a>
            <a href="#" className="footer-link">Twitter</a>
            <a href="#" className="footer-link">Discord</a>
            <a href="#" className="footer-link">Docs</a>
          </div>
        </div>

        <div className="footer-bottom">
          © 2026 SimpleSetup
        </div>
      </footer>
    </div>
  );
}
