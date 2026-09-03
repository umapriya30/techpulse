"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/app/providers";
import { registerTechPulseTools, type WebMCPBridge } from "@/lib/webmcp/tools";

/**
 * Mounts once in the root layout and registers TECHPULSE's WebMCP tools
 * (see lib/webmcp/tools.ts) with `document.modelContext`, when the browser
 * supports it — Chrome 146+ with the WebMCP flag on, or ChatGPT's in-app
 * browser. Renders nothing.
 *
 * Tools read live app state (bookmarks) and navigate via the Next.js router,
 * so the bridge is kept in a ref and tools registered exactly once — no
 * re-registration churn as the store updates.
 */
export function WebMCPProvider() {
  const router = useRouter();
  const store = useStore();

  const bridgeRef = useRef<WebMCPBridge | null>(null);

  // Keep the ref pointed at the latest store/router after every render,
  // without ever accessing it during render itself.
  useEffect(() => {
    bridgeRef.current = {
      listSaved: () => store.bookmarks,
      isSaved: (type, slug) => store.isSaved(type, slug),
      toggleSave: (type, slug) => store.toggleSave(type, slug),
      navigate: (href) => router.push(href),
    };
  });

  useEffect(() => {
    if (typeof document === "undefined" || !document.modelContext) return;
    const controller = new AbortController();

    // Indirection so the tools always call through to the latest store/router
    // without needing to re-register (registerTool has no update/replace API).
    const stableBridge: WebMCPBridge = {
      listSaved: () => bridgeRef.current!.listSaved(),
      isSaved: (type, slug) => bridgeRef.current!.isSaved(type, slug),
      toggleSave: (type, slug) => bridgeRef.current!.toggleSave(type, slug),
      navigate: (href) => bridgeRef.current!.navigate(href),
    };

    registerTechPulseTools(stableBridge, controller.signal).catch((err) => {
      console.error("[webmcp] tool registration failed", err);
    });

    return () => controller.abort();
    // Intentionally register once per mount; live values flow through bridgeRef.
  }, []);

  return null;
}
