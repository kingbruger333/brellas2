"use client";

import { useEffect, useState } from "react";
import type { LayoutProps } from "sanity";

type AdminTheme = "navy" | "dark" | "light" | "pink" | "beige";

const STORAGE_KEY = "brellas-admin-theme";
const DEFAULT_THEME: AdminTheme = "light";

const THEME_OPTIONS: { value: AdminTheme; label: string }[] = [
  { value: "navy", label: "Темно-синяя" },
  { value: "dark", label: "Темная" },
  { value: "light", label: "Светлая" },
  { value: "pink", label: "Нежно-розовая" },
  { value: "beige", label: "Нежно-бежевая" }
];

function getSavedTheme(): AdminTheme {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  const isKnownTheme = THEME_OPTIONS.some((theme) => theme.value === savedTheme);

  return isKnownTheme ? (savedTheme as AdminTheme) : DEFAULT_THEME;
}

export function BrellasStudioLayout(props: LayoutProps) {
  const [theme, setTheme] = useState<AdminTheme>(DEFAULT_THEME);

  useEffect(() => {
    setTheme(getSavedTheme());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.brellasAdminTheme = theme;
    document.documentElement.style.colorScheme = theme === "light" || theme === "pink" || theme === "beige" ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <>
      {props.renderDefault(props)}
      <div className="brellasThemePicker" aria-label="Выбор темы админки">
        <span>Brellas</span>
        <label>
          <span>Тема</span>
          <select value={theme} onChange={(event) => setTheme(event.target.value as AdminTheme)}>
            {THEME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <style>{`
        html[data-brellas-admin-theme="navy"] {
          --brellas-admin-bg: #071323;
          --brellas-admin-panel: #0c1f36;
          --brellas-admin-panel-soft: #102b49;
          --brellas-admin-text: #eef6ff;
          --brellas-admin-muted: #b6c8dd;
          --brellas-admin-border: #24415f;
          --brellas-admin-accent: #6bb8ff;
          --brellas-admin-accent-soft: #143a62;
        }

        html[data-brellas-admin-theme="dark"] {
          --brellas-admin-bg: #111214;
          --brellas-admin-panel: #1b1d21;
          --brellas-admin-panel-soft: #24272d;
          --brellas-admin-text: #f4f4f5;
          --brellas-admin-muted: #c6c7cb;
          --brellas-admin-border: #383c44;
          --brellas-admin-accent: #f0b35a;
          --brellas-admin-accent-soft: #3a2b18;
        }

        html[data-brellas-admin-theme="light"] {
          --brellas-admin-bg: #f7f8fb;
          --brellas-admin-panel: #ffffff;
          --brellas-admin-panel-soft: #eef2f7;
          --brellas-admin-text: #172033;
          --brellas-admin-muted: #667085;
          --brellas-admin-border: #d8dee8;
          --brellas-admin-accent: #2563eb;
          --brellas-admin-accent-soft: #dbeafe;
        }

        html[data-brellas-admin-theme="pink"] {
          --brellas-admin-bg: #fff5f8;
          --brellas-admin-panel: #ffffff;
          --brellas-admin-panel-soft: #fde8ef;
          --brellas-admin-text: #34212a;
          --brellas-admin-muted: #80606d;
          --brellas-admin-border: #f3c7d6;
          --brellas-admin-accent: #d94683;
          --brellas-admin-accent-soft: #fce7f0;
        }

        html[data-brellas-admin-theme="beige"] {
          --brellas-admin-bg: #fbf7ef;
          --brellas-admin-panel: #fffdf8;
          --brellas-admin-panel-soft: #f3eadb;
          --brellas-admin-text: #2d261e;
          --brellas-admin-muted: #756959;
          --brellas-admin-border: #e2d3bd;
          --brellas-admin-accent: #9a6a2f;
          --brellas-admin-accent-soft: #efe1cc;
        }

        html[data-brellas-admin-theme] body,
        html[data-brellas-admin-theme] [data-ui="BoundaryElement"] {
          background: var(--brellas-admin-bg) !important;
          color: var(--brellas-admin-text) !important;
        }

        html[data-brellas-admin-theme] [data-ui="Card"] {
          --card-bg-color: var(--brellas-admin-panel) !important;
          --card-fg-color: var(--brellas-admin-text) !important;
          --card-muted-fg-color: var(--brellas-admin-muted) !important;
          --card-border-color: var(--brellas-admin-border) !important;
          --card-accent-fg-color: var(--brellas-admin-accent) !important;
          --card-accent-bg-color: var(--brellas-admin-accent-soft) !important;
          background-color: var(--brellas-admin-panel) !important;
          color: var(--brellas-admin-text) !important;
        }

        html[data-brellas-admin-theme] [data-ui="Card"][data-tone="transparent"] {
          background-color: transparent !important;
        }

        html[data-brellas-admin-theme] input,
        html[data-brellas-admin-theme] textarea,
        html[data-brellas-admin-theme] select {
          background-color: var(--brellas-admin-panel-soft) !important;
          border-color: var(--brellas-admin-border) !important;
          color: var(--brellas-admin-text) !important;
        }

        html[data-brellas-admin-theme] a {
          color: var(--brellas-admin-accent);
        }

        .brellasThemePicker {
          align-items: center;
          background: var(--brellas-admin-panel, #ffffff);
          border: 1px solid var(--brellas-admin-border, #d8dee8);
          border-radius: 8px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.16);
          color: var(--brellas-admin-text, #172033);
          display: flex;
          gap: 12px;
          padding: 8px 10px;
          position: fixed;
          right: 12px;
          top: 10px;
          z-index: 10000;
        }

        .brellasThemePicker > span {
          color: var(--brellas-admin-accent, #2563eb);
          font-size: 13px;
          font-weight: 700;
          line-height: 1;
        }

        .brellasThemePicker label {
          align-items: center;
          display: flex;
          gap: 8px;
        }

        .brellasThemePicker label span {
          color: var(--brellas-admin-muted, #667085);
          font-size: 12px;
          line-height: 1;
        }

        .brellasThemePicker select {
          border: 1px solid var(--brellas-admin-border, #d8dee8);
          border-radius: 6px;
          font: inherit;
          font-size: 13px;
          height: 30px;
          min-width: 150px;
          padding: 0 8px;
        }

        @media (max-width: 720px) {
          .brellasThemePicker {
            left: 8px;
            right: 8px;
            top: auto;
            bottom: 8px;
          }

          .brellasThemePicker label {
            flex: 1;
          }

          .brellasThemePicker select {
            min-width: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
