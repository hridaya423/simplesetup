export type AIProviderId =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "xai"
  | "groq"
  | "ollama";
export type RuntimeEngine = "docker" | "podman" | "native";
export type SSLMode = "auto" | "letsencrypt" | "custom";
export type AuthMode = "password" | "oidc" | "magic-link";
export type DeploymentMode = "local" | "cloud";
export type LocalOS = "macos" | "linux" | "windows-wsl";
export type ProviderAuthModeId =
  | "api-key"
  | "openai-codex-subscription"
  | "anthropic-setup-token"
  | "local-ollama";
export type AuthSetupKind = "direct" | "terminal";
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
export type SecurityProfile = "safe-personal" | "safe-team" | "power-user";

export type AIProvider = {
  id: AIProviderId;
  name: string;
  description: string;
  models: string[];
  authModes: Array<{
    id: ProviderAuthModeId;
    name: string;
    description: string;
    setup: AuthSetupKind;
    keyLabel?: string;
    keyPlaceholder?: string;
    keyEnv?: string;
    terminalCommands?: string[];
    verifyCommand?: string;
  }>;
};

export type UseCase = {
  id: string;
  category: string;
  label: string;
  description: string;
};

export type OpenClawIntegrations = {
  telegramBotToken: string;
  whatsappNumber: string;
  discordWebhook: string;
  slackWebhook: string;
  emailImap: string;
  emailSmtp: string;
  gmailOauthJson: string;
  googleCalendarToken: string;
  outlookCalendarToken: string;
  githubToken: string;
  notionToken: string;
  linearApiKey: string;
  stripeApiKey: string;
  webhookSecret: string;
};

export type IntegrationField = {
  key: keyof OpenClawIntegrations;
  label: string;
  placeholder: string;
  hint: string;
  secret?: boolean;
};

export type IntegrationDefinition = {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: IntegrationField[];
};

export type OpenClawConfig = {
  mode: DeploymentMode;
  workspaceName: string;
  primaryGoal: string;
  provider: AIProviderId;
  providerAuthMode: ProviderAuthModeId;
  model: string;
  apiKey: string;
  customModel: string;
  terminalAuthConfirmed: boolean;
  enabledIntegrationIds: string[];
  integrations: OpenClawIntegrations;
  useCaseIds: string[];
  enableCron: boolean;
  enableWebhookIngress: boolean;
  enableDigestNotifications: boolean;
  enableInboxSummaries: boolean;
  securityProfile: SecurityProfile;
  devicePairingRequired: boolean;
  gatewayBindLocalhost: boolean;
  allowShellTools: boolean;
  allowBrowserTools: boolean;
  runtime: RuntimeEngine;
  localOs: LocalOS;
  cloudTarget: CloudTarget;
  cloudRegion: string;
  cpuCores: number;
  memoryGb: number;
  persistencePath: string;
  autoUpdates: boolean;
  domain: string;
  adminEmail: string;
  adminPassword: string;
  sslMode: SSLMode;
  authMode: AuthMode;
  minVersion: string;
};

export const OPENCLAW_SECURITY_BASELINE_VERSION = "2026.1.30";

export const OPENCLAW_STEPS = [
  "Route",
  "Identity",
  "Provider",
  "Access",
  "Connect",
  "Model",
  "Chat Apps",
  "Work Apps",
  "Automation",
  "Security",
  "Platform",
  "Review",
  "Deploy",
];

export const OPENCLAW_MODE_OPTIONS: Array<{
  id: DeploymentMode;
  name: string;
  description: string;
}> = [
  {
    id: "local",
    name: "Local setup",
    description: "Keep OpenClaw close to your machine while configuring every integration first.",
  },
  {
    id: "cloud",
    name: "Cloud setup",
    description: "Configure capabilities now, then choose VPS or managed target near the end.",
  },
];

export const OPENCLAW_PRIMARY_GOALS = [
  "Inbox autopilot",
  "Calendar + meeting copilot",
  "Research and monitoring",
  "Support desk assistant",
  "Revenue and finance ops",
  "Founder command center",
];

