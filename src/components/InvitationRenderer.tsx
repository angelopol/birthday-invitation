"use client";

import React from "react";

export type InvitationBlock =
  | {
      type: "heading";
      level: 1 | 3;
      text: string;
      fontFamily?: string;
      fontSize?: number;
      color?: string;
      horizontalAlign?: "left" | "center" | "right";
      verticalAlign?: "top" | "center" | "bottom";
      borderColor?: string | null;
      backgroundColor?: string | null;
      panelEnabled?: boolean;
      panelShape?: "square" | "circle";
      panelColor?: string | null;
      panelOpacity?: number | null; // 0-100
      panelPadding?: number | null; // px
      panelBorderRadiusPercent?: number | null; // 0-100
    }
  | {
      type: "paragraph";
      text: string;
      fontFamily?: string;
      fontSize?: number;
      color?: string;
      horizontalAlign?: "left" | "center" | "right";
      verticalAlign?: "top" | "center" | "bottom";
      borderColor?: string | null;
      backgroundColor?: string | null;
      panelEnabled?: boolean;
      panelShape?: "square" | "circle";
      panelColor?: string | null;
      panelOpacity?: number | null; // 0-100
      panelPadding?: number | null; // px
      panelBorderRadiusPercent?: number | null; // 0-100
    }
  | {
      type: "link-button";
      label: string;
      href: string;
      fontFamily?: string;
      fontSize?: number;
      color?: string;
      horizontalAlign?: "left" | "center" | "right";
      verticalAlign?: "top" | "center" | "bottom";
      borderColor?: string | null;
      backgroundColor?: string | null;
      panelEnabled?: boolean;
      panelShape?: "square" | "circle";
      panelColor?: string | null;
      panelOpacity?: number | null;
      panelPadding?: number | null;
      panelBorderRadiusPercent?: number | null;
    }
  | {
      type: "special-button";
      label: string;
      action: "gallery" | "playlist" | "rsvp";
      fontFamily?: string;
      fontSize?: number;
      color?: string;
      horizontalAlign?: "left" | "center" | "right";
      verticalAlign?: "top" | "center" | "bottom";
      panelEnabled?: boolean;
      panelShape?: "square" | "circle";
      panelColor?: string | null;
      panelOpacity?: number | null;
      panelPadding?: number | null;
      panelBorderRadiusPercent?: number | null;
    };

export interface InvitationScreenData {
  id: number;
  order: number;
  backgroundType: "image" | "color" | "gradient";
  backgroundImageUrl?: string | null;
  backgroundColor?: string | null;
  layoutType?: "single" | "split";
  content?: InvitationBlock[] | null;
  fragments?: InvitationFragment[] | null;
}

export interface InvitationFragment {
  id?: string | number;
  position?: "left" | "right" | "top" | "bottom";
  content?: InvitationBlock[] | null;
  title?: string | null;
  description?: string | null;
  backgroundMode?: "inherit" | "color" | "image";
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
  horizontalAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "center" | "bottom";
}

interface InvitationRendererProps {
  screens: InvitationScreenData[];
  onOpenGallery: () => void;
  onOpenPlaylist: () => void;
  onOpenRsvp: () => void;
  guestName?: string | null;
}

