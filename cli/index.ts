#!/usr/bin/env node

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import type * as Blessed from "blessed";
import {
  buildOpenClawApplyCommand,
  buildOpenClawExecutionPlan,
  createDefaultState,
  type OpenClawExecutionStep,
  type OpenClawWizardState,
} from "./openclaw-domain.ts";

const require = createRequire(import.meta.url);
const blessed = require("neo-blessed") as typeof Blessed;

type ToolOption = {
  id: string;
  name: string;
  status: "ready" | "soon";
  description: string;
  category: string;
};

type SelectOption = {
  label: string;
  value: string;
  hint?: string;
};

type SelectStep = {
  kind: "select";
  id: string;
  title: string;
  subtitle: string;
  options: (state: OpenClawWizardState) => SelectOption[];
  currentIndex: (state: OpenClawWizardState, options: SelectOption[]) => number;
  apply: (state: OpenClawWizardState, value: string) => void;
  when?: (state: OpenClawWizardState) => boolean;
};

type InputStep = {
  kind: "input";
  id: string;
  title: string;
  subtitle: string;
  placeholder: string;
  defaultValue: (state: OpenClawWizardState) => string;
  apply: (state: OpenClawWizardState, value: string) => void;
  validate?: (value: string, state: OpenClawWizardState) => string | null;
  when?: (state: OpenClawWizardState) => boolean;
};

type ReviewStep = {
  kind: "review";
  id: "review";
  title: string;
  subtitle: string;
};

type WizardStep = SelectStep | InputStep | ReviewStep;

type OpenClawLocalStatus = {
  cliInstalled: boolean;
  configPresent: boolean;
  statePresent: boolean;
};

const TOOLS: ToolOption[] = [
  {
    id: "openclaw",
    name: "OpenClaw",
    status: "ready",
    category: "Agent Runtime",
    description: "AI agent runtime setup with real OpenClaw onboarding and diagnostics commands.",
  },
  {
    id: "n8n",
    name: "n8n",
    status: "soon",
    category: "Automation",
    description: "Workflow builder setup flow is queued next.",
  },
  {
    id: "Supabase",
    name: "Supabase",
    status: "soon",
    category: "Backend",
    description: "Database + auth + storage flow is coming.",
  },
  {
    id: "posthog",
    name: "PostHog",
    status: "soon",
    category: "Analytics",
    description: "Product analytics and ingestion presets are coming.",
  },
];

const ACCENT_PRIMARY = "#ff6b7a";
const ACCENT_SECONDARY = "#ff8a96";
const ACCENT_DARK = "#3a1f28";
const INTRO_BG = "#07070a";
const INTRO_LOGO_BASE = ACCENT_PRIMARY;
const INTRO_LOGO_SHIMMER = ACCENT_SECONDARY;
const UI_BG = "#07070a";
const UI_SURFACE = "#0b0a0d";
const UI_SURFACE_ALT = "#120d12";
const UI_BORDER = "#2a1a21";
const UI_TEXT = "#f5d8df";
const UI_MUTED = "#a58a93";
const UI_DIM = "#6d5961";
const UI_SUCCESS = "#7ed2ab";
const UI_WARNING = "#f2b06f";

class SimpleSetupTui {
  private readonly screen: Blessed.Widgets.Screen;
  private readonly forcedTool: string | null;
  private state: OpenClawWizardState = createDefaultState();
  private wizardIndex = 0;
  private localUnbinds: Array<() => void> = [];
  private timers: NodeJS.Timeout[] = [];
  private activeChild: ChildProcess | null = null;
  private introReady = false;
  private openclawStatus: OpenClawLocalStatus = this.detectOpenClawLocalStatus();

  public constructor(forcedTool: string | null) {
    this.forcedTool = forcedTool;
    this.screen = blessed.screen({
      smartCSR: true,
      fullUnicode: true,
      title: "SimpleSetup TUI",
      dockBorders: true,
    });

    this.screen.key(["q", "C-c"], () => {
      this.shutdown();
    });

    this.screen.on("resize", () => {
      this.render();
    });

    if (this.openclawStatus.configPresent || this.openclawStatus.statePresent) {
      this.state.operationMode = "manage-existing";
    }
  }

  private detectOpenClawLocalStatus(): OpenClawLocalStatus {
    const home = homedir();
    const configPath = join(home, ".openclaw", "openclaw.json");
    const statePath = join(home, ".openclaw");
    const commandProbe = spawnSync("sh", ["-lc", "command -v openclaw >/dev/null 2>&1"]);

    return {
      cliInstalled: commandProbe.status === 0,
      configPresent: existsSync(configPath),
      statePresent: existsSync(statePath),
    };
  }

  public start(): void {
    this.showIntro();
  }

  private shutdown(): void {
    this.clearTimers();
    this.clearLocalBindings();
    if (this.activeChild) {
      this.activeChild.kill("SIGINT");
      this.activeChild = null;
    }
    this.screen.destroy();
    process.exit(0);
  }

  private clearTimers(): void {
    for (const timer of this.timers) {
      clearInterval(timer);
      clearTimeout(timer);
    }
    this.timers = [];
  }

  private clearLocalBindings(): void {
    for (const unbind of this.localUnbinds) {
      unbind();
    }
    this.localUnbinds = [];
  }

  private onKey(keys: string | string[], handler: (ch: string, key: Blessed.Widgets.Events.IKeyEventArg) => void): void {
    const list = Array.isArray(keys) ? keys : [keys];
    this.screen.key(list, handler);
    this.localUnbinds.push(() => {
      for (const key of list) {
        this.screen.unkey(key, handler);
      }
    });
  }

  private getSelectedIndex(list: Blessed.Widgets.ListElement): number {
    const maybeSelected = (list as unknown as { selected?: number }).selected;
    if (typeof maybeSelected === "number") {
      return maybeSelected;
    }
    return 0;
  }

  private resetCanvas(): void {
    this.clearTimers();
    this.clearLocalBindings();
    for (const child of [...this.screen.children]) {
      child.detach();
    }
  }

  private render(): void {
    this.screen.render();
  }

