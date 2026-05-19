"use client";

import { track } from "@vercel/analytics/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type CommandOutput,
  resolveCommand,
  suggest,
  type TerminalProfile,
} from "./commands";

interface TerminalProps {
  readonly profile: TerminalProfile;
  readonly autoRun?: readonly string[];
}

interface Entry {
  readonly id: number;
  readonly input?: string;
  readonly outputs: readonly CommandOutput[];
}

const PROMPT_USER = "shoaib";
const PROMPT_HOST = "portfolio";

export function Terminal({ profile, autoRun = ["whoami"] }: TerminalProps) {
  const [entries, setEntries] = useState<readonly Entry[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<readonly string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [completion, setCompletion] = useState<string>("");
  const [announcement, setAnnouncement] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const hasAutoRun = useRef(false);

  const ctx = useMemo(
    () => ({
      profile,
      history,
      clear: () => setEntries([]),
      run: (raw: string) => execute(raw),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, history],
  );

  const execute = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        setEntries((prev) => [
          ...prev,
          { id: nextId.current++, input: "", outputs: [] },
        ]);
        return;
      }

      // Parse: split on spaces but preserve quoted strings
      const tokens: string[] = [];
      let current = "";
      let inQuote = false;
      for (const ch of trimmed) {
        if (ch === '"') {
          inQuote = !inQuote;
          current += ch;
        } else if (ch === " " && !inQuote) {
          if (current) tokens.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
      if (current) tokens.push(current);

      const [name, ...args] = tokens;
      const cmd = resolveCommand(name);

      if (!cmd) {
        setEntries((prev) => [
          ...prev,
          {
            id: nextId.current++,
            input: trimmed,
            outputs: [
              {
                kind: "error",
                value: `command not found: ${name}. Type 'help' to see what's available.`,
              },
            ],
          },
        ]);
        setHistory((h) => [...h, trimmed]);
        setAnnouncement(`Error: command not found: ${name}`);
        track("v2_command", { name: name ?? "", outcome: "not_found" });
        return;
      }

      const result = cmd.run(args, ctx);
      const outputs = Array.isArray(result) ? result : [result];

      if (outputs.some((o) => o.kind === "clear")) {
        setEntries([]);
        setAnnouncement("Screen cleared");
      } else {
        setEntries((prev) => [
          ...prev,
          { id: nextId.current++, input: trimmed, outputs },
        ]);
        setAnnouncement(`Output for ${name}`);
      }
      setHistory((h) => [...h, trimmed]);
      setHistoryIdx(-1);
      track("v2_command", { name: cmd.name, outcome: "ok" });
    },
    [ctx],
  );

  // Auto-run on mount + focus input for keyboard users
  useEffect(() => {
    if (hasAutoRun.current) return;
    hasAutoRun.current = true;
    for (const c of autoRun) execute(c);
    // Defer focus so the autoRun output renders first
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [autoRun, execute]);

  // Track time-in-shell and completion rate on unload
  useEffect(() => {
    const mountedAt = performance.now();
    const handleLeave = () => {
      const seconds = Math.round((performance.now() - mountedAt) / 1000);
      // history includes autoRun entries; subtract them for the "user commands" count
      const userCmds = Math.max(0, history.length - autoRun.length);
      track("v2_session_end", {
        seconds,
        userCommands: userCmds,
        completed: userCmds > 0 ? 1 : 0,
      });
    };
    window.addEventListener("pagehide", handleLeave);
    return () => {
      window.removeEventListener("pagehide", handleLeave);
    };
  }, [autoRun.length, history.length]);

  // Auto-scroll on new entries
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  // Focus input on any click in shell
  const handleShellClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "A" || target.closest("a")) return;
    if (target.tagName === "BUTTON" || target.closest("button")) return;
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus();
  }, []);

  // Mobile: swipe up anywhere to focus the input
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
    const delta = touchStartY.current - endY;
    touchStartY.current = null;
    // Upward swipe of at least 50px while not tapping a link/button
    if (delta < 50) return;
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("button")) return;
    inputRef.current?.focus();
    // Scroll input into view so the mobile keyboard doesn't obscure it
    inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        execute(input);
        setInput("");
        setCompletion("");
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length === 0) return;
        const next =
          historyIdx < 0 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(next);
        setInput(history[next]);
        setCompletion("");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIdx < 0) return;
        const next = historyIdx + 1;
        if (next >= history.length) {
          setHistoryIdx(-1);
          setInput("");
        } else {
          setHistoryIdx(next);
          setInput(history[next]);
        }
        setCompletion("");
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const parts = input.split(" ");
        if (parts.length === 1) {
          const matches = suggest(parts[0]);
          if (matches.length === 1) {
            setInput(matches[0] + " ");
            setCompletion("");
          } else if (matches.length > 1) {
            // Show all matches as a non-history output
            setEntries((prev) => [
              ...prev,
              {
                id: nextId.current++,
                outputs: [
                  {
                    kind: "text",
                    value: matches.join("   "),
                  },
                ],
              },
            ]);
          }
        }
        return;
      }
      if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setEntries([]);
        setAnnouncement("Screen cleared");
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setCompletion("");
        setHistoryIdx(-1);
        return;
      }
    },
    [execute, history, historyIdx, input],
  );

  // Live ghost completion
  useEffect(() => {
    if (!input) {
      setCompletion("");
      return;
    }
    const parts = input.split(" ");
    if (parts.length > 1) {
      setCompletion("");
      return;
    }
    const matches = suggest(parts[0]);
    if (matches.length > 0 && matches[0] !== parts[0]) {
      setCompletion(matches[0].slice(parts[0].length));
    } else {
      setCompletion("");
    }
  }, [input]);

  return (
    <div
      className="terminal-shell"
      role="application"
      aria-label="Operator's terminal — interactive portfolio shell"
      onClick={handleShellClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: "100dvh",
        padding: "clamp(16px, 4vw, 48px)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div
        ref={scrollRef}
        className="terminal-scroll"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          position: "relative",
          zIndex: 3,
        }}
      >
        {/* Status bar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "var(--term-fg-dim)",
            fontSize: "12px",
            marginBottom: "24px",
            paddingBottom: "12px",
            borderBottom: "1px solid var(--term-border)",
          }}
        >
          <span>
            <span style={{ color: "var(--term-prompt)" }}>{PROMPT_USER}</span>
            <span>@</span>
            <span style={{ color: "var(--term-fg)" }}>{PROMPT_HOST}</span>
            <span>:~</span>
          </span>
          <span style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span>
              <span className="term-status-dot" />
              available
            </span>
            <a href="/" className="term-link-btn" style={{ fontSize: "12px" }}>
              v1 →
            </a>
          </span>
        </header>

        {/* Entries */}
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Terminal output history"
        >
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="term-line-enter"
              style={{ marginBottom: "16px" }}
            >
              {entry.input !== undefined && (
                <div style={{ marginBottom: "4px" }}>
                  <span style={{ color: "var(--term-prompt)" }}>
                    {PROMPT_USER}
                  </span>
                  <span style={{ color: "var(--term-fg-dim)" }}>
                    @{PROMPT_HOST}
                  </span>
                  <span style={{ color: "var(--term-fg-dim)" }}>:~$</span>{" "}
                  <span>{entry.input}</span>
                </div>
              )}
              {entry.outputs.map((out, i) => (
                <OutputBlock key={i} output={out} />
              ))}
            </div>
          ))}
        </div>

        {/* Screen-reader-only announcement of the latest result.
            <output> has an implicit role="status". */}
        <output aria-live="polite" aria-atomic="true" className="term-sr-only">
          {announcement}
        </output>

        {/* Live input */}
        <div
          style={{ display: "flex", alignItems: "center", marginTop: "8px" }}
        >
          <span style={{ color: "var(--term-prompt)", marginRight: "0" }}>
            {PROMPT_USER}
          </span>
          <span style={{ color: "var(--term-fg-dim)" }}>@{PROMPT_HOST}</span>
          <span style={{ color: "var(--term-fg-dim)", marginRight: "8px" }}>
            :~$
          </span>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="term-input"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Terminal command input"
              aria-describedby="term-input-help"
              aria-autocomplete="inline"
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
                whiteSpace: "pre",
              }}
            >
              <span style={{ visibility: "hidden" }}>{input}</span>
              {completion && (
                <span style={{ color: "var(--term-fg-faint)" }}>
                  {completion}
                </span>
              )}
              <span className="term-cursor" />
            </div>
          </div>
        </div>

        {/* Mobile suggestion chips */}
        <nav
          aria-label="Suggested commands"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "32px",
            paddingTop: "20px",
            borderTop: "1px dashed var(--term-border)",
          }}
        >
          {[
            "help",
            "ls projects",
            "cat decisions",
            "stack",
            "contact",
            "book",
          ].map((c) => (
            <button
              key={c}
              type="button"
              className="term-chip"
              aria-label={`Run ${c}`}
              onClick={() => {
                execute(c);
                inputRef.current?.focus();
              }}
            >
              {c}
            </button>
          ))}
        </nav>

        {/* Footer hint */}
        <footer
          id="term-input-help"
          style={{
            marginTop: "48px",
            paddingTop: "16px",
            borderTop: "1px solid var(--term-border)",
            color: "var(--term-fg-faint)",
            fontSize: "11px",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span>
            ↑/↓ history · Tab complete · Ctrl+L clear · Esc dismiss completion
          </span>
          <span>
            built with intent ·{" "}
            <a href="/" className="term-link-btn">
              v1
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}

function OutputBlock({ output }: { readonly output: CommandOutput }) {
  if (output.kind === "clear") return null;
  if (output.kind === "error") {
    return (
      <pre
        style={{
          color: "var(--term-error)",
          margin: 0,
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
        }}
      >
        {output.value}
      </pre>
    );
  }
  if (output.kind === "ascii") {
    return (
      <pre
        style={{
          color: "var(--term-accent)",
          margin: "8px 0",
          whiteSpace: "pre",
          fontFamily: "inherit",
          fontSize: "10px",
          lineHeight: "1.1",
        }}
      >
        {output.value}
      </pre>
    );
  }
  if (output.kind === "html") {
    return (
      <div
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: command outputs are constructed server-side from controlled data with escape()
        dangerouslySetInnerHTML={{ __html: output.value }}
      />
    );
  }
  return (
    <pre
      style={{
        margin: 0,
        whiteSpace: "pre-wrap",
        fontFamily: "inherit",
        color: "var(--term-fg)",
      }}
    >
      {output.value}
    </pre>
  );
}