export default function InvitationRenderer({
  screens,
  onOpenGallery,
  onOpenPlaylist,
  onOpenRsvp,
  guestName,
}: InvitationRendererProps) {
  if (!screens.length) return null;

  const guestPlaceholderRegex = /@invitado/gi;
  const resolvedGuestName = (guestName?.trim() && guestName.trim().length > 0)
    ? guestName.trim()
    : "invitad@";

  const replaceGuestPlaceholder = (value?: string | null) => {
    if (!value) return value;
    return value.replace(guestPlaceholderRegex, (match) => {
      const isUpperCase = match === match.toUpperCase();
      const isLowerCase = match === match.toLowerCase();

      if (isUpperCase && !isLowerCase) {
        return resolvedGuestName.toUpperCase();
      }

      if (isLowerCase && !isUpperCase) {
        return resolvedGuestName.toLowerCase();
      }

      return resolvedGuestName;
    });
  };

  const getFontStyle = (block: InvitationBlock): React.CSSProperties => ({
    fontFamily: block.fontFamily,
    fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
    color: block.color ?? undefined,
  });

  const getBlockAlignmentStyle = (block: InvitationBlock): React.CSSProperties => {
    const horizontal = block.horizontalAlign ?? "left";
    const vertical = block.verticalAlign ?? "top";

    const horizontalAlignmentMap: Record<typeof horizontal, React.CSSProperties["alignItems"]> = {
      left: "flex-start",
      center: "center",
      right: "flex-end",
    };

    const textAlignMap: Record<typeof horizontal, React.CSSProperties["textAlign"]> = {
      left: "left",
      center: "center",
      right: "right",
    };

    const verticalMarginMap: Record<typeof vertical, Pick<React.CSSProperties, "marginTop" | "marginBottom">> = {
      top: { marginTop: undefined, marginBottom: undefined },
      center: { marginTop: "auto", marginBottom: "auto" },
      bottom: { marginTop: "auto", marginBottom: undefined },
    };

    return {
      display: "flex",
      flexDirection: "column",
      alignItems: horizontalAlignmentMap[horizontal],
      textAlign: textAlignMap[horizontal],
      width: "100%",
      gap: "0.35rem",
      ...verticalMarginMap[vertical],
    };
  };

  const renderBlocks = (blocks?: InvitationBlock[] | null) => {
    if (!blocks || blocks.length === 0) return null;

    return blocks.map((block, index) => {
      const wrapperKey = `${block.type}-${index}`;

      if (block.type === "heading") {
        const resolvedText = replaceGuestPlaceholder(block.text) ?? "";
        const HeadingTag = block.level === 1 ? "h1" : "h3";

        const defaultPadding = block.panelPadding ?? (block.level === 1 ? 12 : 8);
        const defaultOpacity = typeof block.panelOpacity === "number" ? block.panelOpacity / 100 : 0.9;
        const borderRadiusPercent = typeof block.panelBorderRadiusPercent === "number" ? block.panelBorderRadiusPercent : 6;

        const panelBg = block.panelColor ?? "var(--theme-surface-elevated, rgba(0,0,0,0.6))";

        const computedBorderRadius = block.panelShape === "circle"
          ? "9999px"
          : `calc(var(--invitation-screen-border-radius, 32px) * ${borderRadiusPercent} / 100)`;

        // Build a background value that respects the configured opacity without fading the text.
        let backgroundValue: string = panelBg;
        if (typeof panelBg === "string") {
          const asLower = panelBg.trim().toLowerCase();
          if (asLower.startsWith("#")) {
            // convert hex to rgba
            const hex = asLower.slice(1);
            const toNum = (h: string) => parseInt(h, 16);
            if (hex.length === 3) {
              const r = toNum(hex[0] + hex[0]);
              const g = toNum(hex[1] + hex[1]);
              const b = toNum(hex[2] + hex[2]);
              backgroundValue = `rgba(${r}, ${g}, ${b}, ${defaultOpacity})`;
            } else if (hex.length === 6) {
              const r = toNum(hex.slice(0, 2));
              const g = toNum(hex.slice(2, 4));
              const b = toNum(hex.slice(4, 6));
              backgroundValue = `rgba(${r}, ${g}, ${b}, ${defaultOpacity})`;
            }
          } else if (asLower.startsWith("rgba(")) {
            // replace alpha
            backgroundValue = panelBg.replace(/rgba\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/i, (m, r, g, b) => `rgba(${r.trim()},${g.trim()},${b.trim()},${defaultOpacity})`);
          } else if (asLower.startsWith("rgb(")) {
            backgroundValue = panelBg.replace(/rgb\(([^\)]+)\)/i, (m, inner) => {
              return `rgba(${inner.trim()},${defaultOpacity})`;
            });
          } else {
            // fallback: try color-mix with theme variables or named colors (may not be supported everywhere)
            backgroundValue = `color-mix(in srgb, ${panelBg} ${Math.round(defaultOpacity * 100)}%, transparent)`;
          }
        }

        const panelStyle: React.CSSProperties | undefined = block.panelEnabled
          ? {
              background: backgroundValue,
              padding: `${defaultPadding}px ${Math.max(8, Math.round(defaultPadding * 1.6))}px`,
              borderRadius: computedBorderRadius,
              display: "inline-block",
            }
          : undefined;

        const innerStyle = {
          ...getFontStyle(block),
          ...(panelStyle ? panelStyle : {}),
        } as React.CSSProperties;

        return (
          <div key={wrapperKey} className="invitation-block-wrapper" style={getBlockAlignmentStyle(block)}>
            <HeadingTag
              className={
                block.level === 1
                  ? "text-3xl sm:text-5xl font-semibold tracking-tight"
                  : "text-xl sm:text-2xl font-semibold"
              }
            >
              <span style={innerStyle}>{resolvedText}</span>
            </HeadingTag>
          </div>
        );
      }

      if (block.type === "paragraph") {
        const resolvedText = replaceGuestPlaceholder(block.text) ?? "";

        // Mirror heading panel behavior so paragraph panels look identical
        const defaultPadding = block.panelPadding ?? 8;
        const defaultOpacity = typeof block.panelOpacity === "number" ? block.panelOpacity / 100 : 0.9;
        const borderRadiusPercent = typeof block.panelBorderRadiusPercent === "number" ? block.panelBorderRadiusPercent : 6;

        const panelBg = block.panelColor ?? "var(--theme-surface-elevated, rgba(0,0,0,0.6))";

        const computedBorderRadius = block.panelShape === "circle"
          ? "9999px"
          : `calc(var(--invitation-screen-border-radius, 32px) * ${borderRadiusPercent} / 100)`;

        // Build a background value that respects the configured opacity without affecting the text
        let backgroundValue: string = panelBg;
        if (typeof panelBg === "string") {
          const asLower = panelBg.trim().toLowerCase();
          if (asLower.startsWith("#")) {
            const hex = asLower.slice(1);
            const toNum = (h: string) => parseInt(h, 16);
            if (hex.length === 3) {
              const r = toNum(hex[0] + hex[0]);
              const g = toNum(hex[1] + hex[1]);
              const b = toNum(hex[2] + hex[2]);
              backgroundValue = `rgba(${r}, ${g}, ${b}, ${defaultOpacity})`;
            } else if (hex.length === 6) {
              const r = toNum(hex.slice(0, 2));
              const g = toNum(hex.slice(2, 4));
              const b = toNum(hex.slice(4, 6));
              backgroundValue = `rgba(${r}, ${g}, ${b}, ${defaultOpacity})`;
            }
          } else if (asLower.startsWith("rgba(")) {
            backgroundValue = panelBg.replace(/rgba\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/i, (m, r, g, b) => `rgba(${r.trim()},${g.trim()},${b.trim()},${defaultOpacity})`);
          } else if (asLower.startsWith("rgb(")) {
            backgroundValue = panelBg.replace(/rgb\(([^\)]+)\)/i, (m, inner) => `rgba(${inner.trim()},${defaultOpacity})`);
          } else {
            backgroundValue = `color-mix(in srgb, ${panelBg} ${Math.round(defaultOpacity * 100)}%, transparent)`;
          }
        }

        const panelStyle: React.CSSProperties | undefined = block.panelEnabled
          ? {
              background: backgroundValue,
              padding: `${defaultPadding}px ${Math.max(8, Math.round(defaultPadding * 1.6))}px`,
              borderRadius: computedBorderRadius,
              display: "inline-block",
            }
          : undefined;

        const innerStyle = {
          ...getFontStyle(block),
          ...(panelStyle ? panelStyle : {}),
        } as React.CSSProperties;

        return (
          <div key={wrapperKey} className="invitation-block-wrapper" style={getBlockAlignmentStyle(block)}>
            <p className="text-base sm:text-lg leading-relaxed whitespace-pre-line">
              <span style={innerStyle}>{resolvedText}</span>
            </p>
          </div>
        );
      }

      if (block.type === "link-button") {
        const resolvedLabel = replaceGuestPlaceholder(block.label) ?? block.label;
        return (
          <div key={wrapperKey} className="invitation-block-wrapper" style={getBlockAlignmentStyle(block)}>
            <a
              href={block.href}
              target="_blank"
              rel="noreferrer"
              className="invitation-block-button invitation-block-button--primary"
              style={{
                ...getFontStyle(block),
                background: block.backgroundColor ?? undefined,
                borderColor: block.borderColor ?? undefined,
                borderStyle: block.borderColor ? 'solid' : undefined,
              }}
            >
              {resolvedLabel}
            </a>
          </div>
        );
      }

      if (block.type === "special-button") {
        const resolvedLabel = replaceGuestPlaceholder(block.label) ?? block.label;
        const handler =
          block.action === "gallery"
            ? onOpenGallery
            : block.action === "playlist"
            ? onOpenPlaylist
            : onOpenRsvp;

        return (
          <div key={wrapperKey} className="invitation-block-wrapper" style={getBlockAlignmentStyle(block)}>
            <button
              type="button"
              onClick={handler}
              className="invitation-block-button invitation-block-button--secondary"
              style={{
                ...getFontStyle(block),
                background: block.backgroundColor ?? undefined,
                borderColor: block.borderColor ?? undefined,
                borderStyle: block.borderColor ? 'solid' : undefined,
              }}
            >
              {resolvedLabel}
            </button>
          </div>
        );
      }

      return null;
    });
  };

  const renderScreenBackground = (screen: InvitationScreenData): React.CSSProperties => {
    if (screen.backgroundType === "image" && screen.backgroundImageUrl) {
      return {
        backgroundImage: `url(${screen.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    if (screen.backgroundType === "color" && screen.backgroundColor) {
      return {
        background: screen.backgroundColor,
      };
    }

    if (screen.backgroundType === "gradient") {
      return {
        background: "linear-gradient(135deg, var(--theme-tertiary, #020617), var(--theme-primary, #38bdf8))",
      };
    }

    // fallback
    return {
      background: "linear-gradient(135deg, var(--theme-tertiary, #020617), var(--theme-primary, #38bdf8))",
    };
  };

  const getFragmentBackgroundStyle = (fragment: InvitationFragment): React.CSSProperties => {
    const resolvedMode = fragment.backgroundMode
      ?? (fragment.backgroundImageUrl ? "image" : fragment.backgroundColor ? "color" : "inherit");

    if (resolvedMode === "image" && fragment.backgroundImageUrl) {
      return {
        backgroundImage: `url(${fragment.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    if (resolvedMode === "color" && fragment.backgroundColor) {
      return {
        background: fragment.backgroundColor,
      };
    }

    return {};
  };

  const getFragmentAlignmentStyle = (fragment: InvitationFragment): React.CSSProperties => {
    const horizontal = fragment.horizontalAlign ?? "left";
    const vertical = fragment.verticalAlign ?? "top";
    const horizontalMap: Record<NonNullable<typeof fragment.horizontalAlign>, React.CSSProperties["alignItems"]> = {
      left: "flex-start",
      center: "center",
      right: "flex-end",
    };
    const verticalMap: Record<NonNullable<typeof fragment.verticalAlign>, React.CSSProperties["justifyContent"]> = {
      top: "flex-start",
      center: "center",
      bottom: "flex-end",
    };
    const textAlignMap: Record<NonNullable<typeof fragment.horizontalAlign>, React.CSSProperties["textAlign"]> = {
      left: "left",
      center: "center",
      right: "right",
    };

    return {
      alignItems: horizontalMap[horizontal],
      justifyContent: verticalMap[vertical],
      textAlign: textAlignMap[horizontal],
    };
  };

  const SORTED_POSITIONS: Array<InvitationFragment["position"]> = ["left", "right", "top", "bottom"];

  const orderFragments = (fragments: InvitationFragment[]) => {
    return [...fragments].sort((a, b) => {
      const orderA = SORTED_POSITIONS.indexOf(a.position ?? "left");
      const orderB = SORTED_POSITIONS.indexOf(b.position ?? "left");
      return orderA - orderB;
    });
  };

  return (
    <section className="invitation-screens">
      {screens
        .sort((a, b) => a.order - b.order)
        .map((screen) => {
          const isSplit = screen.layoutType === "split" && screen.fragments?.length;
          return (
            <article
              key={screen.id}
              className={`invitation-screen ${isSplit ? "invitation-screen--split" : ""}`}
              style={renderScreenBackground(screen)}
            >
              {screen.backgroundType === "gradient" && (
                <div className="invitation-screen__overlay" />
              )}
              <div
                className={`invitation-screen__content ${
                  isSplit ? "invitation-screen__content--split" : "invitation-screen__content--single"
                }`}
              >
                {isSplit
                  ? orderFragments(screen.fragments ?? []).map((fragment, idx) => (
                      <div
                        key={fragment.id ?? `${fragment.position ?? "fragment"}-${idx}`}
                        className="invitation-screen__fragment"
                        data-position={fragment.position ?? "left"}
                        style={getFragmentBackgroundStyle(fragment)}
                      >
                        <div
                          className="invitation-screen__fragment-inner"
                          style={getFragmentAlignmentStyle(fragment)}
                        >
                          {(fragment.title || fragment.description) && (
                            <div className="mb-3 space-y-1">
                              {fragment.title && (
                                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                                  {fragment.title}
                                </p>
                              )}
                              {fragment.description && (
                                <p className="text-[11px] text-slate-300/80 leading-relaxed whitespace-pre-line">
                                  {fragment.description}
                                </p>
                              )}
                            </div>
                          )}
                          {renderBlocks(fragment.content ?? [])}
                        </div>
                      </div>
                    ))
                  : renderBlocks(screen.content ?? [])}
              </div>
            </article>
          );
        })}
    </section>
  );
}