  private showIntro(): void {
    this.resetCanvas();
    this.introReady = false;

    const cols = typeof this.screen.width === "number" ? this.screen.width : 120;
    const rows = typeof this.screen.height === "number" ? this.screen.height : 40;
    const heroWidth = Math.max(70, Math.min(cols - 4, 170));
    const heroHeight = Math.max(16, Math.min(rows - 4, 28));
    const heroTop = Math.max(1, Math.floor((rows - heroHeight) / 2));

    const root = blessed.box({
      parent: this.screen,
      width: "100%",
      height: "100%",
      style: {
        bg: INTRO_BG,
      },
    });

    const backdrop = blessed.box({
      parent: root,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      tags: true,
    });

    const stars = Array.from({ length: Math.max(24, Math.floor((cols * rows) / 170)) }).map(() => ({
      x: Math.max(1, Math.floor(Math.random() * Math.max(cols - 2, 2))),
      y: Math.max(1, Math.floor(Math.random() * Math.max(rows - 3, 2))),
      bright: Math.random() > 0.5,
    }));

    const renderBackdrop = (): void => {
      const lines = Array.from({ length: Math.max(rows, 1) }, () => Array.from({ length: cols }, () => " "));
      for (const star of stars) {
        if (star.y >= lines.length || star.x >= cols) {
          continue;
        }
        lines[star.y][star.x] = star.bright ? "*" : ".";
      }
      const content = lines
        .map((line) =>
          line
            .map((char) => {
              if (char === "*") {
                return `{${ACCENT_SECONDARY}-fg}*{/}`;
              }
              if (char === ".") {
                return "{#221319-fg}.{/}";
              }
              return " ";
            })
            .join(""),
        )
        .join("\n");
      backdrop.setContent(content);
    };

    renderBackdrop();

    const starTimer = setInterval(() => {
      for (const star of stars) {
        if (Math.random() > 0.8) {
          star.bright = !star.bright;
        }
      }
      renderBackdrop();
      this.render();
    }, 360);
    this.timers.push(starTimer);

    const tinyLogo = [
      " __ _                 _      __      _               ",
      "/ _(_)_ __ ___  _ __ | | ___/ _\\ ___| |_ _   _ _ __  ",
      "\\ \\| | '_ ` _ \\| '_ \\| |/ _ \\ \\ / _ \\ __| | | | '_ \\ ",
      "_\\ \\ | | | | | | |_) | |  __/\\ \\  __/ |_| |_| | |_) |",
      "\\__/_|_| |_| |_| .__/|_|\\___\\__/\\___|\\__|\\__,_| .__/ ",
      "               |_|                            |_|    ",
    ];

    const setupLarge = [
      "███████╗███████╗████████╗██╗   ██╗██████╗ ",
      "██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗",
      "███████╗█████╗     ██║   ██║   ██║██████╔╝",
      "╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝ ",
      "███████║███████╗   ██║   ╚██████╔╝██║     ",
      "╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ",
    ];

    const simpleMini = [
      " ___ ___ __  __ ___ _    ___ ",
      "/ __|_ _|  \\/  | _ \\ |  | __|",
      "\\__ \\| || |\\/| |  _/ |__| _| ",
      "|___/___|_|  |_|_| |____|___|",
    ];

    const setupLargeWidth = Math.max(...setupLarge.map((line) => line.length));
    const simpleMiniCentered = simpleMini.map((line) => {
      const leftPad = Math.max(0, Math.floor((setupLargeWidth - line.length) / 2));
      return `${" ".repeat(leftPad)}${line}`.padEnd(setupLargeWidth, " ");
    });

    const stackedLogo = [...simpleMiniCentered, " ".repeat(setupLargeWidth), ...setupLarge];

    const fullLogo = [
      "███████╗██╗███╗   ███╗██████╗ ██╗     ███████╗███████╗███████╗████████╗██╗   ██╗██████╗ ",
      "██╔════╝██║████╗ ████║██╔══██╗██║     ██╔════╝██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗",
      "███████╗██║██╔████╔██║██████╔╝██║     █████╗  ███████╗█████╗     ██║   ██║   ██║██████╔╝",
      "╚════██║██║██║╚██╔╝██║██╔═══╝ ██║     ██╔══╝  ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝ ",
      "███████║██║██║ ╚═╝ ██║██║     ███████╗███████╗███████║███████╗   ██║   ╚██████╔╝██║     ",
      "╚══════╝╚═╝╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ",
      "                                                                                         ",
    ];

    const logoVariant = heroWidth >= 120 ? "full" : heroWidth >= 86 ? "stacked" : "tiny";
    const logoArt = logoVariant === "full" ? fullLogo : logoVariant === "stacked" ? stackedLogo : tinyLogo;
    const logoFrameHeight = Math.min(heroHeight - 2, logoArt.length + 2);
    const logoFrameWidth = Math.min(
      heroWidth - 2,
      Math.max(...logoArt.map((line) => line.length)) + 2,
    );
    const logoFrameTop = Math.max(1, Math.floor((heroHeight - logoFrameHeight) / 2) - 1);
    const logoFrameAbsoluteTop = heroTop + logoFrameTop;
    const ctaTopAbsolute = Math.min(rows - 2, logoFrameAbsoluteTop + logoFrameHeight + 1);

    const logoBox = blessed.box({
      parent: root,
      top: logoFrameAbsoluteTop,
      left: "center",
      width: logoFrameWidth,
      height: logoFrameHeight,
      tags: true,
      align: "center",
    });

    const cta = blessed.box({
      parent: root,
      top: ctaTopAbsolute,
      left: "center",
      width: "shrink",
      height: 1,
      tags: true,
      content: "{#f3d0d7-fg}press enter to start{/}",
    });

    const maxLogoWidth = Math.max(...logoArt.map((line) => line.length));
    const glyphRows = logoArt.map((line) => line.padEnd(maxLogoWidth, " ").split(""));
    const columnDropOffsets = Array.from({ length: maxLogoWidth }, (_unused, column) => {
      const wave = Math.floor(Math.abs(Math.sin(column * 0.37)) * 5);
      const jitter = Math.floor(Math.random() * 6);
      return 3 + wave + jitter;
    });

    const fadePalette = ["#2a131b", "#5c2231", "#8f3146", INTRO_LOGO_BASE];
    const shimmerWidth = logoVariant === "tiny" ? 10 : 12;
    const rowDropStep = logoVariant === "stacked" ? 1 : 2;
    const colorSettleTicks = 3;
    const settleTick =
      Math.max(...columnDropOffsets) +
      logoArt.length * rowDropStep +
      fadePalette.length * colorSettleTicks +
      6;

    let shimmer = -16;
    let introTick = 0;
    let ctaBlinkReady = false;

    const paintLogo = (): void => {
      const content = glyphRows
        .map((lineChars, rowIndex) =>
          lineChars
            .map((char, columnIndex) => {
              if (char === " ") {
                return " ";
              }

              const dropThreshold = columnDropOffsets[columnIndex] + rowIndex * rowDropStep;
              const appeared = introTick >= dropThreshold;

              if (!appeared) {
                const grainHead = introTick - columnDropOffsets[columnIndex];
                if (grainHead === rowIndex || grainHead === rowIndex - 1) {
                  return "{#6f2b3a-fg}·{/}";
                }
                return " ";
              }

              const colorPhase = Math.min(
                fadePalette.length - 1,
                Math.floor((introTick - dropThreshold) / colorSettleTicks),
              );

              let color = fadePalette[colorPhase];
              const diagonalStart = shimmer + (logoArt.length - 1 - rowIndex) * 2;
              const inShimmerBand =
                introTick >= Math.floor(settleTick * 0.45) &&
                columnIndex >= diagonalStart &&
                columnIndex < diagonalStart + shimmerWidth;

              if (inShimmerBand) {
                color = INTRO_LOGO_SHIMMER;
              }

              return `{${color}-fg}${char}{/}`;
            })
            .join(""),
        )
        .join("\n");

      logoBox.setContent(content);
    };

    this.introReady = false;
    cta.setContent("{#7a5a62-fg}materializing...{/}");
    paintLogo();
    this.render();

    const introTimer = setInterval(() => {
      introTick += 1;
      shimmer += 2;
      if (shimmer > maxLogoWidth + 16) {
        shimmer = -16;
      }

      if (!ctaBlinkReady && introTick >= settleTick) {
        ctaBlinkReady = true;
        this.introReady = true;

        let on = true;
        const blink = setInterval(() => {
          cta.setContent(
            on
              ? "{#ffe9ed-fg}press {bold}enter{/bold} to start{/}"
              : `{${ACCENT_PRIMARY}-fg}press enter to start{/}`,
          );
          on = !on;
          this.render();
        }, 460);
        this.timers.push(blink);
      }

      paintLogo();
      this.render();
    }, 85);
    this.timers.push(introTimer);

    this.onKey(["enter", "space"], () => {
      if (!this.introReady) {
        return;
      }
      if (this.forcedTool === "openclaw") {
        this.wizardIndex = 0;
        this.showWizardStep();
        return;
      }
      this.showToolPicker();
    });

    logoBox.setFront();
    cta.setFront();
    this.render();
  }

