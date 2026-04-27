export type DeploymentMode = "local" | "cloud";
export type RuntimeEngine = "docker" | "podman" | "native";
export type SecurityProfile = "safe-personal" | "safe-team" | "power-user";
export type LocalOs = "macos" | "linux" | "windows-wsl";
export type CloudTarget =
  | "railway"
  | "render"
  | "northflank"
  | "fly"
  | "hetzner"
  | "gcp"
  | "ansible"
  | "nix"
  | "exedev";
export type IntegrationPreset = "starter" | "messaging" | "expanded" | "minimal" | "none";
export type UseCasePack = "starter" | "expanded" | "minimal" | "none";
export type AIProviderId = "openai" | "anthropic" | "openrouter" | "xai" | "groq" | "ollama";
export type ProviderAuthModeId =
  | "api-key"
  | "openai-codex-subscription"
  | "anthropic-setup-token"
  | "local-ollama";

export type ProviderAuthMode = {
  id: ProviderAuthModeId;
  name: string;
  description: string;
  setup: "direct" | "terminal";
  keyEnv?: string;
  terminalCommands?: string[];
  verifyCommand?: string;
};

export type ProviderOption = {
  id: AIProviderId;
  name: string;
  description: string;
  models: string[];
  authModes: ProviderAuthMode[];
};

export type OptionWithMeta<T extends string> = {
  id: T;
  name: string;
  description: string;
};

export const SECURITY_BASELINE_VERSION = "2026.1.30";

export const MODE_OPTIONS: Array<OptionWithMeta<DeploymentMode>> = [
  {
    id: "local",
    name: "Local setup",
    description: "Fastest path. Keep OpenClaw on your machine while iterating.",
  },
  {
    id: "cloud",
    name: "Cloud setup",
    description: "Deploy to public infrastructure with a domain and region.",
  },
];

export const PRIMARY_GOALS = [
  "Inbox autopilot",
  "Calendar + meeting copilot",
  "Research and monitoring",
  "Support desk assistant",
  "Revenue and finance ops",
  "Founder command center",
];

