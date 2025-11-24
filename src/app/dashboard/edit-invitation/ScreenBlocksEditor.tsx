"use client";

// Utility to filter preset fields to only those valid for the block type
function filterBlockPreset(type: string, preset: any): any {
  if (!preset) return {};
  if (type === 'heading') {
    const { level, text, fontFamily, fontSize, color, panelEnabled, panelShape, panelColor, panelOpacity, panelPadding, panelBorderRadiusPercent, horizontalAlign, verticalAlign } = preset;
    return { level, text, fontFamily, fontSize, color, panelEnabled, panelShape, panelColor, panelOpacity, panelPadding, panelBorderRadiusPercent, horizontalAlign, verticalAlign };
  }
  if (type === 'paragraph') {
    const { text, fontFamily, fontSize, color, panelEnabled, panelShape, panelColor, panelOpacity, panelPadding, panelBorderRadiusPercent, horizontalAlign, verticalAlign } = preset;
    return { text, fontFamily, fontSize, color, panelEnabled, panelShape, panelColor, panelOpacity, panelPadding, panelBorderRadiusPercent, horizontalAlign, verticalAlign };
  }
  if (type === 'link-button') {
    const { label, href, fontFamily, fontSize, color, borderColor, backgroundColor, horizontalAlign, verticalAlign } = preset;
    return { label, href, fontFamily, fontSize, color, borderColor, backgroundColor, horizontalAlign, verticalAlign };
  }
  if (type === 'special-button') {
    const { label, action, fontFamily, fontSize, color, borderColor, backgroundColor, horizontalAlign, verticalAlign } = preset;
    return { label, action, fontFamily, fontSize, color, borderColor, backgroundColor, horizontalAlign, verticalAlign };
  }
  return {};
}

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { InvitationBlock } from "@/components/InvitationRenderer";
import { ADD_OPTIONS, BlockType, FONT_OPTIONS, createBlock } from "./blockEditorConfig";

const DEFAULT_HORIZONTAL_ALIGN: InvitationBlock["horizontalAlign"] = "left";
const DEFAULT_VERTICAL_ALIGN: InvitationBlock["verticalAlign"] = "top";
const DEFAULT_TEXT_COLOR = "#ffffff";

const HORIZONTAL_ALIGN_OPTIONS: Array<{ label: string; value: InvitationBlock["horizontalAlign"] }> = [
  { label: "Izquierda", value: "left" },
  { label: "Centro", value: "center" },
  { label: "Derecha", value: "right" },
];

const VERTICAL_ALIGN_OPTIONS: Array<{ label: string; value: InvitationBlock["verticalAlign"] }> = [
  { label: "Arriba", value: "top" },
  { label: "Centro", value: "center" },
  { label: "Abajo", value: "bottom" },
];

type EditableBlock = InvitationBlock & { id: string };

type Props = {
  screenId: number;
  initialBlocks: InvitationBlock[];
};

function withEditorDefaults(block: InvitationBlock): InvitationBlock {
  if (block.type === 'heading' || block.type === 'paragraph') {
    return {
      ...block,
      horizontalAlign: block.horizontalAlign ?? DEFAULT_HORIZONTAL_ALIGN,
      verticalAlign: block.verticalAlign ?? DEFAULT_VERTICAL_ALIGN,
      panelEnabled: block.panelEnabled ?? false,
      panelShape: block.panelShape ?? "square",
      panelColor: block.panelColor ?? undefined,
      panelOpacity: block.panelOpacity ?? 90,
      panelPadding: block.panelPadding ?? 20,
      panelBorderRadiusPercent: block.panelBorderRadiusPercent ?? 50,
    };
  }
  return {
    ...block,
    horizontalAlign: block.horizontalAlign ?? DEFAULT_HORIZONTAL_ALIGN,
    verticalAlign: block.verticalAlign ?? DEFAULT_VERTICAL_ALIGN,
  };
}

function withId(block: InvitationBlock): EditableBlock {
  return {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    ...block,
  } as EditableBlock;
}