  private showToolPicker(): void {
    this.resetCanvas();

    const frame = this.makeFrame("What do you want to setup?", "Pick a flow and launch a guided install.");
    const cols = typeof this.screen.width === "number" ? this.screen.width : 120;
    const compact = cols < 112;
    const contentWidth = Math.min(Math.max(72, Math.min(cols - 6, 146)), Math.max(72, cols - 2));
    const contentLeft = Math.max(2, Math.floor((cols - contentWidth) / 2));

    blessed.box({
      parent: frame.body,
      top: 0,
      left: contentLeft,
      width: contentWidth,
      height: 1,
      tags: true,
      content: this.openclawStatus.configPresent
        ? `{${UI_MUTED}-fg}◉ Existing OpenClaw setup{/}  {${UI_DIM}-fg}•{/}  {${ACCENT_SECONDARY}-fg}Manage mode{/}`
        : `{${UI_MUTED}-fg}◉ Clean machine{/}  {${UI_DIM}-fg}•{/}  {${ACCENT_SECONDARY}-fg}New install mode{/}`,
    });

    blessed.box({
      parent: frame.body,
      top: 1,
      left: contentLeft,
      width: contentWidth,
      height: 1,
      tags: true,
      content: this.openclawStatus.configPresent
        ? `{${UI_DIM}-fg}Add channels, repair issues, refresh setup, or uninstall cleanly.{/}`
        : `{${UI_DIM}-fg}Guided onboarding with real OpenClaw commands and diagnostics.{/}`,
    });

    blessed.box({
      parent: frame.body,
      top: 2,
      left: contentLeft,
      width: contentWidth,
      height: 1,
      tags: true,
      content: `{${UI_BORDER}-fg}${"─".repeat(120)}{/}`,
    });

    const stage = blessed.box({
      parent: frame.body,
      top: 4,
      left: contentLeft,
      width: contentWidth,
      height: "100%-5",
      style: {
        bg: UI_BG,
      },
    });

    const leftPane = blessed.box({
      parent: stage,
      top: 1,
      left: 1,
      width: compact ? "100%-2" : "43%-1",
      height: compact ? "46%-1" : "100%-2",
      style: {
        bg: UI_BG,
        border: {
          fg: UI_BORDER,
        },
      },
      tags: true,
      border: {
        type: "line",
      },
    });

    const rightPane = blessed.box({
      parent: stage,
      top: compact ? "48%" : 1,
      left: compact ? 1 : "43%+1",
      width: compact ? "100%-2" : "57%-2",
      height: compact ? "52%-1" : "100%-2",
      style: {
        bg: UI_BG,
        border: {
          fg: UI_BORDER,
        },
      },
      tags: true,
      border: {
        type: "line",
      },
    });

    blessed.box({
      parent: leftPane,
      top: 0,
      left: 1,
      width: "100%-2",
      height: 1,
      tags: true,
      content: `{${ACCENT_SECONDARY}-fg}{bold}Flows{/bold}{/}`,
    });

    blessed.box({
      parent: rightPane,
      top: 0,
      left: 1,
      width: "100%-2",
      height: 1,
      tags: true,
      content: `{${ACCENT_SECONDARY}-fg}{bold}Preview{/bold}{/}`,
    });

    blessed.box({
      parent: leftPane,
      top: 1,
      left: 1,
      width: "100%-2",
      height: 1,
      tags: true,
      content: `{${UI_BORDER}-fg}${"─".repeat(120)}{/}`,
    });

    blessed.box({
      parent: rightPane,
      top: 1,
      left: 1,
      width: "100%-2",
      height: 1,
      tags: true,
      content: `{${UI_BORDER}-fg}${"─".repeat(120)}{/}`,
    });

    const list = blessed.list({
      parent: leftPane,
      top: 3,
      left: 1,
      width: "100%-2",
      height: "100%-4",
      keys: true,
      mouse: true,
      vi: true,
      tags: true,
      padding: {
        left: 1,
        right: 1,
      },
      style: {
        bg: UI_BG,
        selected: {
          bg: UI_SURFACE_ALT,
          fg: "#ffdce3",
          bold: true,
        },
        item: {
          fg: UI_TEXT,
        },
      },
    });

    const detail = blessed.box({
      parent: rightPane,
      top: 3,
      left: 1,
      width: "100%-2",
      height: "100%-4",
      tags: true,
      padding: {
        left: 1,
        right: 1,
      },
      style: {
        bg: UI_BG,
        fg: UI_TEXT,
      },
      scrollable: true,
      alwaysScroll: true,
    });

    list.setItems(
      TOOLS.map((tool) => {
        const status = tool.status === "ready" ? `{${ACCENT_PRIMARY}-fg}●{/}` : `{${UI_DIM}-fg}○{/}`;
        const availability = tool.status === "ready" ? `{${ACCENT_SECONDARY}-fg}ready{/}` : `{${UI_DIM}-fg}soon{/}`;
        return `${status} {bold}${tool.name}{/bold}  {${UI_MUTED}-fg}${tool.category}{/}  ${availability}`;
      }),
    );

    const updateDetail = (index: number): void => {
      const tool = TOOLS[index] ?? TOOLS[0];
      detail.setContent(
        [
          `{bold}${tool.name}{/bold}  {${UI_DIM}-fg}·{/}  {${UI_MUTED}-fg}${tool.category}{/}`,
          "",
          `${tool.description}`,
          "",
          tool.status === "ready"
            ? `{${ACCENT_PRIMARY}-fg}Status{/}: ready now`
            : `{${UI_DIM}-fg}Status{/}: in design queue`,
          "",
          "{bold}Why{/bold}",
          this.openclawStatus.configPresent
            ? `{${ACCENT_SECONDARY}-fg}Experience{/}: returning-user mode with guided management actions`
            : `{${ACCENT_SECONDARY}-fg}Experience{/}: first-time guided onboarding`,
          `{${ACCENT_SECONDARY}-fg}Depth{/}: real OpenClaw commands + post-setup diagnostics`,
          "",
          `{${UI_MUTED}-fg}Press Enter to continue with selected flow.{/}`,
        ].join("\n"),
      );
      this.render();
    };

    list.on("select item", (_item, index) => {
      updateDetail(index);
    });

    list.select(0);
    updateDetail(0);

    frame.footer.setContent(` {${UI_MUTED}-fg}j/k or ↑/↓{/} move  {${UI_DIM}-fg}•{/}  {${ACCENT_SECONDARY}-fg}Enter{/} continue  {${UI_DIM}-fg}•{/}  q quit `);

    this.onKey("enter", () => {
      const index = this.getSelectedIndex(list);
      const chosen = TOOLS[index] ?? TOOLS[0];
      if (chosen.status !== "ready") {
        this.flashFooter(frame.footer, `${chosen.name} flow is coming next. OpenClaw is ready now.`);
        return;
      }
      this.wizardIndex = 0;
      this.showWizardStep();
    });

    list.focus();
    this.render();
  }