export const PROVIDERS: ProviderOption[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Latest GPT models and strong coding workflows.",
    models: ["openai/gpt-5.2", "openai/gpt-5.2-chat", "openai/gpt-5.2-codex"],
    authModes: [
      {
        id: "api-key",
        name: "OpenAI API key",
        description: "Direct token from platform.openai.com",
        setup: "direct",
        keyEnv: "OPENAI_API_KEY",
      },
      {
        id: "openai-codex-subscription",
        name: "ChatGPT / Codex subscription",
        description: "Terminal auth-link flow",
        setup: "terminal",
        terminalCommands: [
          "openclaw models auth login --provider openai-codex",
          "openclaw models status --probe",
        ],
        verifyCommand: "openclaw models status --probe",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models for reasoning-heavy assistants.",
    models: [
      "anthropic/claude-opus-4-6",
      "anthropic/claude-sonnet-4-5",
      "anthropic/claude-haiku-4-5",
    ],
    authModes: [
      {
        id: "api-key",
        name: "Anthropic API key",
        description: "Direct token from console.anthropic.com",
        setup: "direct",
        keyEnv: "ANTHROPIC_API_KEY",
      },
      {
        id: "anthropic-setup-token",
        name: "Claude setup-token",
        description: "Subscription auth via terminal setup-token",
        setup: "terminal",
        terminalCommands: [
          "claude setup-token",
          "openclaw models auth paste-token --provider anthropic",
          "openclaw models status --probe",
        ],
        verifyCommand: "openclaw models status --probe",
      },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "One key for many model providers.",
    models: [
      "openrouter/openai/gpt-5.2",
      "openrouter/anthropic/claude-sonnet-4-5",
      "openrouter/x-ai/grok-4.1-fast",
      "openrouter/auto",
    ],
    authModes: [
      {
        id: "api-key",
        name: "OpenRouter API key",
        description: "Direct key from openrouter.ai",
        setup: "direct",
        keyEnv: "OPENROUTER_API_KEY",
      },
    ],
  },
  {
    id: "xai",
    name: "xAI Grok",
    description: "Low-latency Grok variants.",
    models: ["xai/grok-4.1-fast", "xai/grok-4-fast", "xai/grok-code-fast-1"],
    authModes: [
      {
        id: "api-key",
        name: "xAI API key",
        description: "Direct key from x.ai",
        setup: "direct",
        keyEnv: "XAI_API_KEY",
      },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    description: "Speed-first inference.",
    models: [
      "groq/llama-3.3-70b-versatile",
      "groq/deepseek-r1-distill-llama-70b",
      "groq/mixtral-8x7b",
    ],
    authModes: [
      {
        id: "api-key",
        name: "Groq API key",
        description: "Direct key from console.groq.com",
        setup: "direct",
        keyEnv: "GROQ_API_KEY",
      },
    ],
  },
  {
    id: "ollama",
    name: "Local / Ollama",
    description: "Privacy-first local models.",
    models: ["ollama/llama3.3", "ollama/qwen2.5-coder:7b", "ollama/mistral-small3.1"],
    authModes: [
      {
        id: "local-ollama",
        name: "No key needed",
        description: "Connects to local Ollama daemon",
        setup: "direct",
      },
    ],
  },
];

export const RUNTIME_OPTIONS: Array<OptionWithMeta<RuntimeEngine>> = [
  { id: "docker", name: "Docker", description: "Recommended default" },
  { id: "podman", name: "Podman", description: "Rootless container runtime" },
  { id: "native", name: "Native", description: "Bare-metal runtime" },
];

export const LOCAL_OS_OPTIONS: Array<OptionWithMeta<LocalOs>> = [
  { id: "macos", name: "macOS", description: "Best for local dev" },
  { id: "linux", name: "Linux", description: "Stable production-like local path" },
  { id: "windows-wsl", name: "Windows (WSL)", description: "Recommended Windows option" },
];

export const CLOUD_TARGET_OPTIONS: Array<OptionWithMeta<CloudTarget>> = [
  { id: "railway", name: "Railway", description: "Fast managed deployments" },
  { id: "render", name: "Render", description: "Simple managed services" },
  { id: "northflank", name: "Northflank", description: "Production-grade containers" },
  { id: "fly", name: "Fly.io", description: "Global region routing" },
  { id: "hetzner", name: "Hetzner", description: "Low-cost VPS control" },
  { id: "gcp", name: "GCP", description: "Compute Engine workflows" },
  { id: "ansible", name: "Ansible", description: "Infra-as-code rollout" },
  { id: "nix", name: "Nix", description: "Deterministic setup path" },
  { id: "exedev", name: "exe.dev", description: "VM + shell-agent provisioning" },
];

export interface OpenClawWizardState {
  operationMode: "new-install" | "manage-existing";
  manageAction: "add-channel" | "refresh-core" | "repair" | "uninstall";
  uninstallScope: "service-state-workspace" | "full";
  mode: DeploymentMode;
  workspaceName: string;
  primaryGoal: string;
  provider: AIProviderId;
  providerAuthMode: ProviderAuthModeId;
  providerTokenEnvConfirmed: boolean;
  terminalAuthConfirmed: boolean;
  model: string;
  integrationPreset: IntegrationPreset;
  useCasePack: UseCasePack;
  securityProfile: SecurityProfile;
  runtime: RuntimeEngine;
  localOs: LocalOs;
  cloudTarget: CloudTarget;
  cloudRegion: string;
  domain: string;
  cpuCores: number;
  memoryGb: number;
  persistencePath: string;
  adminEmail: string;
  adminPasswordEnvConfirmed: boolean;
  setupTrack: "local-laptop" | "remote-connect";
  authGuidance:
    | "auto"
    | "openai-codex"
    | "openai-key"
    | "anthropic-key"
    | "openrouter-key"
    | "xai-key"
    | "ollama-local"
    | "skip";
  installDaemon: boolean;
  remoteUrl: string;
  providerApiKey: string;
  firstChannel: "dashboard-only" | "telegram" | "whatsapp" | "discord";
  channelToken: string;
  runDoctorAfterSetup: boolean;
  openDashboardAfterSetup: boolean;
}

export type OpenClawExecutionStep = {
  id: string;
  label: string;
  command: string;
  displayCommand?: string;
  env?: Record<string, string>;
  allowFailure?: boolean;
};

export function createDefaultState(): OpenClawWizardState {
  return {
    operationMode: "new-install",
    manageAction: "add-channel",
    uninstallScope: "service-state-workspace",
    mode: "local",
    workspaceName: "Personal Ops Desk",
    primaryGoal: PRIMARY_GOALS[0],
    provider: "openai",
    providerAuthMode: "api-key",
    providerTokenEnvConfirmed: true,
    terminalAuthConfirmed: false,
    model: "openai/gpt-5.2",
    integrationPreset: "starter",
    useCasePack: "starter",
    securityProfile: "safe-personal",
    runtime: "docker",
    localOs: "macos",
    cloudTarget: "railway",
    cloudRegion: "us-east-1",
    domain: "openclaw.example.com",
    cpuCores: 2,
    memoryGb: 4,
    persistencePath: "~/.openclaw",
    adminEmail: "admin@example.com",
    adminPasswordEnvConfirmed: false,
    setupTrack: "local-laptop",
    authGuidance: "skip",
    installDaemon: true,
    remoteUrl: "wss://gateway-host:18789",
    providerApiKey: "",
    firstChannel: "dashboard-only",
    channelToken: "",
    runDoctorAfterSetup: true,
    openDashboardAfterSetup: true,
  };
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function getProviderById(providerId: AIProviderId): ProviderOption {
  return PROVIDERS.find((provider) => provider.id === providerId) ?? PROVIDERS[0];
}

export function getProviderAuthMode(state: OpenClawWizardState): ProviderAuthMode {
  const provider = getProviderById(state.provider);
  return provider.authModes.find((mode) => mode.id === state.providerAuthMode) ?? provider.authModes[0];
}

export function getRecommendedModels(state: OpenClawWizardState): string[] {
  if (state.provider === "openai" && state.providerAuthMode === "openai-codex-subscription") {
    return [
      "openai-codex/gpt-5.3-codex",
      "openai-codex/gpt-5.2-codex",
      "openai-codex/gpt-5.2-chat",
    ];
  }
  return getProviderById(state.provider).models;
}

export function buildOpenClawApplyCommand(state: OpenClawWizardState): string {
  if (state.operationMode === "manage-existing") {
    return "openclaw status --deep";
  }

  const parts = ["openclaw", "onboard", "--non-interactive", "--accept-risk"];

  if (state.setupTrack === "remote-connect") {
    parts.push("--mode", "remote");
    if (state.remoteUrl.trim().length > 0) {
      parts.push("--remote-url", shellQuote(state.remoteUrl.trim()));
    }
    parts.push("--skip-skills", "--skip-search");
    return parts.join(" ");
  }

  parts.push("--mode", "local");
  parts.push("--flow", "quickstart");
  parts.push("--gateway-port", "18789", "--gateway-bind", "loopback");
  parts.push("--secret-input-mode", "ref");

  if (state.authGuidance === "openai-codex") {
    parts.push("--auth-choice", "openai-codex");
  } else if (state.authGuidance === "openai-key") {
    parts.push("--auth-choice", "openai-api-key");
  } else if (state.authGuidance === "anthropic-key") {
    parts.push("--auth-choice", "apiKey");
  } else if (state.authGuidance === "openrouter-key") {
    parts.push("--auth-choice", "openrouter-api-key");
  } else if (state.authGuidance === "xai-key") {
    parts.push("--auth-choice", "xai-api-key");
  } else if (state.authGuidance === "ollama-local") {
    parts.push("--auth-choice", "ollama");
  } else {
    parts.push("--auth-choice", "skip");
  }

  if (state.installDaemon) {
    parts.push("--install-daemon", "--daemon-runtime", "node");
  }

  parts.push("--skip-skills", "--skip-search");
  return parts.join(" ");
}

export function buildOpenClawExecutionPlan(state: OpenClawWizardState): OpenClawExecutionStep[] {
  if (state.operationMode === "manage-existing") {
    const manageSteps: OpenClawExecutionStep[] = [
      {
        id: "check-openclaw-cli",
        label: "Ensure OpenClaw CLI is available",
        command: "command -v openclaw >/dev/null 2>&1 || npm install -g openclaw@latest",
      },
    ];

    if (state.manageAction === "add-channel") {
      if (state.firstChannel === "telegram") {
        const env: Record<string, string> = {};
        if (state.channelToken.trim().length > 0) {
          env.TELEGRAM_BOT_TOKEN = state.channelToken.trim();
        }

        if (!env.TELEGRAM_BOT_TOKEN) {
          manageSteps.push({
            id: "check-telegram-token",
            label: "Check TELEGRAM_BOT_TOKEN is set",
            command:
              "test -n \"${TELEGRAM_BOT_TOKEN:-}\" || (echo \"Missing TELEGRAM_BOT_TOKEN. Paste in wizard or export it first.\" >&2; exit 1)",
          });
        }

        manageSteps.push({
          id: "add-telegram-channel",
          label: "Add Telegram channel",
          command: "openclaw channels add --channel telegram --token \"$TELEGRAM_BOT_TOKEN\"",
          displayCommand: "openclaw channels add --channel telegram --token ***",
          env,
        });
      } else if (state.firstChannel === "discord") {
        const env: Record<string, string> = {};
        if (state.channelToken.trim().length > 0) {
          env.DISCORD_BOT_TOKEN = state.channelToken.trim();
        }

        if (!env.DISCORD_BOT_TOKEN) {
          manageSteps.push({
            id: "check-discord-token",
            label: "Check DISCORD_BOT_TOKEN is set",
            command:
              "test -n \"${DISCORD_BOT_TOKEN:-}\" || (echo \"Missing DISCORD_BOT_TOKEN. Paste in wizard or export it first.\" >&2; exit 1)",
          });
        }

        manageSteps.push({
          id: "add-discord-channel",
          label: "Add Discord channel",
          command: "openclaw channels add --channel discord --token \"$DISCORD_BOT_TOKEN\"",
          displayCommand: "openclaw channels add --channel discord --token ***",
          env,
        });
      } else if (state.firstChannel === "whatsapp") {
        manageSteps.push({
          id: "add-whatsapp-channel",
          label: "Link WhatsApp account (QR flow)",
          command: "openclaw channels login --channel whatsapp",
        });
      }

      manageSteps.push({
        id: "channels-status",
        label: "Probe channel status",
        command: "openclaw channels status --probe",
        allowFailure: true,
      });
    }

    if (state.manageAction === "refresh-core") {
      manageSteps.push(
        {
            id: "rerun-onboard",
            label: "Refresh core local setup safely",
            command:
              "openclaw onboard --non-interactive --accept-risk --mode local --flow quickstart --auth-choice skip --gateway-port 18789 --gateway-bind loopback --skip-skills --skip-search",
        },
        {
          id: "gateway-status",
          label: "Check gateway status",
          command: "openclaw gateway status",
          allowFailure: true,
        },
      );
    }

    if (state.manageAction === "repair") {
      manageSteps.push(
        {
          id: "doctor-repair",
          label: "Run doctor auto-repairs",
          command: "openclaw doctor --fix --non-interactive --yes",
          allowFailure: true,
        },
        {
          id: "status-deep",
          label: "Run deep status diagnostics",
          command: "openclaw status --deep",
          allowFailure: true,
        },
      );
    }

    if (state.manageAction === "uninstall") {
      if (state.uninstallScope === "full") {
        manageSteps.push(
          {
            id: "uninstall-dry-run",
            label: "Preview full uninstall actions",
            command: "openclaw uninstall --dry-run --all",
            allowFailure: true,
          },
          {
            id: "uninstall-exec",
            label: "Uninstall OpenClaw (service + state + workspace + app)",
            command: "openclaw uninstall --non-interactive --yes --all",
          },
        );
      } else {
        manageSteps.push(
          {
            id: "uninstall-dry-run",
            label: "Preview uninstall actions",
            command: "openclaw uninstall --dry-run --service --state --workspace",
            allowFailure: true,
          },
          {
            id: "uninstall-exec",
            label: "Uninstall OpenClaw service/state/workspace",
            command: "openclaw uninstall --non-interactive --yes --service --state --workspace",
          },
        );
      }
    }

    return manageSteps;
  }

  const profile = {
    generatedAt: new Date().toISOString(),
    operationMode: state.operationMode,
    manageAction: state.manageAction,
    uninstallScope: state.uninstallScope,
    setupTrack: state.setupTrack,
    authGuidance: state.authGuidance,
    installDaemon: state.installDaemon,
    remoteUrl: state.remoteUrl,
    firstChannel: state.firstChannel,
    runDoctorAfterSetup: state.runDoctorAfterSetup,
    openDashboardAfterSetup: state.openDashboardAfterSetup,
  };
  const profileEncoded = Buffer.from(JSON.stringify(profile, null, 2), "utf8").toString("base64");

  const env: Record<string, string> = {};

  if (state.authGuidance === "openai-key" && state.providerApiKey.trim()) {
    env.OPENAI_API_KEY = state.providerApiKey.trim();
  }
  if (state.authGuidance === "anthropic-key" && state.providerApiKey.trim()) {
    env.ANTHROPIC_API_KEY = state.providerApiKey.trim();
  }
  if (state.authGuidance === "openrouter-key" && state.providerApiKey.trim()) {
    env.OPENROUTER_API_KEY = state.providerApiKey.trim();
  }
  if (state.authGuidance === "xai-key" && state.providerApiKey.trim()) {
    env.XAI_API_KEY = state.providerApiKey.trim();
  }
  if (state.firstChannel === "telegram" && state.channelToken.trim()) {
    env.TELEGRAM_BOT_TOKEN = state.channelToken.trim();
  }
  if (state.firstChannel === "discord" && state.channelToken.trim()) {
    env.DISCORD_BOT_TOKEN = state.channelToken.trim();
  }

  const steps: OpenClawExecutionStep[] = [
    {
      id: "install-openclaw",
      label: "Install OpenClaw CLI if missing",
      command: "command -v openclaw >/dev/null 2>&1 || npm install -g openclaw@latest",
    },
  ];

  if (state.authGuidance === "openai-key" && !env.OPENAI_API_KEY) {
    steps.push({
      id: "check-openai-env",
      label: "Check OPENAI_API_KEY is exported",
      command: "test -n \"${OPENAI_API_KEY:-}\" || (echo \"Missing OPENAI_API_KEY. Export it before onboarding.\" >&2; exit 1)",
    });
  }

  if (state.authGuidance === "anthropic-key" && !env.ANTHROPIC_API_KEY) {
    steps.push({
      id: "check-anthropic-env",
      label: "Check ANTHROPIC_API_KEY is exported",
      command:
        "test -n \"${ANTHROPIC_API_KEY:-}\" || (echo \"Missing ANTHROPIC_API_KEY. Export it before onboarding.\" >&2; exit 1)",
    });
  }

  if (state.authGuidance === "openrouter-key" && !env.OPENROUTER_API_KEY) {
    steps.push({
      id: "check-openrouter-env",
      label: "Check OPENROUTER_API_KEY is exported",
      command:
        "test -n \"${OPENROUTER_API_KEY:-}\" || (echo \"Missing OPENROUTER_API_KEY. Export it before onboarding.\" >&2; exit 1)",
    });
  }

  if (state.authGuidance === "xai-key" && !env.XAI_API_KEY) {
    steps.push({
      id: "check-xai-env",
      label: "Check XAI_API_KEY is exported",
      command:
        "test -n \"${XAI_API_KEY:-}\" || (echo \"Missing XAI_API_KEY. Export it before onboarding.\" >&2; exit 1)",
    });
  }

  if (state.authGuidance === "ollama-local") {
    steps.push({
      id: "check-ollama",
      label: "Check local Ollama endpoint",
      command:
        "curl -fsS http://127.0.0.1:11434/api/tags >/dev/null || (echo \"Ollama not reachable at 127.0.0.1:11434. Start it or choose another provider in onboarding.\" >&2; exit 1)",
      allowFailure: true,
    });
  }

  steps.push({
    id: "run-openclaw-onboard",
    label: "Run official OpenClaw onboarding",
    command: buildOpenClawApplyCommand(state),
    displayCommand: buildOpenClawApplyCommand({
      ...state,
      providerApiKey: "",
      channelToken: "",
    }),
    env,
  });

  steps.push({
    id: "gateway-status",
    label: "Check gateway status",
    command: "openclaw gateway status",
    allowFailure: true,
  });

  if (state.firstChannel === "telegram") {
    if (!env.TELEGRAM_BOT_TOKEN) {
      steps.push({
        id: "check-telegram-env",
        label: "Check TELEGRAM_BOT_TOKEN is available",
        command:
          "test -n \"${TELEGRAM_BOT_TOKEN:-}\" || (echo \"Missing TELEGRAM_BOT_TOKEN. Provide it in wizard or env.\" >&2; exit 1)",
      });
    }

    steps.push({
      id: "add-telegram-channel",
      label: "Add Telegram channel",
      command: "openclaw channels add --channel telegram --token \"$TELEGRAM_BOT_TOKEN\"",
      displayCommand: "openclaw channels add --channel telegram --token ***",
      env,
    });
  }

  if (state.firstChannel === "whatsapp") {
    steps.push({
      id: "channel-whatsapp",
      label: "Open WhatsApp login flow",
      command: "openclaw channels login --channel whatsapp",
      allowFailure: true,
    });
  }

  if (state.firstChannel === "discord") {
    if (!env.DISCORD_BOT_TOKEN) {
      steps.push({
        id: "check-discord-env",
        label: "Check DISCORD_BOT_TOKEN is available",
        command:
          "test -n \"${DISCORD_BOT_TOKEN:-}\" || (echo \"Missing DISCORD_BOT_TOKEN. Provide it in wizard or env.\" >&2; exit 1)",
      });
    }

    steps.push({
      id: "add-discord-channel",
      label: "Add Discord channel",
      command: "openclaw channels add --channel discord --token \"$DISCORD_BOT_TOKEN\"",
      displayCommand: "openclaw channels add --channel discord --token ***",
      env,
    });
  }

  if (state.firstChannel !== "dashboard-only") {
    steps.push({
      id: "channels-status",
      label: "Probe channel status",
      command: "openclaw channels status --probe",
      allowFailure: true,
    });
  }

  steps.push({
    id: "models-status",
    label: "Check model/auth health",
    command: "openclaw models status --check",
    allowFailure: true,
  });

  steps.push({
    id: "save-setup-profile",
    label: "Save setup profile snapshot",
    command:
      "node -e 'const fs=require(\"fs\");const path=require(\"path\");const p=path.join(process.env.HOME||\"\",\".openclaw\",\"setup-profile.json\");fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.from(process.argv[1],\"base64\").toString(\"utf8\")+\"\\n\");' " +
      shellQuote(profileEncoded),
    allowFailure: true,
  });

  if (state.runDoctorAfterSetup) {
    steps.push({
      id: "run-doctor",
      label: "Run OpenClaw diagnostics",
      command: "openclaw doctor",
      allowFailure: true,
    });
  }

  if (state.openDashboardAfterSetup) {
    steps.push({
      id: "open-dashboard",
      label: "Open dashboard",
      command: "openclaw dashboard",
      allowFailure: true,
    });
  }

  return steps;
}
