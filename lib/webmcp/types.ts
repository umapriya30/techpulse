/**
 * Minimal ambient types for the WebMCP `document.modelContext` API.
 *
 * WebMCP (https://github.com/webmachinelearning/webmcp) is a proposed W3C
 * standard, jointly developed by Google and Microsoft, that lets a page
 * register structured "tools" an AI agent can call directly instead of
 * driving the DOM. It shipped an early preview in Chrome 146
 * (chrome://flags/#enable-webmcp-testing) and works out of the box in
 * ChatGPT's in-app browser.
 *
 * There's no official `@types` package yet, so we declare just the surface
 * TECHPULSE uses. See lib/webmcp/tools.ts for the actual tool definitions.
 */

export interface ModelContextToolAnnotations {
  /** true = the tool only reads data, never mutates state. */
  readOnlyHint?: boolean;
  /** true = the tool's output should be treated as untrusted page content. */
  untrustedContentHint?: boolean;
  /** true = calling the tool can have real-world side effects that are hard to undo. */
  destructiveHint?: boolean;
  /** true = calling the tool twice with the same input is safe. */
  idempotentHint?: boolean;
}

export interface ModelContextToolResultContentPart {
  type: "text";
  text: string;
}

export interface ModelContextToolResult {
  content: ModelContextToolResultContentPart[];
  isError?: boolean;
}

export interface ModelContextExecuteContext {
  signal: AbortSignal;
}

export type ModelContextToolExecute = (
  input: Record<string, unknown>,
  ctx: ModelContextExecuteContext,
) => Promise<string | ModelContextToolResult> | string | ModelContextToolResult;

export interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: ModelContextToolExecute;
  annotations?: ModelContextToolAnnotations;
}

export interface RegisterToolOptions {
  /** Abort to unregister the tool (there is no separate unregisterTool method). */
  signal?: AbortSignal;
  /** Origins allowed to see/call this tool when this page is embedded elsewhere. */
  exposedTo?: string[];
}

export interface ModelContext {
  registerTool(
    tool: ModelContextTool,
    options?: RegisterToolOptions,
  ): Promise<void> | void;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

export function hasWebMCP(): boolean {
  return typeof document !== "undefined" && !!document.modelContext;
}