  private getWizardSteps(): WizardStep[] {
    const hasExisting = this.openclawStatus.configPresent || this.openclawStatus.statePresent;
    if (!hasExisting) {
      this.state.operationMode = "new-install";
    }

    const all: WizardStep[] = [];

    if (hasExisting) {
      all.push({
        kind: "select",
        id: "operation-mode",
        title: "Setup journey",
        subtitle: "Existing OpenClaw install detected. Choose what to do next.",
        options: () => [
          { label: "Manage existing install (recommended)", value: "manage-existing" },
          { label: "Run fresh guided install", value: "new-install" },
        ],
        currentIndex: (state, options) => options.findIndex((item) => item.value === state.operationMode),
        apply: (state, value) => {
          state.operationMode = value as OpenClawWizardState["operationMode"];
        },
      });
    }

    all.push({
      kind: "select",
      id: "manage-action",
      title: "Management action",
      subtitle: "Choose the exact change you want SimpleSetup to perform.",
      options: () => [
        { label: "Add a new channel", value: "add-channel", hint: "Telegram, Discord, or WhatsApp" },
        { label: "Repair health issues", value: "repair", hint: "Run doctor auto-fixes + diagnostics" },
        { label: "Refresh core setup", value: "refresh-core", hint: "Re-run safe onboarding defaults" },
        { label: "Uninstall cleanly", value: "uninstall", hint: "Remove service/state/workspace" },
      ],
      currentIndex: (state, options) => options.findIndex((item) => item.value === state.manageAction),
      apply: (state, value) => {
        state.manageAction = value as OpenClawWizardState["manageAction"];
      },
      when: (state) => state.operationMode === "manage-existing",
    });

    all.push(
      {
        kind: "select",
        id: "setup-track",
        title: "Setup track",
        subtitle: "Choose where OpenClaw should run and what this machine should configure.",
        options: () => [
          {
            label: "This laptop (recommended)",
            value: "local-laptop",
            hint: "Quick local setup for personal development on this machine.",
          },
          {
            label: "Remote gateway connect",
            value: "remote-connect",
            hint: "Connect this machine to an already-running OpenClaw gateway.",
          },
        ],
        currentIndex: (state, options) => options.findIndex((item) => item.value === state.setupTrack),
        apply: (state, value) => {
          state.setupTrack = value as OpenClawWizardState["setupTrack"];
          state.mode = state.setupTrack === "remote-connect" ? "cloud" : "local";
          if (state.setupTrack === "remote-connect") {
            state.installDaemon = false;
          }
        },
        when: (state) => state.operationMode === "new-install",
      },
      {
        kind: "select",
        id: "auth-guidance",
        title: "Auth provider",
        subtitle: "Choose how onboarding should configure model authentication.",
        options: () => [
          { label: "OpenAI Codex subscription", value: "openai-codex", hint: "Uses --auth-choice openai-codex" },
          { label: "OpenAI API key", value: "openai-key", hint: "Uses --auth-choice openai-api-key" },
          { label: "Anthropic API key", value: "anthropic-key", hint: "Uses --auth-choice apiKey" },
          { label: "OpenRouter API key", value: "openrouter-key", hint: "Uses --auth-choice openrouter-api-key" },
          { label: "xAI API key", value: "xai-key", hint: "Uses --auth-choice xai-api-key" },
          { label: "Local Ollama", value: "ollama-local", hint: "Uses --auth-choice ollama" },
          { label: "Skip auth for now", value: "skip", hint: "Onboard first, configure model auth later" },
        ],
        currentIndex: (state, options) => options.findIndex((item) => item.value === state.authGuidance),
        apply: (state, value) => {
          state.authGuidance = value as OpenClawWizardState["authGuidance"];
          if (["openai-codex", "ollama-local", "skip", "auto"].includes(state.authGuidance)) {
            state.providerApiKey = "";
          }
        },
        when: (state) => state.operationMode === "new-install" && state.setupTrack !== "remote-connect",
      },
      {
        kind: "input",
        id: "provider-api-key",
        title: "Provider API key",
        subtitle: "Optional: paste key now for this run only, or leave blank to use exported env.",
        placeholder: "sk-...",
        defaultValue: (state) => state.providerApiKey,
        validate: (value, state) => {
          if (value.trim().length === 0) {
            return null;
          }
          if (state.authGuidance === "openai-key" && !value.startsWith("sk-")) {
            return "OpenAI keys usually start with sk-. Leave blank to use env if needed.";
          }
          return null;
        },
        apply: (state, value) => {
          state.providerApiKey = value.trim();
        },
        when: (state) =>
          state.operationMode === "new-install" &&
          state.setupTrack !== "remote-connect" &&
          ["openai-key", "anthropic-key", "openrouter-key", "xai-key"].includes(state.authGuidance),
      },
      {
        kind: "select",
        id: "install-daemon",
        title: "Background daemon",
        subtitle: "Install OpenClaw as a background service after onboarding.",
        options: () => [
          { label: "Install daemon", value: "yes", hint: "Recommended for always-on assistant." },
          { label: "Skip daemon install", value: "no", hint: "Run manually when needed." },
        ],
        currentIndex: (state) => (state.installDaemon ? 0 : 1),
        apply: (state, value) => {
          state.installDaemon = value === "yes";
        },
        when: (state) => state.operationMode === "new-install" && state.setupTrack === "local-laptop",
      },
      {
        kind: "input",
        id: "remote-url",
        title: "Remote gateway URL",
        subtitle: "URL for the remote OpenClaw gateway.",
        placeholder: "wss://gateway-host:18789",
        defaultValue: (state) => state.remoteUrl,
        validate: (value) => {
          const trimmed = value.trim();
          if (!trimmed.startsWith("ws://") && !trimmed.startsWith("wss://")) {
            return "Use ws:// or wss:// URL.";
          }
          return null;
        },
        apply: (state, value) => {
          state.remoteUrl = value.trim();
        },
        when: (state) => state.operationMode === "new-install" && state.setupTrack === "remote-connect",
      },
      {
        kind: "select",
        id: "first-channel",
        title: "Channel action",
        subtitle: "Choose the channel action to run after setup/management.",
        options: (state) =>
          state.operationMode === "manage-existing" && state.manageAction === "add-channel"
            ? [
                { label: "Telegram", value: "telegram", hint: "Add Telegram channel using bot token" },
                { label: "Discord", value: "discord", hint: "Add Discord channel using bot token" },
                { label: "WhatsApp", value: "whatsapp", hint: "Start WhatsApp QR login flow" },
              ]
            : [
                { label: "Dashboard only", value: "dashboard-only", hint: "Skip channel changes" },
                { label: "Telegram", value: "telegram", hint: "Add Telegram channel using bot token" },
                { label: "Discord", value: "discord", hint: "Add Discord channel using bot token" },
                { label: "WhatsApp", value: "whatsapp", hint: "Start WhatsApp QR login flow" },
              ],
        currentIndex: (state, options) => options.findIndex((item) => item.value === state.firstChannel),
        apply: (state, value) => {
          state.firstChannel = value as OpenClawWizardState["firstChannel"];
          if (!["telegram", "discord"].includes(state.firstChannel)) {
            state.channelToken = "";
          }
        },
        when: (state) =>
          (state.operationMode === "new-install" && state.setupTrack !== "remote-connect") ||
          (state.operationMode === "manage-existing" && state.manageAction === "add-channel"),
      },
      {
        kind: "input",
        id: "channel-token",
        title: "Channel token",
        subtitle: "Optional: paste token now for this run, or leave blank to use exported env.",
        placeholder: "token",
        defaultValue: (state) => state.channelToken,
        apply: (state, value) => {
          state.channelToken = value.trim();
        },
        when: (state) =>
          (
            (state.operationMode === "new-install" && state.setupTrack !== "remote-connect") ||
            (state.operationMode === "manage-existing" && state.manageAction === "add-channel")
          ) &&
          ["telegram", "discord"].includes(state.firstChannel),
      },
      {
        kind: "select",
        id: "uninstall-scope",
        title: "Uninstall scope",
        subtitle: "Choose how much OpenClaw data to remove.",
        options: () => [
          {
            label: "Service + state + workspace",
            value: "service-state-workspace",
            hint: "Removes daemon, config/state, and workspace dirs",
          },
          {
            label: "Full uninstall (all)",
            value: "full",
            hint: "Also removes app-managed files where supported",
          },
        ],
        currentIndex: (state, options) => options.findIndex((item) => item.value === state.uninstallScope),
        apply: (state, value) => {
          state.uninstallScope = value as OpenClawWizardState["uninstallScope"];
        },
        when: (state) => state.operationMode === "manage-existing" && state.manageAction === "uninstall",
      },
      {
        kind: "select",
        id: "doctor",
        title: "Run diagnostics",
        subtitle: "Run openclaw doctor automatically after setup.",
        options: () => [
          { label: "Yes, run diagnostics", value: "yes" },
          { label: "No, skip diagnostics", value: "no" },
        ],
        currentIndex: (state) => (state.runDoctorAfterSetup ? 0 : 1),
        apply: (state, value) => {
          state.runDoctorAfterSetup = value === "yes";
        },
        when: (state) =>
          !(state.operationMode === "manage-existing" && state.manageAction === "uninstall") &&
          !(state.operationMode === "manage-existing" && state.manageAction === "repair"),
      },
      {
        kind: "select",
        id: "dashboard-open",
        title: "Open dashboard",
        subtitle: "Open OpenClaw dashboard once setup finishes.",
        options: () => [
          { label: "Yes, open dashboard", value: "yes" },
          { label: "No, don't open dashboard", value: "no" },
        ],
        currentIndex: (state) => (state.openDashboardAfterSetup ? 0 : 1),
        apply: (state, value) => {
          state.openDashboardAfterSetup = value === "yes";
        },
        when: (state) => !(state.operationMode === "manage-existing" && state.manageAction === "uninstall"),
      },
      {
        kind: "review",
        id: "review",
        title: "Review and launch",
        subtitle: "Run real OpenClaw setup/management commands end-to-end.",
      },
    );

    return all.filter((step) => {
      if ("when" in step && typeof step.when === "function") {
        return step.when(this.state);
      }
      return true;
    });
  }

