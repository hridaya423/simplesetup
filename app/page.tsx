"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LogoMarquee } from "../components/ui/smoothui/logo-cloud-3";

interface CopyButtonProps {
  text: string;
  className?: string;
  ariaLabel?: string;
}

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


function CopyButton({
  text,
  className = "",
  ariaLabel = "Copy to clipboard",
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setShowTooltip(true);
      setError(null);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsCopied(false);
        setShowTooltip(false);
      }, 2000);
    } catch {
      setError("Failed to copy");
      setShowTooltip(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setError(null);
        setShowTooltip(false);
      }, 2000);
    }
  }, [text]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      className={`copy-button ${className}`}
      onClick={handleCopy}
      aria-label={ariaLabel}
      aria-live="polite"
      type="button"
    >
      <svg
        className="copy-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {isCopied ? (
          <>
            <polyline points="20 6 9 17 4 12" />
          </>
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
      <span
        className={`copy-tooltip ${showTooltip ? "visible" : ""}`}
        role="status"
      >
        {error || (isCopied ? "Copied!" : "Copy")}
      </span>
    </button>
  );
}

function NavCTA() {
  const [isCopied, setIsCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText("npm install -g simplesetup");
      setIsCopied(true);
      setShowTooltip(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsCopied(false);
        setShowTooltip(false);
      }, 2000);
    } catch {
      setShowTooltip(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
      }, 2000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="nav-cta-wrapper">
      <button className="nav-cta" onClick={handleCopy} type="button">
        <span className="nav-cta-text">$ install</span>
      </button>
      {showTooltip && (
        <span className="nav-cta-tooltip">
          {isCopied ? "Copied!" : "Copy command"}
        </span>
      )}
    </div>
  );
}