export default function ScreenBlocksEditor({ screenId, initialBlocks }: Props) {
  const router = useRouter();
  const hydratedInitialBlocks = useMemo<EditableBlock[]>(
    () => (initialBlocks ?? []).map((block) => withId(withEditorDefaults(block))),
    [initialBlocks]
  );

  const [blocks, setBlocks] = useState<EditableBlock[]>(hydratedInitialBlocks);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const updateBlock = (id: string, patch: Partial<EditableBlock>) => {
    setBlocks((prev: EditableBlock[]) => prev.map((block: EditableBlock) => {
      if (block.id !== id) return block;
      // Type-safe patching by block type
      switch (block.type) {
        case 'heading':
          return { ...block, ...(patch as Partial<Extract<EditableBlock, { type: 'heading' }>>) };
        case 'paragraph':
          return { ...block, ...(patch as Partial<Extract<EditableBlock, { type: 'paragraph' }>>) };
        case 'link-button':
          return { ...block, ...(patch as Partial<Extract<EditableBlock, { type: 'link-button' }>>) };
        case 'special-button':
          return { ...block, ...(patch as Partial<Extract<EditableBlock, { type: 'special-button' }>>) };
        default:
          return block;
      }
    }));
  };

  const renderColorPicker = (block: EditableBlock) => (
    <div className="space-y-1 text-xs text-slate-300">
      Color del texto
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={block.color ?? DEFAULT_TEXT_COLOR}
          onChange={(e) => updateBlock(block.id, { color: e.target.value })}
          className="h-8 w-16 rounded border border-slate-700 bg-transparent"
        />
        <button
          type="button"
          onClick={() => updateBlock(block.id, { color: undefined })}
          className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500 disabled:opacity-40"
          disabled={!block.color}
        >
          Automático
        </button>
        <span className="text-[10px] text-slate-500">Deja Automático para usar los colores globales.</span>
      </div>
    </div>
  );

  const renderButtonStyleControls = (block: EditableBlock) => (
    <div className="space-y-1 text-xs text-slate-300">
      <p className="text-[12px]">Estilos del botón</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="space-y-1">
          <div className="text-[11px]">Color de borde</div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="color"
              value={(block as any).borderColor ?? '#000000'}
              onChange={(e) => updateBlock(block.id, { borderColor: e.target.value })}
              className="h-8 w-16 rounded border border-slate-700 bg-transparent"
            />
            <button
              type="button"
              onClick={() => updateBlock(block.id, { borderColor: undefined })}
              className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500 disabled:opacity-40"
              disabled={!(block as any).borderColor}
            >
              Automático
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px]">Relleno</div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="color"
              value={(block as any).backgroundColor && (block as any).backgroundColor !== 'transparent' ? (block as any).backgroundColor : '#000000'}
              onChange={(e) => updateBlock(block.id, { backgroundColor: e.target.value })}
              className="h-8 w-16 rounded border border-slate-700 bg-transparent"
              disabled={(block as any).backgroundColor === 'transparent'}
            />
            <button
              type="button"
              onClick={() => updateBlock(block.id, { backgroundColor: 'transparent' })}
              className={`rounded border px-2 py-1 text-[11px] ${ (block as any).backgroundColor === 'transparent' ? 'border-sky-500 text-sky-400' : 'border-slate-700 text-slate-200 hover:border-slate-500'}`}
            >
              Transparente
            </button>
            <button
              type="button"
              onClick={() => updateBlock(block.id, { backgroundColor: undefined })}
              className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500"
              disabled={!((block as any).backgroundColor && (block as any).backgroundColor !== 'transparent')}
            >
              Automático
            </button>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-slate-500">Deja Automático para usar estilos por defecto.</p>
    </div>
  );

  const removeBlock = (id: string) => {
    setBlocks((prev: EditableBlock[]) => prev.filter((block: EditableBlock) => block.id !== id));
  };

  const moveBlock = (id: string, direction: -1 | 1) => {
    setBlocks((prev: EditableBlock[]) => {
      const index = prev.findIndex((block: EditableBlock) => block.id === id);
      if (index === -1) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const newBlocks = [...prev];
      const [item] = newBlocks.splice(index, 1);
      newBlocks.splice(newIndex, 0, item);
      return newBlocks;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const payload: InvitationBlock[] = blocks.map((block: EditableBlock) => {
        const { id, ...rest } = block;
        return rest;
      });

      const res = await fetch(`/api/invitation/screens/${screenId}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: payload }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(error.error || "No se pudo guardar");
      }

      setStatus("Cambios guardados ✔");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ADD_OPTIONS.map((option) => (
          <button
            key={`${option.type}-${option.label}`}
            type="button"
            className="rounded-md border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-100 hover:border-slate-500"
            onClick={() => {
              const newBlock = withId(
                withEditorDefaults({
                  ...createBlock(option.type),
                  ...filterBlockPreset(option.type, option.preset),
                })
              );
              setBlocks((prev: EditableBlock[]) => [...prev, newBlock]);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {blocks.length === 0 && (
        <p className="text-xs text-slate-500">Agrega tu primer bloque para esta pantalla.</p>
      )}

      <div className="space-y-3">
        {blocks.map((block: EditableBlock, index: number) => (
          <div
            key={block.id}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium capitalize text-slate-100">
                {block.type.replace('-', ' ')} #{index + 1}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-slate-200"
                  onClick={() => moveBlock(block.id, -1)}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-slate-200"
                  onClick={() => moveBlock(block.id, 1)}
                  disabled={index === blocks.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="text-xs text-red-400 hover:text-red-200"
                  onClick={() => removeBlock(block.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>

            {block.type === "heading" && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs text-slate-300">
                    Texto
                    <input
                      type="text"
                      value={block.text}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-slate-300">
                    Tipo
                    <select
                      value={block.level}
                      onChange={(e) => updateBlock(block.id, { level: Number(e.target.value) as 1 | 3 })}
                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                    >
                      <option value={1}>Título</option>
                      <option value={3}>Subtítulo</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs text-slate-300">
                    Tipografía
                    <select
                      value={block.fontFamily ?? ''}
                      onChange={(e) => updateBlock(block.id, { fontFamily: e.target.value })}
                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                    >
                      {FONT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs text-slate-300">
                    Tamaño (px)
                    <input
                      type="number"
                      min={12}
                      max={64}
                      value={block.fontSize ?? 36}
                      onChange={(e) => updateBlock(block.id, { fontSize: Number(e.target.value) })}
                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                    />
                  </label>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-300">
                  <p className="text-[12px]">Panel de contraste</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-[13px]">
                      <input
                        type="checkbox"
                        checked={(block as any).panelEnabled ?? false}
                        onChange={(e) => updateBlock(block.id, { panelEnabled: e.target.checked })}
                      />
                      Activar
                    </label>
                    <select
                      value={(block as any).panelShape ?? 'square'}
                      onChange={(e) => updateBlock(block.id, { panelShape: e.target.value as 'square' | 'circle' })}
                      className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                    >
                      <option value="square">Rectangular</option>
                      <option value="circle">Circular</option>
                    </select>
                    <input
                      type="color"
                      value={(block as any).panelColor ?? '#000000'}
                      onChange={(e) => updateBlock(block.id, { panelColor: e.target.value })}
                      className="h-8 w-12 rounded border border-slate-700 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => updateBlock(block.id, { panelColor: undefined })}
                      className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500"
                    >
                      Automático
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Deja Automático para usar el color de superficie del tema.</p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <label className="text-xs text-slate-300">
                      Opacidad
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={(block as any).panelOpacity ?? 90}
                        onChange={(e) => updateBlock(block.id, { panelOpacity: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-[11px] text-slate-400">{(block as any).panelOpacity ?? 90}%</div>
                    </label>
                    <label className="text-xs text-slate-300">
                      Padding (px)
                      <input
                        type="number"
                        min={0}
                        max={80}
                        value={(block as any).panelPadding ?? 20}
                        onChange={(e) => updateBlock(block.id, { panelPadding: Number(e.target.value) })}
                        className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                      />
                    </label>
                    <label className="text-xs text-slate-300">
                      Borde %
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={(block as any).panelBorderRadiusPercent ?? 50}
                        onChange={(e) => updateBlock(block.id, { panelBorderRadiusPercent: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-[11px] text-slate-400">{(block as any).panelBorderRadiusPercent ?? 50}%</div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {block.type === "paragraph" && (
              <div className="space-y-2">
                <label className="space-y-1 text-xs text-slate-300">
                  Texto
                  <textarea
                    value={block.text}
                    onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100 min-h-[80px]"
                  />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs text-slate-300">
                    Tipografía
                    <select
                      value={block.fontFamily ?? ''}
                      onChange={(e) => updateBlock(block.id, { fontFamily: e.target.value })}
                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                    >
                      {FONT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs text-slate-300">
                    Tamaño (px)
                    <input
                      type="number"
                      min={12}
                      max={36}
                      value={block.fontSize ?? 16}
                      onChange={(e) => updateBlock(block.id, { fontSize: Number(e.target.value) })}
                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                    />
                  </label>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-300">
                  <p className="text-[12px]">Panel de contraste</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-[13px]">
                      <input
                        type="checkbox"
                        checked={(block as any).panelEnabled ?? false}
                        onChange={(e) => updateBlock(block.id, { panelEnabled: e.target.checked })}
                      />
                      Activar
                    </label>
                    <select
                      value={(block as any).panelShape ?? 'square'}
                      onChange={(e) => updateBlock(block.id, { panelShape: e.target.value as 'square' | 'circle' })}
                      className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                    >
                      <option value="square">Rectangular</option>
                      <option value="circle">Circular</option>
                    </select>
                    <input
                      type="color"
                      value={(block as any).panelColor ?? '#000000'}
                      onChange={(e) => updateBlock(block.id, { panelColor: e.target.value })}
                      className="h-8 w-12 rounded border border-slate-700 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => updateBlock(block.id, { panelColor: undefined })}
                      className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500"
                    >
                      Automático
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Deja Automático para usar el color de superficie del tema.</p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <label className="text-xs text-slate-300">
                      Opacidad
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={(block as any).panelOpacity ?? 90}
                        onChange={(e) => updateBlock(block.id, { panelOpacity: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-[11px] text-slate-400">{(block as any).panelOpacity ?? 90}%</div>
                    </label>
                    <label className="text-xs text-slate-300">
                      Padding (px)
                      <input
                        type="number"
                        min={0}
                        max={80}
                        value={(block as any).panelPadding ?? 20}
                        onChange={(e) => updateBlock(block.id, { panelPadding: Number(e.target.value) })}
                        className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                      />
                    </label>
                    <label className="text-xs text-slate-300">
                      Borde %
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={(block as any).panelBorderRadiusPercent ?? 50}
                        onChange={(e) => updateBlock(block.id, { panelBorderRadiusPercent: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-[11px] text-slate-400">{(block as any).panelBorderRadiusPercent ?? 50}%</div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {block.type === "link-button" && (
              <div className="space-y-2">
                <label className="space-y-1 text-xs text-slate-300">
                  Texto del botón
                  <input
                    type="text"
                    value={block.label}
                    onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                  />
                </label>
                <label className="space-y-1 text-xs text-slate-300">
                  URL
                  <input
                    type="url"
                    value={block.href}
                    onChange={(e) => updateBlock(block.id, { href: e.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                  />
                </label>
              </div>
            )}

            {block.type === "special-button" && (
              <div className="space-y-2">
                <label className="space-y-1 text-xs text-slate-300">
                  Texto del botón
                  <input
                    type="text"
                    value={block.label}
                    onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                  />
                </label>
                <label className="space-y-1 text-xs text-slate-300">
                  Acción especial
                  <select
                    value={block.action}
                    onChange={(e) => updateBlock(block.id, { action: e.target.value as 'gallery' | 'playlist' | 'rsvp' })}
                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                  >
                    <option value="gallery">Galería</option>
                    <option value="playlist">Playlist</option>
                    <option value="rsvp">Confirmar asistencia</option>
                  </select>
                </label>
              </div>
            )}

            {(block.type === "link-button" || block.type === "special-button") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1 text-xs text-slate-300">
                  Tipografía
                  <select
                    value={block.fontFamily ?? ''}
                    onChange={(e) => updateBlock(block.id, { fontFamily: e.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                  >
                    {FONT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs text-slate-300">
                  Tamaño (px)
                  <input
                    type="number"
                    min={12}
                    max={32}
                    value={block.fontSize ?? 16}
                    onChange={(e) => updateBlock(block.id, { fontSize: Number(e.target.value) })}
                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                  />
                </label>
              </div>
            )}

            {renderColorPicker(block)}

            {(block.type === 'link-button' || block.type === 'special-button') && renderButtonStyleControls(block)}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-slate-300">
                Alineación horizontal
                <select
                  value={block.horizontalAlign ?? DEFAULT_HORIZONTAL_ALIGN}
                  onChange={(e) =>
                    updateBlock(block.id, { horizontalAlign: e.target.value as InvitationBlock["horizontalAlign"] })
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                >
                  {HORIZONTAL_ALIGN_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs text-slate-300">
                Alineación vertical
                <select
                  value={block.verticalAlign ?? DEFAULT_VERTICAL_ALIGN}
                  onChange={(e) =>
                    updateBlock(block.id, { verticalAlign: e.target.value as InvitationBlock["verticalAlign"] })
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                >
                  {VERTICAL_ALIGN_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {isSaving ? 'Guardando…' : 'Guardar bloques'}
        </button>
        {status && <p className="text-[11px] text-slate-400">{status}</p>}
      </div>
    </div>
  );
}
