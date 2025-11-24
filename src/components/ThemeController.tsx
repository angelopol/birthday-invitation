"use client";

import { useEffect, useMemo, useState } from "react";

export type ThemeConfig = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  tertiaryColor?: string | null;
  typographyFamily?: string | null;
  typographySize?: number | null;
};

const DEFAULT_THEME: Required<Omit<ThemeConfig, "typographySize">> & { typographySize: number } = {
  primaryColor: "#38bdf8",
  secondaryColor: "#818cf8",
  tertiaryColor: "#020617",
  typographyFamily: "var(--font-geist-sans)",
  typographySize: 14,
};

type ControllerSnapshot = {
  priority: number;
  theme: ThemeConfig | null;
};

const controllerRegistry = new Map<number, ControllerSnapshot>();
let controllerIdCounter = 0;

function normalizeHex(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("#")) return null;
  const hex = trimmed.replace("#", "");
  if (hex.length === 3) {
    return hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (hex.length === 6) return hex;
  return null;
}

function hexToRgb(value?: string | null) {
  const normalized = normalizeHex(value);
  if (!normalized) return null;
  const num = Number.parseInt(normalized, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

function shadeColor(base: string, percent: number) {
  const rgb = hexToRgb(base);
  if (!rgb) return base;
  const p = Math.min(100, Math.max(-100, percent)) / 100;
  const t = p < 0 ? 0 : 255;
  const newR = Math.round(rgb.r + (t - rgb.r) * Math.abs(p));
  const newG = Math.round(rgb.g + (t - rgb.g) * Math.abs(p));
  const newB = Math.round(rgb.b + (t - rgb.b) * Math.abs(p));
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

function getContrastColor(base: string, light = "#f8fafc", dark = "#0f172a") {
  const rgb = hexToRgb(base);
  if (!rgb) return light;
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 170 ? dark : light;
}

function applyThemeVariables(theme?: ThemeConfig | null) {
  if (typeof document === "undefined") {
    return;
  }

  // If no theme is provided, do not overwrite the CSS root variables so
  // the app's global defaults (defined in `globals.css`) are preserved.
  if (!theme) return;

  const resolved = {
    primaryColor: theme.primaryColor ?? DEFAULT_THEME.primaryColor,
    secondaryColor: theme.secondaryColor ?? DEFAULT_THEME.secondaryColor,
    tertiaryColor: theme.tertiaryColor ?? DEFAULT_THEME.tertiaryColor,
    typographyFamily: theme.typographyFamily ?? DEFAULT_THEME.typographyFamily,
    typographySize:
      theme.typographySize && !Number.isNaN(theme.typographySize)
        ? theme.typographySize
        : DEFAULT_THEME.typographySize,
  };

  const textColor = getContrastColor(resolved.tertiaryColor);
  const mutedColor = shadeColor(textColor, textColor === "#0f172a" ? 35 : -30);
  const borderColor = shadeColor(resolved.tertiaryColor, textColor === "#0f172a" ? 35 : -35);
  const elevatedSurface = shadeColor(resolved.tertiaryColor, textColor === "#0f172a" ? 12 : -12);
  const buttonText = getContrastColor(resolved.primaryColor);
  const secondaryButtonText = getContrastColor(resolved.secondaryColor);

  const root = document.documentElement;
  root.style.setProperty("--theme-primary", resolved.primaryColor);
  root.style.setProperty("--theme-secondary", resolved.secondaryColor);
  root.style.setProperty("--theme-tertiary", resolved.tertiaryColor);
  root.style.setProperty("--theme-text", textColor);
  root.style.setProperty("--theme-text-muted", mutedColor);
  root.style.setProperty("--theme-border", borderColor);
  root.style.setProperty("--theme-surface", resolved.tertiaryColor);
  root.style.setProperty("--theme-surface-elevated", elevatedSurface);
  root.style.setProperty("--theme-button-text", buttonText);
  root.style.setProperty("--theme-button-text-secondary", secondaryButtonText);
  root.style.setProperty("--theme-font-family", resolved.typographyFamily);
  root.style.setProperty("--theme-font-size", `${resolved.typographySize}px`);
}

function commitRegistryTheme() {
  let selected: ControllerSnapshot | null = null;
  controllerRegistry.forEach((snapshot) => {
    if (!selected || snapshot.priority >= selected.priority) {
      selected = snapshot;
    }
  });
  applyThemeVariables(selected?.theme ?? null);
}

type ThemeControllerProps = {
  initialTheme?: ThemeConfig | null;
  priority?: number;
  autoFetch?: boolean;
};

export default function ThemeController({ initialTheme, priority = 0, autoFetch = false }: ThemeControllerProps) {
  const [theme, setTheme] = useState<ThemeConfig | null>(initialTheme ?? null);
  const controllerId = useMemo(() => {
    controllerIdCounter += 1;
    return controllerIdCounter;
  }, []);

  useEffect(() => {
    controllerRegistry.set(controllerId, { priority, theme });
    commitRegistryTheme();
    return () => {
      controllerRegistry.delete(controllerId);
      commitRegistryTheme();
    };
  }, [controllerId, priority, theme]);

  useEffect(() => {
    if (initialTheme || !autoFetch) {
      return;
    }

    let active = true;

    (async () => {
      try {
        const response = await fetch("/api/theme", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Theme fetch failed");
        }
        const payload = (await response.json()) as { theme?: ThemeConfig | null };
        if (!active) return;
        setTheme(payload.theme ?? null);
      } catch {
        if (!active) return;
        setTheme(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [initialTheme, autoFetch]);

  return null;
}