  private showWizardStep(): void {
    const steps = this.getWizardSteps();
    if (this.wizardIndex < 0) {
      this.wizardIndex = 0;
    }
    if (this.wizardIndex >= steps.length) {
      this.wizardIndex = steps.length - 1;
    }

    const step = steps[this.wizardIndex];
    if (!step) {
      this.showToolPicker();
      return;
    }

    if (step.kind === "select") {
      this.showSelectStep(step, this.wizardIndex + 1, steps.length);
      return;
    }
    if (step.kind === "input") {
      this.showInputStep(step, this.wizardIndex + 1, steps.length);
      return;
    }
    this.showReviewStep(this.wizardIndex + 1, steps.length);
  }

  private showSelectStep(step: SelectStep, stepNumber: number, totalSteps: number): void {
    this.resetCanvas();

    const frame = this.makeFrame(
      `OpenClaw setup • ${step.title}`,
      `${step.subtitle}  [step ${stepNumber}/${totalSteps}]`,
    );

    const cols = typeof this.screen.width === "number" ? this.screen.width : 120;
    const compact = cols < 108;
    const contentWidth = Math.min(Math.max(72, Math.min(cols - 6, 146)), Math.max(72, cols - 2));
    const contentLeft = Math.max(2, Math.floor((cols - contentWidth) / 2));

    const options = step.options(this.state);
    const progress = Math.round((stepNumber / Math.max(totalSteps, 1)) * 100);
    const journeyLabel = this.state.operationMode === "manage-existing" ? "manage" : this.state.setupTrack;

    blessed.box({
      parent: frame.body,
      top: 0,
      left: contentLeft,
      width: contentWidth,
      height: 1,
      tags: true,
      content: `{${UI_MUTED}-fg}◉ ${progress}% complete{/}  {${UI_DIM}-fg}•{/}  {${ACCENT_SECONDARY}-fg}${journeyLabel}{/}  {${UI_DIM}-fg}•{/}  {${UI_MUTED}-fg}Choose one option and preview the exact command plan.{/}`,
    });

    blessed.box({
      parent: frame.body,
      top: 1,
      left: contentLeft,
      width: contentWidth,
      height: 1,
      tags: true,
      content: `{${UI_BORDER}-fg}${"─".repeat(140)}{/}`,
    });

    const stage = blessed.box({
      parent: frame.body,
      top: 3,
      left: contentLeft,
      width: contentWidth,
      height: "100%-4",
      style: {
        bg: UI_BG,
      },
    });

    const leftPane = blessed.box({
      parent: stage,
      top: 1,
      left: 1,
      width: compact ? "100%-2" : "41%-1",
      height: compact ? "44%-1" : "100%-2",
      style: {
        bg: UI_BG,
      },
      tags: true,
    });

    const rightPane = blessed.box({
      parent: stage,
      top: compact ? "46%" : 1,
      left: compact ? 1 : "41%+1",
      width: compact ? "100%-2" : "59%-2",
      height: compact ? "54%-1" : "100%-2",
      style: {
        bg: UI_BG,
      },
      tags: true,
    });

    if (!compact) {
      blessed.box({
        parent: stage,
        top: 1,
        left: "41%",
        width: 1,
        height: "100%-2",
        tags: true,
        content: Array.from({ length: Math.max(1, (typeof this.screen.height === "number" ? this.screen.height : 40) - 10) }, () => `{${UI_BORDER}-fg}│{/}`).join("\n"),
      });
    }

    blessed.box({
      parent: leftPane,
      top: 0,
      left: 1,
      width: "100%-2",
      height: 1,
      tags: true,
      content: `{${ACCENT_SECONDARY}-fg}{bold}Choose{/bold}{/}  {${UI_DIM}-fg}${step.title.toLowerCase()}{/}`,
    });

    blessed.box({
      parent: leftPane,
      top: 1,
      left: 1,
      width: "100%-2",
      height: 1,
      tags: true,
      content: `{${UI_BORDER}-fg}${"─".repeat(120)}{/}`,
    });

    blessed.box({
      parent: rightPane,
      top: 0,
      left: 1,
      width: "100%-2",
      height: 1,
      tags: true,
      content: `{${ACCENT_SECONDARY}-fg}{bold}Dynamic Preview{/bold}{/}  {${UI_DIM}-fg}updates as you move{/}`,
    });

    blessed.box({
      parent: rightPane,
      top: 1,
      left: 1,
      width: "100%-2",
      height: 1,
      tags: true,
      content: `{${UI_BORDER}-fg}${"─".repeat(120)}{/}`,
    });

    const list = blessed.list({
      parent: leftPane,
      top: 3,
      left: 1,
      width: "100%-2",
      height: "100%-4",
      keys: true,
      mouse: true,
      vi: true,
      tags: true,
      padding: {
        left: 1,
        right: 1,
      },
      style: {
        bg: UI_BG,
        selected: {
          bg: UI_SURFACE_ALT,
          fg: "#ffdce3",
          bold: true,
        },
        item: {
          fg: UI_TEXT,
        },
      },
    });

    const detail = blessed.box({
      parent: rightPane,
      top: 3,
      left: 1,
      width: "100%-2",
      height: "100%-4",
      tags: true,
      padding: {
        left: 1,
        right: 1,
      },
      style: {
        bg: UI_BG,
        fg: UI_TEXT,
      },
      scrollable: true,
      alwaysScroll: true,
    });

    list.setItems(
      options.map((option, index) => {
        const number = String(index + 1).padStart(2, "0");
        return `{${UI_DIM}-fg}${number}{/}  ${option.label}`;
      }),
    );
    list.select(Math.max(0, step.currentIndex(this.state, options)));

    const updateDetail = (index: number): void => {
      const option = options[index] ?? options[0];
      const previewState: OpenClawWizardState = { ...this.state };
      if (option) {
        step.apply(previewState, option.value);
      }

      const applyCommand = buildOpenClawApplyCommand(previewState);
      const plan = buildOpenClawExecutionPlan(previewState);

      detail.setContent(
        [
          `{bold}${option?.label ?? step.title}{/bold}`,
          "",
          option?.hint ? `{${UI_MUTED}-fg}${option.hint}{/}` : `{${UI_MUTED}-fg}Choose and press Enter.{/}`,
          "",
          `{${ACCENT_SECONDARY}-fg}Execution outline{/}`,
          ...plan.slice(0, 3).map((planStep, planIndex) =>
            `{${UI_SUCCESS}-fg}${planIndex + 1}.{/} ${planStep.label}`,
          ),
          plan.length > 3 ? `{${UI_DIM}-fg}… +${plan.length - 3} more step(s){/}` : "",
          "",
          `{${ACCENT_SECONDARY}-fg}Primary command{/}`,
          `{${UI_TEXT}-fg}$ ${applyCommand}{/}`,
          "",
          `{${UI_WARNING}-fg}Tips{/}: Enter continue  •  b back  •  q quit`,
        ].join("\n"),
      );
      this.render();
    };

    list.on("select item", (_item, index) => {
      updateDetail(index);
    });

    updateDetail(this.getSelectedIndex(list));
    frame.footer.setContent(` {${UI_MUTED}-fg}j/k or ↑/↓{/} move  {${UI_DIM}-fg}•{/}  {${ACCENT_SECONDARY}-fg}Enter{/} continue  {${UI_DIM}-fg}•{/}  b back  {${UI_DIM}-fg}•{/}  q quit `);

    this.onKey("enter", () => {
      const selected = options[this.getSelectedIndex(list)];
      if (!selected) {
        return;
      }
      step.apply(this.state, selected.value);
      this.wizardIndex += 1;
      this.showWizardStep();
    });

    this.onKey("b", () => {
      this.wizardIndex = Math.max(0, this.wizardIndex - 1);
      this.showWizardStep();
    });

    list.focus();
    this.render();
  }