function ToolCommandBlock({
  tool,
  index,
  isInView,
}: {
  tool: (typeof tools)[0];
  index: number;
  isInView: boolean;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const command = `simplesetup install ${tool.name.split(" ")[0].toLowerCase()} --ssl`;

  return (
    <div
      className={`tool-command-wrapper ${isInView ? "animate-in" : ""}`}
      style={{
        transitionDelay: prefersReducedMotion ? "0ms" : `${index * 100}ms`,
      }}
    >
      <code className="tool-command-code">
        <span className="dollar" style={{ color: "var(--term-green)" }}>
          $
        </span>{" "}
        <span className="cmd">
          simplesetup install {tool.name.split(" ")[0].toLowerCase()}
        </span>{" "}
        <span className="flag">--ssl</span>
      </code>
      <CopyButton text={command} ariaLabel={`Copy ${tool.name} install command`} />
    </div>
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

interface OnboardingConfig {
  tool: string;
  exposeToInternet: boolean;
  enableSSL: boolean;
  autoConfigure: boolean;
  securityLevel: 'basic' | 'strict' | 'custom';
  features: string[];
}

function OnboardingWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<OnboardingConfig>({
    tool: '',
    exposeToInternet: false,
    enableSSL: true,
    autoConfigure: true,
    securityLevel: 'basic',
    features: []
  });
  const [generatedCommand, setGeneratedCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const tools = [
    { id: 'n8n', name: 'n8n', desc: 'Workflow automation', icon: 'n8' },
    { id: 'umami', name: 'Umami', desc: 'Privacy analytics', icon: 'Um' },
    { id: 'posthog', name: 'PostHog', desc: 'Product analytics', icon: 'PH' },
    { id: 'openclaw', name: 'OpenClaw', desc: 'Agent runtime', icon: 'OC' }
  ];

  const generateCommand = () => {
    let cmd = `npx simplesetup install ${config.tool}`;
    if (config.exposeToInternet) cmd += ' --public';
    if (config.enableSSL) cmd += ' --ssl';
    if (!config.autoConfigure) cmd += ' --manual';
    cmd += ` --security=${config.securityLevel}`;
    if (config.features.length > 0) {
      cmd += ` --features=${config.features.join(',')}`;
    }
    return cmd;
  };

  const handleGenerate = () => {
    const cmd = generateCommand();
    setGeneratedCommand(cmd);
    setStep(4);
  };

  const handleRun = () => {
    setIsRunning(true);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button 
        className="btn-primary onboarding-trigger" 
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <span>Configure Setup</span>
        <span className="btn-arrow">→</span>
      </button>
    );
  }

  return (
    <div className="onboarding-modal">
      <div className="onboarding-backdrop" onClick={() => !isRunning && setIsOpen(false)} />
      <div className="onboarding-content">
        <div className="onboarding-header">
          <h3>Setup Configuration</h3>
          <button className="close-btn" onClick={() => setIsOpen(false)} type="button">×</button>
        </div>

        <div className="onboarding-progress">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`progress-step ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}>
              <div className="step-number">{s < step ? '✓' : s}</div>
              <div className="step-label">
                {s === 1 && 'Select Tool'}
                {s === 2 && 'Network'}
                {s === 3 && 'Security'}
                {s === 4 && 'Command'}
              </div>
            </div>
          ))}
        </div>

        <div className="onboarding-body">
          {step === 1 && (
            <div className="step-content">
              <h4>Choose your tool</h4>
              <div className="tool-selection">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    className={`tool-option ${config.tool === tool.id ? 'selected' : ''}`}
                    onClick={() => setConfig({ ...config, tool: tool.id })}
                    type="button"
                  >
                    <span className="tool-icon">{tool.icon}</span>
                    <span className="tool-name">{tool.name}</span>
                    <span className="tool-desc">{tool.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h4>Network Configuration</h4>
              <div className="config-options">
                <label className="config-option">
                  <input
                    type="checkbox"
                    checked={config.exposeToInternet}
                    onChange={(e) => setConfig({ ...config, exposeToInternet: e.target.checked })}
                  />
                  <span className="checkmark" />
                  <div className="option-info">
                    <span className="option-label">Expose to Internet</span>
                    <span className="option-desc">Make accessible from the web (requires SSL)</span>
                  </div>
                </label>

                <label className="config-option">
                  <input
                    type="checkbox"
                    checked={config.enableSSL}
                    onChange={(e) => setConfig({ ...config, enableSSL: e.target.checked })}
                  />
                  <span className="checkmark" />
                  <div className="option-info">
                    <span className="option-label">Enable SSL</span>
                    <span className="option-desc">Auto-generate SSL certificates</span>
                  </div>
                </label>

                <label className="config-option">
                  <input
                    type="checkbox"
                    checked={config.autoConfigure}
                    onChange={(e) => setConfig({ ...config, autoConfigure: e.target.checked })}
                  />
                  <span className="checkmark" />
                  <div className="option-info">
                    <span className="option-label">Auto-configure</span>
                    <span className="option-desc">Automatically optimize settings</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h4>Security Level</h4>
              <div className="security-options">
                {(['basic', 'strict', 'custom'] as const).map((level) => (
                  <button
                    key={level}
                    className={`security-option ${config.securityLevel === level ? 'selected' : ''}`}
                    onClick={() => setConfig({ ...config, securityLevel: level })}
                    type="button"
                  >
                    <span className="security-name">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                    <span className="security-desc">
                      {level === 'basic' && 'Standard security, quick setup'}
                      {level === 'strict' && 'Enhanced security, firewall rules'}
                      {level === 'custom' && 'Manual security configuration'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-content">
              <h4>Generated Command</h4>
              <div className="command-preview">
                <code>{generatedCommand}</code>
                <CopyButton text={generatedCommand} ariaLabel="Copy generated command" />
              </div>
              <p className="command-help">Run this command to set up your {config.tool} instance</p>
            </div>
          )}
        </div>

        <div className="onboarding-footer">
          {step > 1 && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)} type="button">
              Back
            </button>
          )}
          {step < 3 ? (
            <button 
              className="btn-primary" 
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !config.tool}
              type="button"
            >
              Continue
            </button>
          ) : step === 3 ? (
            <button className="btn-primary" onClick={handleGenerate} type="button">
              Generate Command
            </button>
          ) : (
            <button className="btn-primary" onClick={handleRun} type="button">
              Run Setup
            </button>
          )}
        </div>
      </div>

      {isRunning && <TUIRunner command={generatedCommand} onClose={() => setIsRunning(false)} />}
    </div>
  );
}

interface TUIRunnerProps {
  command: string;
  onClose: () => void;
}

function TUIRunner({ command, onClose }: TUIRunnerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'running' | 'success' | 'error'>('running');
  const [currentStep, setCurrentStep] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const steps = [
    'Initializing setup...',
    'Checking prerequisites...',
    'Downloading tool images...',
    'Configuring environment...',
    'Setting up SSL certificates...',
    'Starting services...',
    'Running health checks...',
    'Finalizing installation...'
  ];

  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setStatus('success');
      }
      setProgress(Math.min(currentProgress, 100));
      
      const stepIndex = Math.floor((currentProgress / 100) * steps.length);
      if (stepIndex !== currentStep && stepIndex < steps.length) {
        setCurrentStep(stepIndex);
        setLogs(prev => [...prev, `✓ ${steps[stepIndex]}`]);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="tui-runner">
      <div className="tui-backdrop" />
      <div className="tui-window">
        <div className="tui-header">
          <div className="tui-title">
            <span className="tui-dot running" />
            simplesetup
          </div>
          <button className="tui-close" onClick={onClose} type="button">×</button>
        </div>

        <div className="tui-body">
          <div className="tui-command">
            <span className="prompt">$</span>
            <span className="command">{command}</span>
          </div>

          <div className="tui-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>

          <div className="tui-current-step">
            {currentStep < steps.length ? steps[currentStep] : 'Complete!'}
          </div>

          <div className="tui-logs">
            {logs.map((log, i) => (
              <div key={i} className="tui-log">{log}</div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {status === 'success' && (
            <div className="tui-success">
              <div className="success-icon">✓</div>
              <div className="success-text">Setup complete!</div>
              <div className="success-url">https://your-domain.com</div>
              <button className="btn-primary" onClick={onClose} type="button">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolCard({
  tool,
  index,
  isInView,
}: {
  tool: (typeof tools)[0];
  index: number;
  isInView: boolean;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <article
      className={`tool-card ${isInView ? "animate-in" : ""}`}
      style={{
        transitionDelay: prefersReducedMotion ? "0ms" : `${index * 100}ms`,
      }}
    >
      <div className="tool-card-header">
        <span className="tool-icon">{tool.icon}</span>
        <span className="tool-type">{tool.type}</span>
      </div>

      <h3 className="tool-name">{tool.name}</h3>
      <p className="tool-description">{tool.description}</p>

      <ToolCommandBlock tool={tool} index={index} isInView={isInView} />
    </article>
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
  const titles = ["Initialize", "Install", "Deploy"];

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
          <span className="dollar">$</span>
          {step.command}
        </p>
        <p className="step-description">{step.description}</p>
      </div>
    </div>
  );
}

function CTACopyButton() {
  const [feedback, setFeedback] = useState<"copied" | "failed" | null>(null);
  const command = "npx simplesetup init";
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setFeedback("copied");

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
      }, 2000);
    } catch {
      setFeedback("failed");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
      }, 2000);
    }
  }, [command]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="cta-button-wrapper">
      <button
        className="cta-button-terminal"
        onClick={handleCopy}
        aria-label="Copy npx command"
        type="button"
      >
        <span className="cta-command">
          <span className="dollar">$</span>
          <span className="cmd">{command}</span>
        </span>
        <span className="cta-copy-pill">
          {feedback === "copied" ? "Copied" : "Copy"}
        </span>
      </button>
      {feedback === "failed" ? (
        <span className="cta-tooltip visible">Copy failed</span>
      ) : null}
    </div>
  );
}


const tools = [
  {
    name: "n8n",
    type: "Automation",
    description:
      "Deploy workflows with SSL, queue mode, and health checks already wired.",
    command: "simplesetup install n8n --ssl --domain ops.example.com",
    icon: "n8",
  },
  {
    name: "Umami",
    type: "Analytics",
    description:
      "Launch privacy-first analytics with a hardened Postgres setup in one pass.",
    command: "simplesetup install umami --postgres --timezone UTC",
    icon: "Um",
  },
  {
    name: "PostHog",
    type: "Product Data",
    description:
      "Run events, feature flags, and product analytics on your own infrastructure.",
    command: "simplesetup install posthog --mode self-hosted",
    icon: "PH",
  },
  {
    name: "OpenClaw",
    type: "Agent Runtime",
    description:
      "Bring local agent orchestration online with clear runtime and storage defaults.",
    command: "simplesetup install openclaw --runtime docker",
    icon: "OC",
  },
  {
    name: "Supabase",
    type: "Database",
    description:
      "Deploy the open-source Firebase alternative with Postgres, Auth, and Realtime.",
    command: "simplesetup install supabase --ssl --domain db.example.com",
    icon: "Sb",
  },
  {
    name: "Ghost",
    type: "Publishing",
    description:
      "Deploy professional publishing platform with memberships and newsletters.",
    command: "simplesetup install ghost --domain blog.example.com",
    icon: "Gh",
  },
  {
    name: "Plausible",
    type: "Analytics",
    description:
      "Lightweight, privacy-focused Google Analytics alternative with dashboard.",
    command: "simplesetup install plausible --ssl --domain analytics.example.com",
    icon: "Pl",
  },
  {
    name: "Metabase",
    type: "Business Intelligence",
    description:
      "Deploy business intelligence and analytics with SQL and visual query builder.",
    command: "simplesetup install metabase --domain bi.example.com",
    icon: "Mb",
  },
  {
    name: "Grafana",
    type: "Observability",
    description:
      "Set up observability platform with metrics, logs, and tracing dashboards.",
    command: "simplesetup install grafana --domain metrics.example.com",
    icon: "Gf",
  },
  {
    name: "MinIO",
    type: "Storage",
    description:
      "Deploy S3-compatible object storage for high-performance data lakes.",
    command: "simplesetup install minio --domain storage.example.com",
    icon: "Mn",
  },
  {
    name: "Redpanda",
    type: "Streaming",
    description:
      "Set up Kafka-compatible event streaming platform with lower latencies.",
    command: "simplesetup install redpanda --domain stream.example.com",
    icon: "Rp",
  },
  {
    name: "GitLab",
    type: "DevOps",
    description:
      "Deploy Git repository management, CI/CD, and DevOps lifecycle platform.",
    command: "simplesetup install gitlab --domain git.example.com",
    icon: "Gl",
  },
  {
    name: "Mastodon",
    type: "Social",
    description:
      "Set up decentralized social network server with ActivityPub federation.",
    command: "simplesetup install mastodon --domain social.example.com",
    icon: "Ma",
  },
  {
    name: "Nextcloud",
    type: "Productivity",
    description:
      "Deploy content collaboration platform with files, docs, and calendars.",
    command: "simplesetup install nextcloud --domain cloud.example.com",
    icon: "Nc",
  },
  {
    name: "Outline",
    type: "Documentation",
    description:
      "Set up team knowledge base and wiki with real-time collaborative editing.",
    command: "simplesetup install outline --domain docs.example.com",
    icon: "Ol",
  },
  {
    name: "Appwrite",
    type: "Backend",
    description:
      "Deploy open-source backend-as-a-service with auth, databases, and storage.",
    command: "simplesetup install appwrite --domain backend.example.com",
    icon: "Aw",
  },
  {
    name: "PocketBase",
    type: "Backend",
    description:
      "Set up open-source backend in one file with realtime database and auth.",
    command: "simplesetup install pocketbase --domain api.example.com",
    icon: "Pb",
  },
  {
    name: "Directus",
    type: "CMS",
    description:
      "Deploy headless CMS that wraps any SQL database with REST and GraphQL.",
    command: "simplesetup install directus --domain cms.example.com",
    icon: "Dr",
  },
  {
    name: "Strapi",
    type: "CMS",
    description:
      "Set up Node.js headless CMS with customizable API and admin panel.",
    command: "simplesetup install strapi --domain content.example.com",
    icon: "St",
  },
  {
    name: "Penpot",
    type: "Design",
    description:
      "Deploy open-source design and prototyping platform for product teams.",
    command: "simplesetup install penpot --domain design.example.com",
    icon: "Pp",
  },
];

const heroTools = ["n8n", "OpenClaw", "Supabase", "PostHog", "Grafana"];

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
    command: "simplesetup init",
    description: "Connect your server and validate the environment.",
  },
  {
    number: "02",
    command: "simplesetup install <tool>",
    description: "Choose from 20+ self-hosted tools including Supabase, Grafana, GitLab, and more.",
  },
  {
    number: "03",
    command: "Live at https://your-domain.com",
    description: "Your tool is deployed and ready to use.",
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
                Deploy 20+ open-source tools like Supabase, Grafana, GitLab, and
                n8n with one clean command. No Docker knowledge required.
              </p>

              <div className="hero-actions">
                <a href="#tools" className="btn-primary">
                  Explore tools
                </a>
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
            title="Supported tools"
            description="One command deployment for 20+ self-hosted tools"
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
                Run one command to initialize SimpleSetup, then pick any stack in the
                guided flow.
              </p>

              <CTACopyButton />
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
