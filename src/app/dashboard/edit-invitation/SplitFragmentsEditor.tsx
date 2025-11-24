"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type InvitationBlock,
  type InvitationFragment,
  type InvitationScreenData,
} from "@/components/InvitationRenderer";
import {
  ADD_OPTIONS,
  BlockType,
  FONT_OPTIONS,
  createBlock,
} from "./blockEditorConfig";

const DEFAULT_HORIZONTAL_ALIGN: InvitationBlock["horizontalAlign"] = "left";
const DEFAULT_VERTICAL_ALIGN: InvitationBlock["verticalAlign"] = "top";

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

interface FragmentBlocksEditorProps {
  screenId: number;
  screenOrder: number;
  initialFragments: InvitationFragment[] | null;
  fallbackContent?: InvitationBlock[] | null;
  backgroundType: "image" | "color";
  backgroundImageUrl?: string | null;
  backgroundColor?: string | null;
}

type FragmentKey = "left" | "right";

type EditableBlock = InvitationBlock & { id: string };

interface FragmentState {
  left: EditableBlock[];
  right: EditableBlock[];
}

type FragmentBackgroundMode = "inherit" | "color" | "image";

interface ColumnBackgroundState {
  mode: FragmentBackgroundMode;
  color: string;
  imageUrl: string | null;
}

type HorizontalAlignOption = "left" | "center" | "right";
type VerticalAlignOption = "top" | "center" | "bottom";

interface ColumnAlignmentState {
  horizontal: HorizontalAlignOption;
  vertical: VerticalAlignOption;
}

const COLUMNS: FragmentKey[] = ["left", "right"];
const visibilityStorageKey = (screenId: number) => `split-editor-visibility-${screenId}`;
const DEFAULT_TITLES: Record<FragmentKey, string> = {
  left: "Columna izquierda",
  right: "Columna derecha",
};

const DEFAULT_DESCRIPTIONS: Record<FragmentKey, string> = {
  left: "Fragmento enfocado en información principal.",
  right: "Fragmento para detalles adicionales o CTA.",
};

const DEFAULT_FRAGMENT_COLOR = "#0f172a";
const DEFAULT_TEXT_COLOR = "#ffffff";

const createDefaultBackgroundState = (): ColumnBackgroundState => ({
  mode: "inherit",
  color: DEFAULT_FRAGMENT_COLOR,
  imageUrl: null,
});

const createDefaultAlignmentState = (): ColumnAlignmentState => ({
  horizontal: "left",
  vertical: "top",
});

const withBlockDefaults = (block: InvitationBlock): InvitationBlock => ({
  ...block,
  horizontalAlign: block.horizontalAlign ?? DEFAULT_HORIZONTAL_ALIGN,
  verticalAlign: block.verticalAlign ?? DEFAULT_VERTICAL_ALIGN,
  panelEnabled: (block as any).panelEnabled ?? false,
  panelShape: (block as any).panelShape ?? "square",
  panelColor: (block as any).panelColor ?? undefined,
  panelOpacity: (block as any).panelOpacity ?? 90,
  panelPadding: (block as any).panelPadding ?? 10,
  panelBorderRadiusPercent: (block as any).panelBorderRadiusPercent ?? 6,
});