  private showInputStep(step: InputStep, stepNumber: number, totalSteps: number): void {
    this.resetCanvas();

    const frame = this.makeFrame(
      `OpenClaw setup • ${step.title}`,
      `${step.subtitle}  [step ${stepNumber}/${totalSteps}]`,
    );

    const cols = typeof this.screen.width === "number" ? this.screen.width : 120;
    const panelWidth = Math.max(62, Math.min(cols - 8, 104));
    const isSecretInput = ["token", "password", "api-key"].some((marker) => step.id.includes(marker));

    const panel = blessed.box({
      parent: frame.body,
      top: "center",
      left: "center",
      width: panelWidth,
      height: 14,
      border: {
        type: "line",
      },
      style: {
        bg: UI_SURFACE,
        border: {
          fg: UI_BORDER,
        },
        fg: UI_TEXT,
      },
      tags: true,
      label: " Input ",
    });

    blessed.box({
      parent: panel,
      top: 1,
      left: 2,
      width: "100%-4",
      height: 1,
      content: `{bold}${step.title}{/bold}`,
      tags: true,
    });

    blessed.box({
      parent: panel,
      top: 2,
      left: 2,
      width: "100%-4",
      height: 1,
      content: `{${UI_MUTED}-fg}${step.subtitle}{/}`,
      tags: true,
    });

    blessed.box({
      parent: panel,
      top: 3,
      left: 2,
      width: "100%-4",
      height: 1,
      tags: true,
      content: `{${UI_DIM}-fg}${"─".repeat(52)}{/}`,
    });

    const input = blessed.textbox({
      parent: panel,
      top: 5,
      left: 2,
      width: "100%-4",
      height: 3,
      border: {
        type: "line",
      },
      inputOnFocus: true,
      keys: true,
      mouse: true,
      censor: isSecretInput,
      style: {
        bg: UI_SURFACE_ALT,
        border: {
          fg: ACCENT_DARK,
        },
        fg: UI_TEXT,
      },
      value: step.defaultValue(this.state) || step.placeholder,
    });

    blessed.box({
      parent: panel,
      top: 9,
      left: 2,
      width: "100%-4",
      height: 1,
      tags: true,
      content: isSecretInput
        ? `{${UI_MUTED}-fg}Secret mode: value is masked and only used for this run{/}`
        : `{${UI_MUTED}-fg}Input mode: plain text (you can edit before submit){/}`,
    });

    const errorBox = blessed.box({
      parent: panel,
      top: 11,
      left: 2,
      width: "100%-4",
      height: 1,
      tags: true,
      content: "",
    });

    frame.footer.setContent(` {${ACCENT_SECONDARY}-fg}Enter{/} confirm  {${UI_DIM}-fg}•{/}  b back  {${UI_DIM}-fg}•{/}  Esc stop editing  {${UI_DIM}-fg}•{/}  q quit `);

    const submit = (): void => {
      const raw = input.getValue().trim();
      const value = raw.length > 0 ? raw : step.defaultValue(this.state);
      const error = step.validate ? step.validate(value, this.state) : null;
      if (error) {
        errorBox.setContent(`{${ACCENT_PRIMARY}-fg}${error}{/}`);
        this.render();
        return;
      }
      step.apply(this.state, value);
      this.wizardIndex += 1;
      this.showWizardStep();
    };

    this.onKey("enter", () => {
      submit();
    });

    this.onKey("b", () => {
      this.wizardIndex = Math.max(0, this.wizardIndex - 1);
      this.showWizardStep();
    });

    input.focus();
    input.readInput();
    this.render();
  }

