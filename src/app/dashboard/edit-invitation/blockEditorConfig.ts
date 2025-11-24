import type { InvitationBlock } from "@/components/InvitationRenderer";

export const FONT_OPTIONS = [
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Sistema", value: "inherit" },
];

export type BlockType = "heading" | "paragraph" | "link-button" | "special-button";

export const ADD_OPTIONS: Array<{
  label: string;
  type: BlockType;
  preset?: Partial<InvitationBlock>;
}> = [
  { label: "Título", type: "heading", preset: { level: 1, text: "Nuevo título" } },
  { label: "Subtítulo", type: "heading", preset: { level: 3, text: "Nuevo subtítulo" } },
  { label: "Párrafo", type: "paragraph", preset: { text: "Escribe tu mensaje aquí" } },
  { label: "Botón enlace", type: "link-button", preset: { label: "Abrir enlace", href: "https://" } },
  { label: "Botón especial", type: "special-button", preset: { label: "Ver galería", action: "gallery" } },
];

const DEFAULT_FONT = FONT_OPTIONS[0].value;
const DEFAULT_HORIZONTAL_ALIGN: InvitationBlock["horizontalAlign"] = "left";
const DEFAULT_VERTICAL_ALIGN: InvitationBlock["verticalAlign"] = "top";

export function createBlock(type: BlockType): InvitationBlock {
  switch (type) {
    case "heading":
      return {
        type: "heading",
        level: 1,
        text: "Nuevo título",
        fontFamily: DEFAULT_FONT,
        fontSize: 36,
        color: undefined,
        panelEnabled: false,
        panelShape: "square",
        panelColor: undefined,
        panelOpacity: 90,
        panelPadding: 12,
        panelBorderRadiusPercent: 6,
        horizontalAlign: DEFAULT_HORIZONTAL_ALIGN,
        verticalAlign: DEFAULT_VERTICAL_ALIGN,
      };
    case "paragraph":
      return {
        type: "paragraph",
        text: "Escribe tu mensaje aquí",
        fontFamily: DEFAULT_FONT,
        fontSize: 16,
        color: undefined,
        panelEnabled: false,
        panelShape: "square",
        panelColor: undefined,
        panelOpacity: 90,
        panelPadding: 10,
        panelBorderRadiusPercent: 6,
        horizontalAlign: DEFAULT_HORIZONTAL_ALIGN,
        verticalAlign: DEFAULT_VERTICAL_ALIGN,
      };
    case "link-button":
      return {
        type: "link-button",
        label: "Abrir enlace",
        href: "https://",
        fontFamily: DEFAULT_FONT,
        fontSize: 16,
        color: undefined,
        borderColor: undefined,
        backgroundColor: undefined,
        horizontalAlign: DEFAULT_HORIZONTAL_ALIGN,
        verticalAlign: DEFAULT_VERTICAL_ALIGN,
      };
    case "special-button":
    default:
      return {
        type: "special-button",
        label: "Ver galería",
        action: "gallery",
        fontFamily: DEFAULT_FONT,
        fontSize: 16,
        color: undefined,
        borderColor: undefined,
        backgroundColor: undefined,
        horizontalAlign: DEFAULT_HORIZONTAL_ALIGN,
        verticalAlign: DEFAULT_VERTICAL_ALIGN,
      };
  }
}