export default function SplitFragmentsEditor({
  screenId,
  screenOrder,
  initialFragments,
  fallbackContent,
  backgroundType,
  backgroundImageUrl,
  backgroundColor,
}: FragmentBlocksEditorProps) {
  const router = useRouter();
  const importedFromSingle = useMemo(
    () => !initialFragments?.length && !!fallbackContent?.length,
    [initialFragments, fallbackContent]
  );

  const hydratedFragments = useMemo<FragmentState>(() => {
    const nextState: FragmentState = { left: [], right: [] };
    if (initialFragments && initialFragments.length > 0) {
      initialFragments.forEach((fragment) => {
        if (!fragment?.content?.length) return;
        const column: FragmentKey = fragment.position === "right" ? "right" : "left";
        nextState[column] = fragment.content.map((block) => ({
          id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
          ...withBlockDefaults(block),
        }));
      });
      return nextState;
    }

    if (fallbackContent && fallbackContent.length > 0) {
      nextState.left = fallbackContent.map((block) => ({
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        ...withBlockDefaults(block),
      }));
    }

    return nextState;
  }, [initialFragments, fallbackContent]);

  const [fragments, setFragments] = useState<FragmentState>(hydratedFragments);
  const hydratedBackgrounds = useMemo<Record<FragmentKey, ColumnBackgroundState>>(() => {
    const next: Record<FragmentKey, ColumnBackgroundState> = {
      left: createDefaultBackgroundState(),
      right: createDefaultBackgroundState(),
    };

    if (initialFragments && initialFragments.length > 0) {
      initialFragments.forEach((fragment) => {
        if (!fragment) return;
        const column: FragmentKey = fragment.position === "right" ? "right" : "left";
        const guessedMode: FragmentBackgroundMode = fragment.backgroundMode
          ?? (fragment.backgroundImageUrl ? "image" : fragment.backgroundColor ? "color" : "inherit");
        next[column] = {
          mode: guessedMode,
          color: fragment.backgroundColor ?? next[column].color,
          imageUrl: fragment.backgroundImageUrl ?? null,
        };
      });
    }

    return next;
  }, [initialFragments]);
  const [columnBackgrounds, setColumnBackgrounds] = useState<Record<FragmentKey, ColumnBackgroundState>>(hydratedBackgrounds);
  const hydratedAlignments = useMemo<Record<FragmentKey, ColumnAlignmentState>>(() => {
    const next: Record<FragmentKey, ColumnAlignmentState> = {
      left: createDefaultAlignmentState(),
      right: createDefaultAlignmentState(),
    };

    if (initialFragments && initialFragments.length > 0) {
      initialFragments.forEach((fragment) => {
        if (!fragment) return;
        const column: FragmentKey = fragment.position === "right" ? "right" : "left";
        next[column] = {
          horizontal: fragment.horizontalAlign ?? next[column].horizontal,
          vertical: fragment.verticalAlign ?? next[column].vertical,
        };
      });
    }

    return next;
  }, [initialFragments]);
  const [columnAlignment, setColumnAlignment] = useState<Record<FragmentKey, ColumnAlignmentState>>(hydratedAlignments);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Record<FragmentKey, boolean>>({ left: false, right: false });
  const [uploadingColumn, setUploadingColumn] = useState<FragmentKey | null>(null);
  const hydratedTitles = useMemo(() => {
    const titles: Record<FragmentKey, string | null> = { left: null, right: null };
    if (initialFragments && initialFragments.length > 0) {
      initialFragments.forEach((fragment) => {
        if (!fragment) return;
        const column: FragmentKey = fragment.position === "right" ? "right" : "left";
        if (typeof fragment.title === "string") {
          titles[column] = fragment.title;
        } else if (fragment.title === null) {
          titles[column] = null;
        }
      });
    }
    return titles;
  }, [initialFragments]);
  const hydratedDescriptions = useMemo(() => {
    const descriptions: Record<FragmentKey, string | null> = { left: null, right: null };
    if (initialFragments && initialFragments.length > 0) {
      initialFragments.forEach((fragment) => {
        if (!fragment) return;
        const column: FragmentKey = fragment.position === "right" ? "right" : "left";
        if (typeof fragment.description === "string") {
          descriptions[column] = fragment.description;
        } else if (fragment.description === null) {
          descriptions[column] = null;
        }
      });
    }
    return descriptions;
  }, [initialFragments]);
  const [columnTitles, setColumnTitles] = useState<Record<FragmentKey, string | null>>(hydratedTitles);
  const [columnDescriptions, setColumnDescriptions] = useState<Record<FragmentKey, string | null>>(hydratedDescriptions);
  const hasAnyBlock = fragments.left.length + fragments.right.length > 0;
  const [isDirty, setIsDirty] = useState(false);
  const normalizeTextValue = (value: string | null | undefined) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const previewFragments = useMemo(() => {
    const entries: InvitationFragment[] = [];
    (COLUMNS as FragmentKey[]).forEach((column) => {
      const background = columnBackgrounds[column];
      const alignment = columnAlignment[column];
      entries.push({
        id: column,
        position: column,
        title: normalizeTextValue(columnTitles[column]) ?? undefined,
        description: normalizeTextValue(columnDescriptions[column]) ?? undefined,
        backgroundMode: background.mode,
        backgroundColor: background.mode === "color" ? background.color : undefined,
        backgroundImageUrl: background.mode === "image" ? background.imageUrl : undefined,
        horizontalAlign: alignment.horizontal,
        verticalAlign: alignment.vertical,
        content: fragments[column].map(stripId),
      });
    });
    return entries;
  }, [fragments, columnTitles, columnDescriptions, columnBackgrounds, columnAlignment]);

  const markDirty = () => setIsDirty(true);
  const derivedStatus = status ?? (isDirty ? "Cambios sin guardar" : null);


  useEffect(() => {
    setFragments(hydratedFragments);
    setIsDirty(false);
    setStatus(null);
  }, [hydratedFragments]);

  useEffect(() => {
    setColumnBackgrounds(hydratedBackgrounds);
  }, [hydratedBackgrounds]);

  useEffect(() => {
    setColumnAlignment(hydratedAlignments);
  }, [hydratedAlignments]);

  useEffect(() => {
    setColumnTitles(hydratedTitles);
    setColumnDescriptions(hydratedDescriptions);
  }, [hydratedTitles, hydratedDescriptions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(visibilityStorageKey(screenId));
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        setHiddenColumns((prev) => ({
          left: typeof parsed.left === "boolean" ? parsed.left : prev.left,
          right: typeof parsed.right === "boolean" ? parsed.right : prev.right,
        }));
      }
    } catch (error) {
      console.warn("No se pudo leer la visibilidad de columnas", error);
    }
  }, [screenId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(visibilityStorageKey(screenId), JSON.stringify(hiddenColumns));
    } catch (error) {
      console.warn("No se pudo guardar la visibilidad de columnas", error);
    }
  }, [hiddenColumns, screenId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const detail: InvitationScreenData & { screenId: number } = {
      screenId,
      id: screenId,
      order: screenOrder,
      backgroundType,
      backgroundImageUrl,
      backgroundColor,
      layoutType: "split",
      fragments: previewFragments,
      content: null,
    };
    window.dispatchEvent(
      new CustomEvent("invitation-preview:update", {
        detail,
      }),
    );
  }, [screenId, screenOrder, previewFragments, backgroundType, backgroundImageUrl, backgroundColor]);

  const addBlock = (column: FragmentKey, type: BlockType, preset?: Partial<InvitationBlock>) => {
    const baseBlock = withBlockDefaults({
      ...createBlock(type),
      ...(preset ?? {}),
    });
    const newBlock: EditableBlock = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      ...baseBlock,
    };

    setFragments((prev) => ({
      ...prev,
      [column]: [...prev[column], newBlock],
    }));
    markDirty();
  };

  const updateBlock = (column: FragmentKey, id: string, patch: Partial<InvitationBlock>) => {
    setFragments((prev) => ({
      ...prev,
      [column]: prev[column].map((block) => (block.id === id ? { ...block, ...patch } : block)),
    }));
    markDirty();
  };

  const removeBlock = (column: FragmentKey, id: string) => {
    setFragments((prev) => ({
      ...prev,
      [column]: prev[column].filter((block) => block.id !== id),
    }));
    markDirty();
  };

  const duplicateBlock = (column: FragmentKey, id: string) => {
    setFragments((prev) => {
      const blocks = [...prev[column]];
      const index = blocks.findIndex((block) => block.id === id);
      if (index === -1) return prev;
      const source = blocks[index];
      const cloneBase = withBlockDefaults(stripId(source));
      const clone: EditableBlock = {
        ...cloneBase,
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      };
      blocks.splice(index + 1, 0, clone);
      return { ...prev, [column]: blocks };
    });
    setStatus("Bloque duplicado");
    markDirty();
  };

  const moveBlock = (column: FragmentKey, index: number, direction: -1 | 1) => {
    let didMove = false;
    setFragments((prev) => {
      const blocks = [...prev[column]];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= blocks.length) return prev;
      const [item] = blocks.splice(index, 1);
      blocks.splice(newIndex, 0, item);
      didMove = true;
      return { ...prev, [column]: blocks };
    });
    if (didMove) {
      markDirty();
    }
  };

  const toggleColumnVisibility = (column: FragmentKey) => {
    setHiddenColumns((prev) => ({ ...prev, [column]: !prev[column] }));
    setStatus("Visibilidad actualizada");
  };

  const showBothColumns = () => {
    setHiddenColumns({ left: false, right: false });
    setStatus("Ambas columnas visibles");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const payload = (COLUMNS as FragmentKey[]).map((column) => {
        const background = columnBackgrounds[column];
        return {
          position: column,
          title: normalizeTextValue(columnTitles[column]),
          description: normalizeTextValue(columnDescriptions[column]),
          content: fragments[column].map(stripId),
          backgroundMode: background.mode,
          backgroundColor: background.mode === "color" ? background.color : null,
          backgroundImageUrl: background.mode === "image" ? background.imageUrl : null,
        };
      });

      const res = await fetch(`/api/invitation/screens/${screenId}/fragments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fragments: payload }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(error.error || "No se pudo guardar");
      }

      setStatus("Fragmentos guardados ✔");
      setIsDirty(false);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  const swapColumns = () => {
    if (!hasAnyBlock) return;
    setFragments((prev) => ({ left: prev.right, right: prev.left }));
    setColumnTitles((prev) => ({ left: prev.right, right: prev.left }));
    setColumnDescriptions((prev) => ({ left: prev.right, right: prev.left }));
    setStatus("Columnas intercambiadas");
    markDirty();
  };

  const balanceColumns = () => {
    if (!hasAnyBlock) return;
    let didChange = false;
    setFragments((prev) => {
      const combined = [...prev.left, ...prev.right];
      if (combined.length === 0) {
        return prev;
      }
      const nextLeft: EditableBlock[] = [];
      const nextRight: EditableBlock[] = [];
      combined.forEach((block, index) => {
        if (index % 2 === 0) {
          nextLeft.push(block);
        } else {
          nextRight.push(block);
        }
      });
      didChange = true;
      return { left: nextLeft, right: nextRight };
    });
    if (didChange) {
      setStatus("Contenido balanceado");
      markDirty();
    }
  };

  const handleBackgroundModeChange = (column: FragmentKey, mode: FragmentBackgroundMode) => {
    setColumnBackgrounds((prev) => ({
      ...prev,
      [column]: {
        ...prev[column],
        mode,
      },
    }));
    markDirty();
  };

  const handleBackgroundColorChange = (column: FragmentKey, value: string) => {
    setColumnBackgrounds((prev) => ({
      ...prev,
      [column]: {
        ...prev[column],
        color: value,
      },
    }));
    markDirty();
  };

  const handleBackgroundFileChange = async (column: FragmentKey, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("Subiendo fondo…");
    setUploadingColumn(column);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads/background", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Error al subir" }));
        throw new Error(error.error || "No se pudo subir la imagen");
      }

      const { url } = await res.json();
      setColumnBackgrounds((prev) => ({
        ...prev,
        [column]: {
          ...prev[column],
          imageUrl: url,
          mode: "image",
        },
      }));
      setStatus("Imagen actualizada ✔");
      markDirty();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setUploadingColumn(null);
      event.target.value = "";
    }
  };

  const clearBackgroundImage = (column: FragmentKey) => {
    setColumnBackgrounds((prev) => ({
      ...prev,
      [column]: {
        ...prev[column],
        imageUrl: null,
        mode: "inherit",
      },
    }));
    markDirty();
    setStatus("Imagen eliminada");
  };

  const isColumnUploading = (column: FragmentKey) => uploadingColumn === column;

  const handleTitleChange = (column: FragmentKey, value: string) => {
    setColumnTitles((prev) => ({ ...prev, [column]: value.trim().length > 0 ? value : null }));
    markDirty();
  };

  const handleDescriptionChange = (column: FragmentKey, value: string) => {
    setColumnDescriptions((prev) => ({ ...prev, [column]: value.trim().length > 0 ? value : null }));
    markDirty();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-semibold text-slate-100">Atajos rápidos para ajustar columnas</p>
          <p className="text-[11px] text-slate-400">Optimiza el layout duplicando, balanceando o mostrando ambas vistas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={swapColumns}
            disabled={!hasAnyBlock}
            className="rounded-md border border-slate-700/70 bg-slate-900/70 px-3 py-1.5 text-[11px] font-medium text-slate-100 disabled:opacity-40"
          >
            Intercambiar columnas
          </button>
          <button
            type="button"
            onClick={balanceColumns}
            disabled={!hasAnyBlock}
            className="rounded-md border border-slate-700/70 bg-slate-900/70 px-3 py-1.5 text-[11px] font-medium text-slate-100 disabled:opacity-40"
          >
            Balancear contenido
          </button>
          <button
            type="button"
            onClick={showBothColumns}
            className="rounded-md border border-slate-700/70 bg-slate-900/70 px-3 py-1.5 text-[11px] font-medium text-slate-100"
          >
            Mostrar ambas
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {COLUMNS.map((column) => {
          const background = columnBackgrounds[column];
          return (
            <div key={column} className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {column === "left" ? "Columna izquierda" : "Columna derecha"}
                  </p>
                  <p className="text-xs text-slate-500">Usa los controles de cada tarjeta para reordenar o duplicar.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleColumnVisibility(column)}
                    className="rounded-md border border-slate-700/80 bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:border-slate-500"
                  >
                    {hiddenColumns[column] ? "Mostrar" : "Ocultar"}
                  </button>
                  {ADD_OPTIONS.map((option, optionIndex) => (
                    <button
                      key={`${column}-${option.type}-${optionIndex}`}
                      type="button"
                      className="rounded-md border border-slate-700/80 bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-slate-100 hover:border-slate-500"
                      onClick={() => addBlock(column, option.type, option.preset)}
                      disabled={hiddenColumns[column]}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-[11px] text-slate-400">
                Nombre interno
                <input
                  type="text"
                  value={columnTitles[column] ?? ""}
                  onChange={(event) => handleTitleChange(column, event.target.value)}
                  placeholder={DEFAULT_TITLES[column]}
                  className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs text-slate-100"
                />
              </label>

              <label className="block text-[11px] text-slate-400">
                Descripción
                <textarea
                  value={columnDescriptions[column] ?? ""}
                  onChange={(event) => handleDescriptionChange(column, event.target.value)}
                  placeholder={DEFAULT_DESCRIPTIONS[column]}
                  className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs text-slate-100 min-h-[60px]"
                />
              </label>

              <div className="rounded-lg border border-dashed border-slate-800/70 bg-slate-950/40 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-slate-300">Fondo del fragmento</p>
                  <div className="inline-flex overflow-hidden rounded-md border border-slate-800">
                    {([
                      { value: "inherit", label: "Global" },
                      { value: "color", label: "Color" },
                      { value: "image", label: "Imagen" },
                    ] as const).map((option) => (
                      <button
                        key={`${column}-${option.value}`}
                        type="button"
                        onClick={() => handleBackgroundModeChange(column, option.value)}
                        className={`px-2.5 py-1 text-[11px] font-medium transition ${
                          background.mode === option.value
                            ? "bg-slate-800 text-slate-100"
                            : "text-slate-400 hover:text-slate-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {background.mode === "color" ? (
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <label className="flex items-center gap-2">
                      <span>Color</span>
                      <input
                        type="color"
                        value={background.color}
                        onChange={(event) => handleBackgroundColorChange(column, event.target.value)}
                        className="h-8 w-16 rounded border border-slate-700 bg-transparent"
                        disabled={isColumnUploading(column)}
                      />
                    </label>
                    <p>Ajusta un color distinto para este lado sin afectar al resto.</p>
                  </div>
                ) : background.mode === "image" ? (
                  <div className="space-y-2">
                    {background.imageUrl ? (
                      <div className="overflow-hidden rounded-lg border border-slate-800">
                        <img src={background.imageUrl} alt="Fondo del fragmento" className="h-28 w-full object-cover" />
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">Sube una imagen diferente para este fragmento.</p>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="text-[11px]"
                      onChange={(event) => handleBackgroundFileChange(column, event)}
                      disabled={isColumnUploading(column)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleBackgroundModeChange(column, "inherit")}
                        className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-200"
                        disabled={isColumnUploading(column)}
                      >
                        Usar fondo global
                      </button>
                      {background.imageUrl && (
                        <button
                          type="button"
                          onClick={() => clearBackgroundImage(column)}
                          className="rounded-md border border-red-600/60 px-2 py-1 text-[11px] text-red-300"
                          disabled={isColumnUploading(column)}
                        >
                          Quitar imagen
                        </button>
                      )}
                    </div>
                    {isColumnUploading(column) && (
                      <p className="text-[11px] text-slate-400">Subiendo imagen…</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">Este fragmento hereda el fondo global configurado en la pantalla.</p>
                )}
              </div>

              {hiddenColumns[column] ? (
                <p className="text-xs text-slate-500">Columna oculta temporalmente.</p>
              ) : fragments[column].length === 0 ? (
                <p className="text-xs text-slate-500">No hay bloques en esta columna.</p>
              ) : (
                <div className="space-y-3">
                  {fragments[column].map((block, index) => (
                    <div
                      key={block.id}
                      className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium capitalize text-slate-100">
                          {block.type.replace('-', ' ')} #{index + 1}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-xs text-slate-400 hover:text-slate-200"
                            onClick={() => moveBlock(column, index, -1)}
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="text-xs text-slate-400 hover:text-slate-200"
                            onClick={() => moveBlock(column, index, 1)}
                            disabled={index === fragments[column].length - 1}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="text-xs text-slate-400 hover:text-slate-200"
                            onClick={() => duplicateBlock(column, block.id)}
                          >
                            Duplicar
                          </button>
                          <button
                            type="button"
                            className="text-xs text-red-400 hover:text-red-200"
                            onClick={() => removeBlock(column, block.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {renderBlockEditor(column, block, updateBlock)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {importedFromSingle && (
        <p className="text-[11px] text-slate-400">
          Importamos tus bloques existentes en la columna izquierda. Usa los controles de duplicar y mover para repartirlos.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {isSaving ? "Guardando…" : "Guardar cambios"}
        </button>
        {derivedStatus && <p className="text-[11px] text-slate-400">{derivedStatus}</p>}
      </div>
    </div>
  );
}

function stripId(block: EditableBlock): InvitationBlock {
  const { id, ...rest } = block;
  return rest;
}

function renderBlockEditor(
  column: FragmentKey,
  block: EditableBlock,
  updateBlock: (column: FragmentKey, id: string, patch: Partial<InvitationBlock>) => void,
) {
  const renderTypography = (min: number, max: number, fallback: number) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="space-y-1 text-xs text-slate-300">
        Tipografía
        <select
          value={block.fontFamily ?? FONT_OPTIONS[0].value}
          onChange={(e) => updateBlock(column, block.id, { fontFamily: e.target.value })}
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
          min={min}
          max={max}
          value={block.fontSize ?? fallback}
          onChange={(e) => updateBlock(column, block.id, { fontSize: Number(e.target.value) })}
          className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
        />
      </label>
    </div>
  );

  const renderColorControl = () => (
    <div className="space-y-1 text-xs text-slate-300">
      Color del texto
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={block.color ?? DEFAULT_TEXT_COLOR}
          onChange={(e) => updateBlock(column, block.id, { color: e.target.value })}
          className="h-8 w-16 rounded border border-slate-700 bg-transparent"
        />
        <button
          type="button"
          onClick={() => updateBlock(column, block.id, { color: undefined })}
          className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500 disabled:opacity-40"
          disabled={!block.color}
        >
          Automático
        </button>
        <span className="text-[10px] text-slate-500">Deja Automático para usar los colores globales.</span>
      </div>
    </div>
  );

  const renderAlignmentControls = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="space-y-1 text-xs text-slate-300">
        Alineación horizontal
        <select
          value={block.horizontalAlign ?? DEFAULT_HORIZONTAL_ALIGN}
          onChange={(e) => updateBlock(column, block.id, { horizontalAlign: e.target.value as InvitationBlock["horizontalAlign"] })}
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
          onChange={(e) => updateBlock(column, block.id, { verticalAlign: e.target.value as InvitationBlock["verticalAlign"] })}
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
  );

  const renderButtonStyleControls = (column: FragmentKey, block: EditableBlock) => (
    <div className="space-y-1 text-xs text-slate-300">
      <p className="text-[12px]">Estilos del botón</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="space-y-1">
          <div className="text-[11px]">Color de borde</div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(block as any).borderColor ?? '#000000'}
              onChange={(e) => updateBlock(column, block.id, { borderColor: e.target.value })}
              className="h-8 w-16 rounded border border-slate-700 bg-transparent"
            />
            <button
              type="button"
              onClick={() => updateBlock(column, block.id, { borderColor: undefined })}
              className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500 disabled:opacity-40"
              disabled={!(block as any).borderColor}
            >
              Automático
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px]">Relleno</div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(block as any).backgroundColor && (block as any).backgroundColor !== 'transparent' ? (block as any).backgroundColor : '#000000'}
              onChange={(e) => updateBlock(column, block.id, { backgroundColor: e.target.value })}
              className="h-8 w-16 rounded border border-slate-700 bg-transparent"
              disabled={(block as any).backgroundColor === 'transparent'}
            />
            <button
              type="button"
              onClick={() => updateBlock(column, block.id, { backgroundColor: 'transparent' })}
              className={`rounded border px-2 py-1 text-[11px] ${ (block as any).backgroundColor === 'transparent' ? 'border-sky-500 text-sky-400' : 'border-slate-700 text-slate-200 hover:border-slate-500'}`}
            >
              Transparente
            </button>
            <button
              type="button"
              onClick={() => updateBlock(column, block.id, { backgroundColor: undefined })}
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

  if (block.type === "heading") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1 text-xs text-slate-300">
            Texto
            <input
              type="text"
              value={block.text}
              onChange={(e) => updateBlock(column, block.id, { text: e.target.value })}
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-300">
            Tipo
            <select
              value={block.level}
              onChange={(e) => updateBlock(column, block.id, { level: Number(e.target.value) as 1 | 3 })}
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
            >
              <option value={1}>Título</option>
              <option value={3}>Subtítulo</option>
            </select>
          </label>
        </div>
        {renderTypography(12, 64, 36)}
        {renderColorControl()}
        {renderAlignmentControls()}
        <div className="mt-2">
          <div className="space-y-1 text-xs text-slate-300">
            <p className="text-[12px]">Panel de contraste</p>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={(block as any).panelEnabled ?? false}
                  onChange={(e) => updateBlock(column, block.id, { panelEnabled: e.target.checked })}
                />
                Activar
              </label>

              <select
                value={(block as any).panelShape ?? 'square'}
                onChange={(e) => updateBlock(column, block.id, { panelShape: e.target.value as 'square' | 'circle' })}
                className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
              >
                <option value="square">Rectangular</option>
                <option value="circle">Circular</option>
              </select>

              <input
                type="color"
                value={(block as any).panelColor ?? '#000000'}
                onChange={(e) => updateBlock(column, block.id, { panelColor: e.target.value })}
                className="h-8 w-12 rounded border border-slate-700 bg-transparent"
              />

              <button
                type="button"
                onClick={() => updateBlock(column, block.id, { panelColor: undefined })}
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
                  onChange={(e) => updateBlock(column, block.id, { panelOpacity: Number(e.target.value) })}
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
                  value={(block as any).panelPadding ?? 10}
                  onChange={(e) => updateBlock(column, block.id, { panelPadding: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
                />
              </label>

              <label className="text-xs text-slate-300">
                Borde %
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={(block as any).panelBorderRadiusPercent ?? 6}
                  onChange={(e) => updateBlock(column, block.id, { panelBorderRadiusPercent: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-[11px] text-slate-400">{(block as any).panelBorderRadiusPercent ?? 6}%</div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "paragraph") {
    return (
      <div className="space-y-3">
        <label className="space-y-1 text-xs text-slate-300">
          Texto
          <textarea
            value={block.text}
            onChange={(e) => updateBlock(column, block.id, { text: e.target.value })}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100 min-h-[80px]"
          />
        </label>
        {renderTypography(12, 36, 16)}
        {renderColorControl()}
        {renderAlignmentControls()}
        <div className="mt-2">
          <div className="space-y-1 text-xs text-slate-300">
            <p className="text-[12px]">Panel de contraste</p>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={(block as any).panelEnabled ?? false}
                  onChange={(e) => updateBlock(column, block.id, { panelEnabled: e.target.checked })}
                />
                Activar
              </label>

              <select
                value={(block as any).panelShape ?? 'square'}
                onChange={(e) => updateBlock(column, block.id, { panelShape: e.target.value as 'square' | 'circle' })}
                className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
              >
                <option value="square">Rectangular</option>
                <option value="circle">Circular</option>
              </select>

              <input
                type="color"
                value={(block as any).panelColor ?? '#000000'}
                onChange={(e) => updateBlock(column, block.id, { panelColor: e.target.value })}
                className="h-8 w-12 rounded border border-slate-700 bg-transparent"
              />

              <button
                type="button"
                onClick={() => updateBlock(column, block.id, { panelColor: undefined })}
                className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500"
              >
                Automático
              </button>
            </div>
            <p className="text-[10px] text-slate-500">Deja Automático para usar el color de superficie del tema.</p>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "link-button") {
    return (
      <div className="space-y-3">
        <label className="space-y-1 text-xs text-slate-300">
          Texto del botón
          <input
            type="text"
            value={block.label}
            onChange={(e) => updateBlock(column, block.id, { label: e.target.value })}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
          />
        </label>
        <label className="space-y-1 text-xs text-slate-300">
          URL
          <input
            type="url"
            value={block.href}
            onChange={(e) => updateBlock(column, block.id, { href: e.target.value })}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
          />
        </label>
        {renderTypography(12, 32, 16)}
        {renderColorControl()}
        {renderAlignmentControls()}
        {renderButtonStyleControls(column, block)}
      </div>
    );
  }

  if (block.type === "special-button") {
    return (
      <div className="space-y-3">
        <label className="space-y-1 text-xs text-slate-300">
          Texto del botón
          <input
            type="text"
            value={block.label}
            onChange={(e) => updateBlock(column, block.id, { label: e.target.value })}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
          />
        </label>
        <label className="space-y-1 text-xs text-slate-300">
          Acción especial
          <select
            value={block.action}
            onChange={(e) => updateBlock(column, block.id, { action: e.target.value as "gallery" | "playlist" | "rsvp" })}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-slate-100"
          >
            <option value="gallery">Galería</option>
            <option value="playlist">Playlist</option>
            <option value="rsvp">Confirmar asistencia</option>
          </select>
        </label>
        {renderTypography(12, 32, 16)}
            {renderColorControl()}
            {renderAlignmentControls()}
            {renderButtonStyleControls(column, block)}
      </div>
    );
  }

  return null;
}