  private showReviewStep(stepNumber: number, totalSteps: number): void {
    this.resetCanvas();

    const setupTrackLabel: Record<OpenClawWizardState["setupTrack"], string> = {
      "local-laptop": "this laptop",
      "remote-connect": "remote gateway connect",
    };

    const frame = this.makeFrame(
      "OpenClaw setup • Review and launch",
      `Validate plan and launch real setup commands.  [step ${stepNumber}/${totalSteps}]`,
    );

    const cols = typeof this.screen.width === "number" ? this.screen.width : 120;
    const compact = cols < 118;
    const contentWidth = Math.min(Math.max(72, Math.min(cols - 6, 146)), Math.max(72, cols - 2));
    const contentLeft = Math.max(2, Math.floor((cols - contentWidth) / 2));

    blessed.box({
      parent: frame.body,
      top: 0,
      left: contentLeft,
      width: contentWidth,
      height: 1,
      tags: true,
      content: `{${UI_MUTED}-fg}◉ final review{/}  {${UI_DIM}-fg}•{/}  {${ACCENT_SECONDARY}-fg}real commands{/}  {${UI_DIM}-fg}•{/}  {${UI_MUTED}-fg}launch now or save script{/}`,
    });

    blessed.box({
      parent: frame.body,
      top: 1,
      left: contentLeft,
      width: contentWidth,
      height: 1,
      tags: true,
      content: `{${UI_BORDER}-fg}${"─".repeat(140)}{/}`,
    });

    const stage = blessed.box({
      parent: frame.body,
      top: 3,
      left: contentLeft,
      width: contentWidth,
      height: "100%-4",
      style: {
        bg: UI_BG,
      },
      tags: true,
    });

    const summary = blessed.box({
      parent: stage,
      top: 1,
      left: 1,
      width: compact ? "100%-2" : "34%-1",
      height: compact ? "34%-1" : "100%-2",
      tags: true,
      padding: {
        left: 1,
        right: 1,
      },
      style: {
        bg: UI_BG,
        fg: UI_TEXT,
      },
      label: " Plan Summary ",
      scrollable: true,
      alwaysScroll: true,
    });

    summary.setContent(
      [
        `{bold}Journey{/bold}: ${this.state.operationMode}`,
        this.state.operationMode === "manage-existing" ? `{bold}Manage Action{/bold}: ${this.state.manageAction}` : "",
        this.state.operationMode === "new-install" ? `{bold}Track{/bold}: ${setupTrackLabel[this.state.setupTrack]}` : "",
        this.state.operationMode === "new-install" && this.state.setupTrack !== "remote-connect"
          ? `{bold}Auth Guidance{/bold}: ${this.state.authGuidance}`
          : "",
        this.state.operationMode === "new-install" && this.state.setupTrack !== "remote-connect"
          ? `{bold}Install Daemon{/bold}: ${this.state.installDaemon ? "yes" : "no"}`
          : "",
        this.state.setupTrack === "remote-connect" ? `{bold}Remote URL{/bold}: ${this.state.remoteUrl}` : "",
        this.state.firstChannel !== "dashboard-only" ? `{bold}Channel{/bold}: ${this.state.firstChannel}` : "",
        this.state.channelToken ? `{bold}Channel Token{/bold}: provided` : "",
        this.state.manageAction === "uninstall" ? `{bold}Uninstall Scope{/bold}: ${this.state.uninstallScope}` : "",
        !(this.state.operationMode === "manage-existing" && this.state.manageAction === "repair") &&
        !(this.state.operationMode === "manage-existing" && this.state.manageAction === "uninstall")
          ? `{bold}Run Doctor{/bold}: ${this.state.runDoctorAfterSetup ? "yes" : "no"}`
          : "",
        !(this.state.operationMode === "manage-existing" && this.state.manageAction === "uninstall")
          ? `{bold}Open Dashboard{/bold}: ${this.state.openDashboardAfterSetup ? "yes" : "no"}`
          : "",
        "",
        `{${UI_MUTED}-fg}This flow uses official OpenClaw commands end-to-end.{/}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );

    const executionPlan = buildOpenClawExecutionPlan(this.state);
    const applyCommand = buildOpenClawApplyCommand(this.state);

    const commandBox = blessed.box({
      parent: stage,
      top: compact ? "34%+2" : 1,
      left: compact ? 1 : "34%+1",
      width: compact ? "100%-2" : "66%-2",
      height: compact ? "44%-1" : "74%-2",
      tags: true,
      style: {
        bg: UI_BG,
        fg: UI_TEXT,
      },
      label: " Command Plan ",
      scrollable: true,
      alwaysScroll: true,
      padding: {
        left: 1,
        right: 1,
      },
      content: [
        ...executionPlan.map(
          (step, index) => `{${UI_SUCCESS}-fg}${index + 1}.{/} ${step.label}\n{${UI_MUTED}-fg}$ ${step.displayCommand ?? step.command}{/}\n`,
        ),
        `{${ACCENT_SECONDARY}-fg}Primary onboard command{/}`,
        `$ ${applyCommand}`,
      ].join("\n"),
    });

    const actionList = blessed.list({
      parent: stage,
      top: compact ? "78%" : "74%",
      left: compact ? 1 : "34%+1",
      width: compact ? "100%-2" : "66%-2",
      height: compact ? "22%-1" : "26%-1",
      keys: true,
      vi: true,
      mouse: true,
      tags: true,
      style: {
        bg: UI_BG,
        selected: {
          bg: UI_SURFACE_ALT,
          fg: ACCENT_SECONDARY,
          bold: true,
        },
        item: {
          fg: UI_TEXT,
        },
      },
      label: " Launch ",
      items: [
        `{${ACCENT_SECONDARY}-fg}▶{/} Run guided setup now`,
        `{${UI_MUTED}-fg}▸{/} Save script to .openclaw-setup/openclaw-run-plan.sh`,
        `{${UI_MUTED}-fg}▸{/} Back to previous step`,
        `{${UI_MUTED}-fg}▸{/} Return to tool picker`,
      ],
    });

    frame.footer.setContent(` {${UI_MUTED}-fg}j/k or ↑/↓{/} action  {${UI_DIM}-fg}•{/}  {${ACCENT_SECONDARY}-fg}Enter{/} confirm  {${UI_DIM}-fg}•{/}  b back  {${UI_DIM}-fg}•{/}  q quit `);

    this.onKey("enter", () => {
      const selected = this.getSelectedIndex(actionList);
      if (selected === 0) {
        void this.showRunScreen(executionPlan);
        return;
      }
      if (selected === 1) {
        void this.saveCommand(executionPlan, frame.footer);
        return;
      }
      if (selected === 2) {
        this.wizardIndex = Math.max(0, this.wizardIndex - 1);
        this.showWizardStep();
        return;
      }
      this.showToolPicker();
    });

    this.onKey("b", () => {
      this.wizardIndex = Math.max(0, this.wizardIndex - 1);
      this.showWizardStep();
    });

    commandBox.setScrollPerc(100);
    actionList.focus();
    this.render();
  }

  private async saveCommand(executionPlan: OpenClawExecutionStep[], footer: Blessed.Widgets.BoxElement): Promise<void> {
    const outputDir = join(process.cwd(), ".openclaw-setup");
    const outputPath = join(outputDir, "openclaw-run-plan.sh");
    await mkdir(outputDir, { recursive: true });
    const script = [
      "#!/usr/bin/env bash",
      "set -euo pipefail",
      "",
      ...executionPlan.flatMap((step) => [
        `# ${step.label}`,
        ...(step.env ? [`# requires env: ${Object.keys(step.env).join(", ")}`] : []),
        step.allowFailure ? `${step.command} || true` : step.command,
        "",
      ]),
    ].join("\n");
    await writeFile(outputPath, script, { mode: 0o755 });
    this.flashFooter(footer, `Saved script: ${outputPath}`);
  }

  private async showRunScreen(executionPlan: OpenClawExecutionStep[]): Promise<void> {
    this.resetCanvas();

    const frame = this.makeFrame("Running OpenClaw plan", "Executing each command with live output and safe failure handling.");

    const commandBox = blessed.box({
      parent: frame.body,
      top: 0,
      left: 0,
      width: "100%",
      height: 5,
      border: {
        type: "line",
      },
      tags: true,
      style: {
        bg: UI_SURFACE_ALT,
        border: { fg: UI_BORDER },
        fg: UI_TEXT,
      },
      label: " Active Step ",
      content: executionPlan[0]
        ? `${executionPlan[0].label}\n$ ${executionPlan[0].displayCommand ?? executionPlan[0].command}`
        : "No execution steps generated.",
      padding: {
        left: 1,
        right: 1,
      },
    });

    const logBox = blessed.box({
      parent: frame.body,
      top: 5,
      left: 0,
      width: "100%",
      height: "100%-6",
      border: {
        type: "line",
      },
      tags: false,
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      keys: true,
      vi: true,
      style: {
        bg: UI_SURFACE,
        border: { fg: UI_BORDER },
        fg: UI_TEXT,
      },
      label: " Live Output ",
      padding: {
        left: 1,
        right: 1,
      },
      content: "",
    });

    const lines: string[] = [];
    const append = (chunk: string): void => {
      const split = chunk.replace(/\r/g, "\n").split("\n").filter(Boolean);
      lines.push(...split);
      const trimmed = lines.slice(-500);
      logBox.setContent(trimmed.join("\n"));
      logBox.setScrollPerc(100);
      this.render();
    };

    const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let spinnerIndex = 0;
    let running = true;

    const spinnerTimer = setInterval(() => {
      if (!running) {
        return;
      }
      const activeStep = executionPlan[Math.min(currentStepIndex, executionPlan.length - 1)];
      const stepLabel = activeStep ? `${currentStepIndex + 1}/${executionPlan.length} ${activeStep.label}` : "starting";
      frame.footer.setContent(` ${spinnerFrames[spinnerIndex]} ${stepLabel} • x cancel • q quit `);
      spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
      this.render();
    }, 90);
    this.timers.push(spinnerTimer);

    let currentStepIndex = 0;
    let cancelRequested = false;

    const runStep = async (step: OpenClawExecutionStep): Promise<number> => {
      return await new Promise((resolve) => {
        const child = spawn(step.command, {
          shell: true,
          stdio: ["ignore", "pipe", "pipe"],
          env: {
            ...process.env,
            ...(step.env ?? {}),
          },
        });
        this.activeChild = child;

        child.stdout?.on("data", (data: Buffer) => {
          append(data.toString("utf8"));
        });

        child.stderr?.on("data", (data: Buffer) => {
          append(data.toString("utf8"));
        });

        child.on("close", (code) => {
          this.activeChild = null;
          resolve(code ?? 1);
        });
      });
    };

    append(`Execution plan contains ${executionPlan.length} step(s).`);

    void (async () => {
      for (let index = 0; index < executionPlan.length; index += 1) {
        if (cancelRequested) {
          running = false;
          frame.footer.setContent(" Execution cancelled • b back to review • q quit ");
          append("\nExecution cancelled by user.");
          this.render();
          return;
        }

        const step = executionPlan[index];
        const shownCommand = step.displayCommand ?? step.command;
        currentStepIndex = index;
        commandBox.setContent(`${step.label}\n$ ${shownCommand}`);
        append(`\n[${index + 1}/${executionPlan.length}] ${step.label}`);
        append(`$ ${shownCommand}`);

        const code = await runStep(step);
        if (code !== 0 && !step.allowFailure) {
          running = false;
          frame.footer.setContent(` Step failed (${code}) • b back to review • q quit `);
          append(`\nStep failed with exit code ${code}.`);
          this.render();
          return;
        }

        if (code !== 0 && step.allowFailure) {
          append(`~ ${step.label} exited with ${code}, continuing (allowed).`);
          continue;
        }

        append(`✓ ${step.label} complete`);
      }

      running = false;
      frame.footer.setContent(" Deploy complete • b back to review • q quit ");
      append("\nOpenClaw deployment finished successfully.");
      this.render();
    })();

    this.onKey("x", () => {
      if (!this.activeChild) {
        cancelRequested = true;
        return;
      }
      cancelRequested = true;
      this.activeChild.kill("SIGINT");
      frame.footer.setContent(" Cancel requested... waiting for process to exit ");
      this.render();
    });

    this.onKey("b", () => {
      if (running) {
        return;
      }
      this.showReviewStep(this.wizardIndex + 1, this.getWizardSteps().length);
    });

    commandBox.setFront();
    this.render();
  }

  private makeFrame(title: string, subtitle: string): {
    root: Blessed.Widgets.BoxElement;
    body: Blessed.Widgets.BoxElement;
    footer: Blessed.Widgets.BoxElement;
  } {
    const root = blessed.box({
      parent: this.screen,
      width: "100%",
      height: "100%",
      style: {
        bg: UI_BG,
      },
    });

    const header = blessed.box({
      parent: root,
      top: 0,
      left: 0,
      width: "100%",
      height: 2,
      style: {
        bg: UI_SURFACE,
      },
      tags: true,
    });

    const stepTag = subtitle.match(/\[step [^\]]+\]/i)?.[0] ?? "";

    header.setContent(
      ` {${ACCENT_SECONDARY}-fg}{bold}SIMPLESETUP{/bold}{/} {${UI_DIM}-fg}◦{/} {${ACCENT_PRIMARY}-fg}OPENCLAW{/}\n {${ACCENT_PRIMARY}-fg}{bold}${title}{/bold}{/}${stepTag ? `  {${UI_DIM}-fg}${stepTag}{/}` : ""}`,
    );

    blessed.box({
      parent: root,
      top: 2,
      left: 1,
      width: "100%-2",
      height: 1,
      tags: true,
      content: `{${UI_BORDER}-fg}${"─".repeat(180)}{/}`,
    });

    const body = blessed.box({
      parent: root,
      top: 3,
      left: 0,
      width: "100%",
      height: "100%-5",
      style: {
        bg: UI_BG,
      },
    });

    const footer = blessed.box({
      parent: root,
      bottom: 0,
      left: 0,
      width: "100%",
      height: 2,
      style: {
        bg: UI_SURFACE,
        fg: UI_TEXT,
      },
      tags: true,
      content: "",
    });

    return { root, body, footer };
  }

  private flashFooter(footer: Blessed.Widgets.BoxElement, message: string): void {
    const original = footer.getContent();
    footer.setContent(` {${UI_WARNING}-fg}${message}{/}`);
    this.render();
    const timer = setTimeout(() => {
      footer.setContent(original);
      this.render();
    }, 1800);
    this.timers.push(timer);
  }
}

function parseArgValue(flag: string): string | null {
  const index = process.argv.findIndex((item) => item === flag);
  if (index === -1) {
    return null;
  }
  return process.argv[index + 1] ?? null;
}

function main(): void {
  const forcedTool = parseArgValue("--tool");
  const app = new SimpleSetupTui(forcedTool);
  app.start();
}

main();
