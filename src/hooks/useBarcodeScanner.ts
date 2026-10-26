"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseBarcodeSccannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  timeout?: number;
  enabled?: boolean;
}

/**
 * Listens for rapid keyboard input that resembles a barcode scanner.
 * Scanners type chars very fast (< 50ms apart), followed by Enter.
 */
export function useBarcodeScanner({
  onScan,
  minLength = 3,
  timeout = 80,
  enabled = true,
}: UseBarcodeSccannerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    const code = bufferRef.current.trim();
    if (code.length >= minLength) {
      onScan(code);
    }
    bufferRef.current = "";
  }, [onScan, minLength]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input / textarea / select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const now = Date.now();
      const delta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (timerRef.current) clearTimeout(timerRef.current);
        flush();
        return;
      }

      // If gap too large, reset buffer
      if (delta > 300 && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      // Auto-flush after timeout (in case no Enter key comes)
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (bufferRef.current.length >= minLength) flush();
        else bufferRef.current = "";
      }, timeout * 3);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, flush, timeout, minLength]);
}