export const OPENCLAW_AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Direct OpenAI API access with latest GPT models.",
    models: ["openai/gpt-5.2", "openai/gpt-5.2-chat", "openai/gpt-5.2-codex"],
    authModes: [
      {
        id: "api-key",
        name: "OpenAI API key",
        description: "Pay-as-you-go API key from platform.openai.com.",
        setup: "direct",
        keyLabel: "OpenAI API key",
        keyPlaceholder: "sk-...",
        keyEnv: "OPENAI_API_KEY",
      },
      {
        id: "openai-codex-subscription",
        name: "ChatGPT/Codex subscription",
        description: "Link subscription in terminal using OpenClaw auth flow.",
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
    name: "Anthropic Claude",
    description: "Claude models for high-quality reasoning and agent workflows.",
    models: [
      "anthropic/claude-opus-4-6",
      "anthropic/claude-sonnet-4-5",
      "anthropic/claude-haiku-4-5",
    ],
    authModes: [
      {
        id: "api-key",
        name: "Anthropic API key",
        description: "API key from console.anthropic.com.",
        setup: "direct",
        keyLabel: "Anthropic API key",
        keyPlaceholder: "sk-ant-...",
        keyEnv: "ANTHROPIC_API_KEY",
      },
      {
        id: "anthropic-setup-token",
        name: "Claude subscription setup-token",
        description: "Run Claude setup-token flow in terminal, then link profile.",
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
    description: "Single key access to OpenAI, Anthropic, xAI, and more.",
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
        description: "API key from openrouter.ai with unified model routing.",
        setup: "direct",
        keyLabel: "OpenRouter API key",
        keyPlaceholder: "sk-or-...",
        keyEnv: "OPENROUTER_API_KEY",
      },
    ],
  },
  {
    id: "xai",
    name: "xAI Grok",
    description: "Direct xAI API access for Grok model family.",
    models: ["xai/grok-4.1-fast", "xai/grok-4-fast", "xai/grok-code-fast-1"],
    authModes: [
      {
        id: "api-key",
        name: "xAI API key",
        description: "API key from x.ai developer portal.",
        setup: "direct",
        keyLabel: "xAI API key",
        keyPlaceholder: "xai-...",
        keyEnv: "XAI_API_KEY",
      },
    ],
  },
  {
    id: "ollama",
    name: "Local / Ollama",
    description: "Run fully local models when privacy or cost control is the priority.",
    models: ["ollama/llama3.3", "ollama/qwen2.5-coder:7b", "ollama/mistral-small3.1"],
    authModes: [
      {
        id: "local-ollama",
        name: "No key needed",
        description: "Uses local Ollama daemon at 127.0.0.1:11434.",
        setup: "direct",
      },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    description: "Low-latency inference path for fast response cycles.",
    models: [
      "groq/llama-3.3-70b-versatile",
      "groq/deepseek-r1-distill-llama-70b",
      "groq/mixtral-8x7b",
    ],
    authModes: [
      {
        id: "api-key",
        name: "Groq API key",
        description: "API key from console.groq.com.",
        setup: "direct",
        keyLabel: "Groq API key",
        keyPlaceholder: "gsk_...",
        keyEnv: "GROQ_API_KEY",
      },
    ],
  },
];

export const OPENCLAW_SUBSCRIPTION_FACTS = [
  "ChatGPT Plus/Pro billing is separate from OpenAI API billing.",
  "Claude Pro/Max billing is separate from Anthropic API billing.",
  "Subscription linking is done in terminal auth flows, not web forms.",
];

export const OPENCLAW_INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: "telegram",
    name: "Telegram",
    category: "Messaging",
    description: "Bot-triggered actions, alerts, and quick command loops.",
    fields: [
      {
        key: "telegramBotToken",
        label: "Bot token",
        placeholder: "123456:ABC...",
        hint: "Create with @BotFather.",
        secret: true,
      },
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "Messaging",
    description: "Use WhatsApp as your real-time assistant channel.",
    fields: [
      {
        key: "whatsappNumber",
        label: "Business number",
        placeholder: "+1-555-123-4567",
        hint: "Used for pairing and device registration.",
      },
    ],
  },
  {
    id: "discord",
    name: "Discord",
    category: "Messaging",
    description: "Push summaries and incident alerts to team channels.",
    fields: [
      {
        key: "discordWebhook",
        label: "Webhook URL",
        placeholder: "https://discord.com/api/webhooks/...",
        hint: "Route OpenClaw updates into a dedicated channel.",
      },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    category: "Messaging",
    description: "Send automation output and reminders into Slack.",
    fields: [
      {
        key: "slackWebhook",
        label: "Webhook URL",
        placeholder: "https://hooks.slack.com/services/...",
        hint: "Use app-level webhook with least privilege.",
      },
    ],
  },
  {
    id: "email",
    name: "IMAP/SMTP Email",
    category: "Productivity",
    description: "Read inbox changes and send outbound assistant emails.",
    fields: [
      {
        key: "emailImap",
        label: "IMAP URI",
        placeholder: "imap://user:pass@mail.example.com:993",
        hint: "Use app passwords where possible.",
      },
      {
        key: "emailSmtp",
        label: "SMTP URI",
        placeholder: "smtp://user:pass@mail.example.com:465",
        hint: "Needed for sending drafts and follow-ups.",
      },
    ],
  },
  {
    id: "gmail",
    name: "Gmail OAuth",
    category: "Productivity",
    description: "Use OAuth flow for Gmail-first workflows.",
    fields: [
      {
        key: "gmailOauthJson",
        label: "OAuth client JSON path",
        placeholder: "/secrets/gmail-client.json",
        hint: "Path mounted into runtime.",
      },
    ],
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Productivity",
    description: "Scheduling, reminders, and availability automation.",
    fields: [
      {
        key: "googleCalendarToken",
        label: "Google token",
        placeholder: "ya29...",
        hint: "Access token for calendar operations.",
        secret: true,
      },
    ],
  },
  {
    id: "outlook-calendar",
    name: "Outlook Calendar",
    category: "Productivity",
    description: "Outlook scheduling and meeting sync.",
    fields: [
      {
        key: "outlookCalendarToken",
        label: "Outlook token",
        placeholder: "eyJ...",
        hint: "Graph API token for calendar scope.",
        secret: true,
      },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    category: "Engineering",
    description: "Repository summaries, issue triage, and PR digests.",
    fields: [
      {
        key: "githubToken",
        label: "PAT token",
        placeholder: "ghp_...",
        hint: "Create fine-grained token with repo scopes.",
        secret: true,
      },
    ],
  },
  {
    id: "notion",
    name: "Notion",
    category: "Knowledge",
    description: "Knowledge-base sync and AI summaries from Notion docs.",
    fields: [
      {
        key: "notionToken",
        label: "Integration token",
        placeholder: "secret_...",
        hint: "Connect only required pages/databases.",
        secret: true,
      },
    ],
  },
  {
    id: "linear",
    name: "Linear",
    category: "Engineering",
    description: "Issue triage and sprint status automation.",
    fields: [
      {
        key: "linearApiKey",
        label: "API key",
        placeholder: "lin_api_...",
        hint: "Used for sync and action creation.",
        secret: true,
      },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Revenue",
    description: "Revenue alerts, failed payment follow-up, and summaries.",
    fields: [
      {
        key: "stripeApiKey",
        label: "Secret key",
        placeholder: "sk_live_...",
        hint: "Use restricted key where possible.",
        secret: true,
      },
    ],
  },
  {
    id: "webhook",
    name: "Inbound webhooks",
    category: "Automation",
    description: "Trigger actions from external systems.",
    fields: [
      {
        key: "webhookSecret",
        label: "Webhook secret",
        placeholder: "whsec_...",
        hint: "OpenClaw verifies signed inbound requests.",
        secret: true,
      },
    ],
  },
];

export const OPENCLAW_SECURITY_NOTES = [
  "Set minimum version to 2026.1.30 or newer (patch baseline).",
  "Keep gateway auth enabled and avoid public unauthenticated binds.",
  "Require device pairing and approvals before channel access.",
  "Restrict shell/browser tools unless the use case explicitly needs them.",
];

export const OPENCLAW_SECURITY_ADVISORIES = [
  "GHSA-g55j-c2v4-pjcg - config.apply local RCE (patched >= 2026.1.20)",
  "GHSA-mc68-q9jw-2h3v - Docker PATH command injection (patched >= 2026.1.29)",
  "GHSA-q284-4pvr-m585 - macOS SSH command injection (patched >= 2026.1.29)",
  "GHSA-g8p2-7wf7-98mq - token exfiltration via gatewayUrl (patched >= 2026.1.29)",
  "GHSA-r8g4-86fx-92mq - MEDIA path traversal LFI (patched >= 2026.1.30)",
];

export const OPENCLAW_CLOUD_TARGETS: Array<{
  id: CloudTarget;
  name: string;
  description: string;
}> = [
  { id: "railway", name: "Railway", description: "Quick managed deployment with built-in logs." },
  { id: "render", name: "Render", description: "Simple managed runtime with service templates." },
  {
    id: "northflank",
    name: "Northflank",
    description: "Production container platform with autoscaling controls.",
  },
  { id: "fly", name: "Fly.io", description: "Region-aware deployments with low-latency routing." },
  { id: "hetzner", name: "Hetzner", description: "Cost-efficient VPS path with full control." },
  { id: "gcp", name: "GCP", description: "Compute Engine guide with Docker and secure tunneling." },
  { id: "ansible", name: "Ansible", description: "Infra-as-code setup for repeatable deployments." },
  { id: "nix", name: "Nix", description: "Deterministic nix-openclaw path for advanced users." },
  { id: "exedev", name: "exe.dev", description: "VM + shell-agent assisted provisioning path." },
];

export const OPENCLAW_LOCAL_OS_OPTIONS: Array<{
  id: LocalOS;
  name: string;
  description: string;
}> = [
  { id: "macos", name: "macOS", description: "Homebrew/installer path with native terminal workflow." },
  { id: "linux", name: "Linux", description: "Node 22+ with installer or Docker runtime." },
  {
    id: "windows-wsl",
    name: "Windows (WSL)",
    description: "Recommended Windows path for stable CLI behavior.",
  },
];

export const OPENCLAW_USE_CASES: UseCase[] = [
  {
    id: "email-inbox-triage",
    category: "Email",
    label: "Inbox triage",
    description: "Classify and prioritize incoming messages.",
  },
  {
    id: "email-draft-replies",
    category: "Email",
    label: "Draft replies",
    description: "Generate context-aware replies for quick review.",
  },
  {
    id: "email-followups",
    category: "Email",
    label: "Follow-up nudges",
    description: "Create reminders for unanswered threads.",
  },
  {
    id: "email-summary-digest",
    category: "Email",
    label: "Daily digest",
    description: "Send a summary of key threads and actions.",
  },
  {
    id: "email-billing-watch",
    category: "Email",
    label: "Billing watch",
    description: "Detect invoices, due dates, and payment notices.",
  },
  {
    id: "email-meeting-extract",
    category: "Email",
    label: "Meeting extraction",
    description: "Convert email agreements into calendar tasks.",
  },
  {
    id: "email-rules-learning",
    category: "Email",
    label: "Rule learning",
    description: "Suggest filters based on repeated behavior.",
  },
  {
    id: "calendar-auto-schedule",
    category: "Calendar",
    label: "Auto scheduling",
    description: "Propose free slots and create events.",
  },
  {
    id: "calendar-conflict-detect",
    category: "Calendar",
    label: "Conflict detection",
    description: "Warn when overlapping or risky bookings appear.",
  },
  {
    id: "calendar-briefing",
    category: "Calendar",
    label: "Meeting briefing",
    description: "Prepare agenda and context before calls.",
  },
  {
    id: "calendar-reminders",
    category: "Calendar",
    label: "Smart reminders",
    description: "Send reminders based on urgency and travel time.",
  },
  {
    id: "calendar-followup-tasks",
    category: "Calendar",
    label: "Follow-up tasks",
    description: "Generate action items from events.",
  },
  {
    id: "calendar-availability-bot",
    category: "Calendar",
    label: "Availability bot",
    description: "Reply with open slots from chat commands.",
  },
  {
    id: "calendar-week-planner",
    category: "Calendar",
    label: "Weekly planner",
    description: "Balance deep work, meetings, and admin time.",
  },
  {
    id: "docs-summarize",
    category: "Documents",
    label: "Document summaries",
    description: "Summarize long PDFs and docs into key points.",
  },
  {
    id: "docs-entity-extract",
    category: "Documents",
    label: "Entity extraction",
    description: "Pull names, dates, and obligations from contracts.",
  },
  {
    id: "docs-policy-qa",
    category: "Documents",
    label: "Policy Q&A",
    description: "Answer policy questions from internal docs.",
  },
  {
    id: "docs-version-diff",
    category: "Documents",
    label: "Version diff notes",
    description: "Explain what changed between document revisions.",
  },
  {
    id: "docs-template-fill",
    category: "Documents",
    label: "Template filling",
    description: "Populate standard templates from structured data.",
  },
  {
    id: "docs-risk-flags",
    category: "Documents",
    label: "Risk flagging",
    description: "Highlight risky clauses and missing terms.",
  },
  {
    id: "docs-knowledge-base",
    category: "Documents",
    label: "Knowledge base updates",
    description: "Turn notes into structured knowledge entries.",
  },
  {
    id: "finance-expense-categorize",
    category: "Finance",
    label: "Expense categorization",
    description: "Label and group transactions automatically.",
  },
  {
    id: "finance-subscription-audit",
    category: "Finance",
    label: "Subscription audit",
    description: "Track recurring spend and detect waste.",
  },
  {
    id: "finance-invoice-chase",
    category: "Finance",
    label: "Invoice chasing",
    description: "Nudge late payers with escalation logic.",
  },
  {
    id: "finance-price-monitor",
    category: "Finance",
    label: "Price monitoring",
    description: "Track vendor pricing changes over time.",
  },
  {
    id: "finance-budget-alerts",
    category: "Finance",
    label: "Budget alerts",
    description: "Warn when category spend drifts from targets.",
  },
  {
    id: "finance-renewal-negotiation",
    category: "Finance",
    label: "Renewal negotiation",
    description: "Draft negotiation points before contract renewals.",
  },
  {
    id: "finance-cashflow-brief",
    category: "Finance",
    label: "Cashflow brief",
    description: "Produce weekly cashflow snapshots and trend notes.",
  },
  {
    id: "social-post-drafts",
    category: "Social",
    label: "Post drafts",
    description: "Draft platform-ready content from one prompt.",
  },
  {
    id: "social-comment-replies",
    category: "Social",
    label: "Comment replies",
    description: "Generate response suggestions by tone.",
  },
  {
    id: "social-calendar",
    category: "Social",
    label: "Content calendar",
    description: "Plan publishing slots and campaign cadence.",
  },
  {
    id: "social-brand-guardrails",
    category: "Social",
    label: "Brand guardrails",
    description: "Check messaging against voice constraints.",
  },
  {
    id: "social-trend-hooks",
    category: "Social",
    label: "Trend hooks",
    description: "Surface current hooks aligned to your niche.",
  },
  {
    id: "social-community-digest",
    category: "Social",
    label: "Community digest",
    description: "Summarize mentions and sentiment each day.",
  },
  {
    id: "social-ad-variants",
    category: "Social",
    label: "Ad variants",
    description: "Generate ad copy permutations for testing.",
  },
  {
    id: "research-competitor-watch",
    category: "Research",
    label: "Competitor watch",
    description: "Track launches, pricing, and positioning shifts.",
  },
  {
    id: "research-news-alerts",
    category: "Research",
    label: "News alerts",
    description: "Monitor market events tied to selected keywords.",
  },
  {
    id: "research-brief-generator",
    category: "Research",
    label: "Research brief",
    description: "Create concise briefings from multiple sources.",
  },
  {
    id: "research-rfp-scan",
    category: "Research",
    label: "RFP scanning",
    description: "Scan public tenders and summarize opportunities.",
  },
  {
    id: "research-feedback-clustering",
    category: "Research",
    label: "Feedback clustering",
    description: "Group customer feedback by recurring theme.",
  },
  {
    id: "research-interview-synthesis",
    category: "Research",
    label: "Interview synthesis",
    description: "Extract insights from interview transcripts.",
  },
  {
    id: "research-anomaly-detection",
    category: "Research",
    label: "Signal anomaly detection",
    description: "Flag unusual spikes in tracked indicators.",
  },
  {
    id: "support-ticket-routing",
    category: "Support",
    label: "Ticket routing",
    description: "Route incoming tickets to the right queue.",
  },
  {
    id: "support-first-response",
    category: "Support",
    label: "First response drafts",
    description: "Prepare first responses with issue context.",
  },
  {
    id: "support-sla-monitor",
    category: "Support",
    label: "SLA monitoring",
    description: "Alert when response or resolution windows slip.",
  },
  {
    id: "support-escalation-notes",
    category: "Support",
    label: "Escalation notes",
    description: "Create clean handoff notes for escalation.",
  },
  {
    id: "support-macro-suggestions",
    category: "Support",
    label: "Macro suggestions",
    description: "Recommend reusable reply macros.",
  },
  {
    id: "support-churn-risk",
    category: "Support",
    label: "Churn risk alerts",
    description: "Flag high-risk accounts from support patterns.",
  },
  {
    id: "support-csat-summary",
    category: "Support",
    label: "CSAT summaries",
    description: "Summarize customer sentiment after closure.",
  },
  {
    id: "ops-daily-standup",
    category: "Operations",
    label: "Daily standup digest",
    description: "Compile async updates into one briefing.",
  },
  {
    id: "ops-incident-drafts",
    category: "Operations",
    label: "Incident draft comms",
    description: "Generate incident updates and timeline notes.",
  },
  {
    id: "ops-change-log",
    category: "Operations",
    label: "Change log generation",
    description: "Draft release notes from merged work.",
  },
  {
    id: "ops-task-prioritization",
    category: "Operations",
    label: "Task prioritization",
    description: "Rank backlog items by urgency and impact.",
  },
  {
    id: "ops-checklist-runbooks",
    category: "Operations",
    label: "Runbook checklists",
    description: "Create checklists for recurring operations.",
  },
  {
    id: "ops-oncall-brief",
    category: "Operations",
    label: "On-call briefing",
    description: "Summarize active issues for handoff.",
  },
  {
    id: "ops-exec-summary",
    category: "Operations",
    label: "Executive summaries",
    description: "Build weekly leadership updates from activity.",
  },
];

export const OPENCLAW_USE_CASE_STARTER_PACK = [
  "email-inbox-triage",
  "email-draft-replies",
  "calendar-auto-schedule",
  "docs-summarize",
  "finance-expense-categorize",
  "research-competitor-watch",
  "support-ticket-routing",
  "ops-daily-standup",
];

export const OPENCLAW_INTEGRATION_STARTER_PACK = [
  "telegram",
  "email",
  "google-calendar",
  "webhook",
  "github",
];

export const DEFAULT_OPENCLAW_CONFIG: OpenClawConfig = {
  mode: "local",
  workspaceName: "Personal Ops Desk",
  primaryGoal: OPENCLAW_PRIMARY_GOALS[0],
  provider: "openai",
  providerAuthMode: "api-key",
  model: "openai/gpt-5.2",
  apiKey: "",
  customModel: "",
  terminalAuthConfirmed: false,
  enabledIntegrationIds: OPENCLAW_INTEGRATION_STARTER_PACK,
  integrations: {
    telegramBotToken: "",
    whatsappNumber: "",
    discordWebhook: "",
    slackWebhook: "",
    emailImap: "",
    emailSmtp: "",
    gmailOauthJson: "",
    googleCalendarToken: "",
    outlookCalendarToken: "",
    githubToken: "",
    notionToken: "",
    linearApiKey: "",
    stripeApiKey: "",
    webhookSecret: "",
  },
  useCaseIds: OPENCLAW_USE_CASE_STARTER_PACK,
  enableCron: true,
  enableWebhookIngress: true,
  enableDigestNotifications: true,
  enableInboxSummaries: true,
  securityProfile: "safe-personal",
  devicePairingRequired: true,
  gatewayBindLocalhost: true,
  allowShellTools: false,
  allowBrowserTools: true,
  runtime: "docker",
  localOs: "macos",
  cloudTarget: "railway",
  cloudRegion: "us-east-1",
  cpuCores: 2,
  memoryGb: 4,
  persistencePath: "~/.openclaw",
  autoUpdates: true,
  domain: "openclaw.example.com",
  adminEmail: "admin@example.com",
  adminPassword: "",
  sslMode: "auto",
  authMode: "password",
  minVersion: OPENCLAW_SECURITY_BASELINE_VERSION,
};

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function getProviderById(providerId: AIProviderId): AIProvider {
  const match = OPENCLAW_AI_PROVIDERS.find((provider) => provider.id === providerId);
  if (!match) {
    return OPENCLAW_AI_PROVIDERS[0];
  }
  return match;
}

export function getCloudTargetName(targetId: CloudTarget): string {
  const match = OPENCLAW_CLOUD_TARGETS.find((target) => target.id === targetId);
  return match ? match.name : "Unknown";
}

export function getProviderAuthModes(providerId: AIProviderId) {
  return getProviderById(providerId).authModes;
}

export function getProviderAuthMode(providerId: AIProviderId, authModeId?: ProviderAuthModeId) {
  const provider = getProviderById(providerId);
  const match = provider.authModes.find((mode) => mode.id === authModeId);
  if (!match) {
    return provider.authModes[0];
  }
  return match;
}

export function getRecommendedModels(providerId: AIProviderId, authModeId: ProviderAuthModeId): string[] {
  if (providerId === "openai" && authModeId === "openai-codex-subscription") {
    return [
      "openai-codex/gpt-5.3-codex",
      "openai-codex/gpt-5.2-codex",
      "openai-codex/gpt-5.2-chat",
    ];
  }

  return getProviderById(providerId).models;
}

function toEnvKey(fieldKey: string): string {
  return fieldKey
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toUpperCase();
}

export function buildOpenClawCommand(config: OpenClawConfig): string {
  const provider = getProviderById(config.provider);
  const authMode = getProviderAuthMode(config.provider, config.providerAuthMode);
  const parts: string[] = ["npx", "simplesetup", "openclaw", "apply"];

  parts.push("--mode", config.mode);
  parts.push("--workspace", shellQuote(config.workspaceName));
  parts.push("--goal", shellQuote(config.primaryGoal));
  parts.push("--provider", provider.id, "--provider-auth", authMode.id, "--model", config.model);

  if (authMode.setup === "direct" && authMode.keyEnv && config.apiKey.trim()) {
    parts.push("--provider-token-env", authMode.keyEnv);
  }

  if (authMode.setup === "terminal") {
    parts.push("--auth-profile", "terminal-linked");
  }

  if (config.enabledIntegrationIds.length > 0) {
    parts.push("--integrations", config.enabledIntegrationIds.join(","));
  }

  for (const integration of OPENCLAW_INTEGRATIONS) {
    if (!config.enabledIntegrationIds.includes(integration.id)) {
      continue;
    }

    for (const field of integration.fields) {
      const rawValue = config.integrations[field.key].trim();
      if (!rawValue) {
        continue;
      }
      if (field.secret) {
        parts.push(`--${field.key}-env`, toEnvKey(field.key));
      } else {
        parts.push(`--${field.key}`, shellQuote(rawValue));
      }
    }
  }

  if (config.useCaseIds.length > 0) {
    parts.push("--use-cases", config.useCaseIds.join(","));
  }

  if (config.enableCron) {
    parts.push("--enable-cron");
  }
  if (config.enableWebhookIngress) {
    parts.push("--enable-webhook-ingress");
  }
  if (config.enableDigestNotifications) {
    parts.push("--enable-digest-notifications");
  }
  if (config.enableInboxSummaries) {
    parts.push("--enable-inbox-summaries");
  }

  parts.push("--security-profile", config.securityProfile);
  parts.push(config.devicePairingRequired ? "--require-device-pairing" : "--open-device-join");
  parts.push(config.gatewayBindLocalhost ? "--bind-localhost" : "--bind-public");
  parts.push(config.allowShellTools ? "--enable-shell-tools" : "--disable-shell-tools");
  parts.push(config.allowBrowserTools ? "--enable-browser-tools" : "--disable-browser-tools");
  parts.push("--min-version", config.minVersion);

  parts.push("--runtime", config.runtime);
  parts.push("--cpu", String(config.cpuCores));
  parts.push("--memory", `${config.memoryGb}g`);
  parts.push("--data-dir", shellQuote(config.persistencePath));
  parts.push(config.autoUpdates ? "--auto-updates" : "--no-auto-updates");

  if (config.mode === "local") {
    parts.push("--host-os", config.localOs);
  } else {
    parts.push("--target", config.cloudTarget);
    parts.push("--region", config.cloudRegion);
    parts.push("--domain", config.domain);
  }

  parts.push("--admin-email", config.adminEmail);
  if (config.adminPassword.trim()) {
    parts.push("--admin-password-env", "OPENCLAW_ADMIN_PASSWORD");
  }
  parts.push("--ssl", config.sslMode);
  parts.push("--auth", config.authMode);

  return parts.join(" ");
}
