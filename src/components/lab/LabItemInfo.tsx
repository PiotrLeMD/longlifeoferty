"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LabItemInfoProps {
  title: string;
  skladniki: string;
  description: string;
  includeInOffer: boolean;
  onIncludeChange: (value: boolean) => void;
}

const LEAVE_MS = 320;

function computePanelPosition(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const maxW = Math.min(384, window.innerWidth - 16);
  let left = Math.max(8, Math.min(r.left, window.innerWidth - maxW - 8));
  let top = r.bottom + 4;
  const estPanel = 360;
  const spaceBelow = window.innerHeight - r.bottom - 12;
  if (spaceBelow < 200 && r.top > spaceBelow) {
    top = Math.max(8, r.top - estPanel - 4);
  }
  return { top, left, width: maxW };
}

export function LabItemInfo({
  title,
  skladniki,
  description,
  includeInOffer,
  onIncludeChange,
}: LabItemInfoProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 384 });
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerWrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const clearLeave = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearLeave();
    leaveTimer.current = setTimeout(() => setOpen(false), LEAVE_MS);
  }, [clearLeave]);

  const syncPosition = useCallback(() => {
    const el = triggerWrapRef.current;
    if (!el) return;
    setCoords(computePanelPosition(el));
  }, []);

  const openPanel = useCallback(() => {
    clearLeave();
    syncPosition();
    setOpen(true);
  }, [clearLeave, syncPosition]);

  useLayoutEffect(() => {
    if (!open) return;
    syncPosition();
    const run = () => syncPosition();
    window.addEventListener("scroll", run, true);
    window.addEventListener("resize", run);
    return () => {
      window.removeEventListener("scroll", run, true);
      window.removeEventListener("resize", run);
    };
  }, [open, syncPosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerWrapRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => clearLeave(), [clearLeave]);

  const skladText =
    skladniki.trim() || "Brak listy składu w bazie (pole skladniki).";
  const opisText =
    description.trim() ||
    "Brak opisu w bazie — po uzupełnieniu pola opis / description pojawi się tutaj.";

  const panelContent = (
    <div
      ref={panelRef}
      className="fixed z-[300] max-h-[min(80vh,28rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-xl ring-1 ring-black/5"
      style={{
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxWidth: "min(24rem, calc(100vw - 1rem))",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseEnter={openPanel}
      onMouseLeave={scheduleClose}
    >
      <div className="max-h-[min(80vh,28rem)] overflow-y-auto p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">{title}</p>

        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Skład
          </p>
          <p className="text-sm leading-relaxed text-slate-800">{skladText}</p>
        </div>

        <div className="mb-4 border-t border-slate-100 pt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Opis
          </p>
          <p className="text-sm leading-relaxed text-slate-700">{opisText}</p>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInOffer}
              onChange={(e) => onIncludeChange(e.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 text-blue-600"
            />
            <span>Dołącz opis do oferty dla klienta</span>
          </label>
          <p className="mt-1 pl-6 text-xs text-slate-500">
            Zaznaczone opisy trafią do koszyka i w przyszłości do PDF; bez
            zaznaczenia służą tylko Tobie jako ściąga.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full sm:hidden"
          onClick={() => setOpen(false)}
        >
          Zamknij
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={triggerWrapRef}
        className="inline-flex shrink-0"
        onMouseEnter={openPanel}
        onMouseLeave={scheduleClose}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-7 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          aria-label={`Skład i opis: ${title}`}
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => {
              if (!v) syncPosition();
              return !v;
            });
          }}
        >
          <Info className="size-4" />
        </Button>
      </div>
      {mounted &&
        open &&
        typeof document !== "undefined" &&
        createPortal(panelContent, document.body)}
    </>
  );
}
