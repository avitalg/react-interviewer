/* eslint-disable @typescript-eslint/no-explicit-any */
import { installFormSubmitShim } from "./forms";
import type { MockApi, MockResponse } from "./types";

export type SandboxWindow = Window & typeof globalThis & Record<string, any>;

export interface SandboxEnv {
  win: SandboxWindow;
  React: any;
  ReactDOM: any;
  /** Timers captured before anything can patch them; the harness uses these. */
  real: {
    setTimeout: typeof setTimeout;
    clearTimeout: typeof clearTimeout;
    setInterval: typeof setInterval;
    clearInterval: typeof clearInterval;
    dateNow: () => number;
    fetch: typeof fetch | undefined;
  };
  ErrorBoundary: any;
}

export const MOCK_ORIGIN = "https://api.example.com";

export function createEnv(win: SandboxWindow): SandboxEnv {
  const React: any = win.React;
  const ReactDOM: any = win.ReactDOM;
  if (!React || !ReactDOM) throw new Error("React failed to load in the sandbox.");

  class ErrorBoundary extends React.Component {
    state = { error: null as Error | null };
    static getDerivedStateFromError(error: Error) {
      return { error };
    }
    componentDidCatch(error: Error) {
      this.props.onError?.(error);
    }
    render() {
      if (this.state.error) return this.props.fallback ?? null;
      return this.props.children;
    }
  }

  const real = {
    setTimeout: win.setTimeout.bind(win),
    clearTimeout: win.clearTimeout.bind(win),
    setInterval: win.setInterval.bind(win),
    clearInterval: win.clearInterval.bind(win),
    dateNow: win.Date.now.bind(win.Date),
    fetch: typeof win.fetch === "function" ? win.fetch.bind(win) : undefined,
  };

  ensureStorage(win);
  lockdown(win);
  installFormSubmitShim(win);

  const env: SandboxEnv = { win, React, ReactDOM, real, ErrorBoundary };
  win.fetch = createMockFetch(env, { getApi: () => undefined, allowNetwork: false }) as typeof fetch;
  return env;
}

const WALLET_GLOBALS = [
  "ethereum",
  "solana",
  "solanaEthereum",
  "phantom",
  "web3",
  "tronWeb",
  "tronLink",
  "cardano",
  "keplr",
  "coinbaseWalletExtension",
  "coinbaseWallet",
  "starknet",
  "okxwallet",
  "bitcoin",
];

const BLOCKED_TAGS = new Set(["script", "iframe", "object", "embed", "applet", "frame", "frameset", "link", "meta", "base"]);

function disabledApi(name: string) {
  return function blocked() {
    throw new TypeError(`${name} is not available in the preview sandbox.`);
  };
}

function hideProperty(object: object, key: string) {
  try {
    Object.defineProperty(object, key, {
      configurable: true,
      enumerable: false,
      get: () => undefined,
      set: () => undefined,
    });
  } catch {
    try {
      (object as Record<string, unknown>)[key] = undefined;
    } catch {
      // The property may be non-configurable (some extension providers).
    }
  }
}

/**
 * Editor code runs with full JS in this window. Strip the ways it can reach the
 * parent page, the network, or wallet/extensions injected into every frame.
 */
export function lockdown(win: SandboxWindow) {
  for (const key of WALLET_GLOBALS) hideProperty(win, key);

  for (const name of ["Worker", "SharedWorker", "BroadcastChannel", "WebSocket", "EventSource", "XMLHttpRequest"] as const) {
    try {
      Object.defineProperty(win, name, {
        configurable: true,
        writable: true,
        value: disabledApi(name),
      });
    } catch {
      try {
        (win as Record<string, unknown>)[name] = disabledApi(name);
      } catch {
        // ignore
      }
    }
  }

  try {
    win.open = disabledApi("window.open") as typeof win.open;
  } catch {
    // ignore
  }

  try {
    Object.defineProperty(win.navigator, "serviceWorker", {
      configurable: true,
      get: () => undefined,
    });
  } catch {
    // ignore
  }

  try {
    Object.defineProperty(win.navigator, "sendBeacon", {
      configurable: true,
      value: () => false,
    });
  } catch {
    // ignore
  }

  const doc = win.document;
  const createElement = doc.createElement.bind(doc);
  doc.createElement = ((tagName: string, options?: ElementCreationOptions) => {
    if (BLOCKED_TAGS.has(String(tagName).toLowerCase())) {
      throw new TypeError(`<${tagName}> is not allowed in the preview sandbox.`);
    }
    return createElement(tagName, options);
  }) as typeof doc.createElement;

  if (typeof doc.createElementNS === "function") {
    const createElementNS = doc.createElementNS.bind(doc);
    doc.createElementNS = ((ns: string, tagName: string, options?: ElementCreationOptions) => {
      const local = String(tagName).toLowerCase().replace(/^.*:/, "");
      if (BLOCKED_TAGS.has(local)) {
        throw new TypeError(`<${tagName}> is not allowed in the preview sandbox.`);
      }
      return createElementNS(ns, tagName, options);
    }) as typeof doc.createElementNS;
  }

  doc.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof win.Node)) return;
      const link = target instanceof win.Element ? target.closest("a[href]") : null;
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;
      event.preventDefault();
    },
    true,
  );
}

class MemoryStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.has(String(key)) ? this.map.get(String(key))! : null;
  }
  key(index: number) {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(String(key));
  }
  setItem(key: string, value: string) {
    this.map.set(String(key), String(value));
  }
}

/** Sandboxed iframes have an opaque origin, where touching localStorage throws. Swap in memory storage. */
function ensureStorage(win: SandboxWindow) {
  for (const name of ["localStorage", "sessionStorage"] as const) {
    let works = false;
    try {
      const storage = win[name];
      storage.setItem("__probe__", "1");
      storage.removeItem("__probe__");
      works = true;
    } catch {
      works = false;
    }
    if (!works) {
      Object.defineProperty(win, name, { value: new MemoryStorage(), configurable: true });
    }
  }
}

const ALLOWED_MODULES = ["react", "react-dom", "react-dom/client"];

/** Evaluates the compiled (CommonJS) user module and returns its exports. */
export function evaluateModule(env: SandboxEnv, js: string): Record<string, any> {
  const modules: Record<string, unknown> = {
    react: env.React,
    "react-dom": env.ReactDOM,
    "react-dom/client": env.ReactDOM,
  };
  const require = (name: string) => {
    if (Object.prototype.hasOwnProperty.call(modules, name)) return modules[name];
    throw new Error(
      `Cannot import "${name}". Only ${ALLOWED_MODULES.map((m) => `"${m}"`).join(", ")} can be imported here.`,
    );
  };
  const userModule = { exports: {} as Record<string, any> };
  const fn = new env.win.Function("require", "module", "exports", "React", `"use strict";\n${js}`);
  fn(require, userModule, userModule.exports, env.React);
  return userModule.exports;
}

export function getComponent(exports: Record<string, any>): any {
  const candidate = exports.default ?? exports.App;
  const isComponent =
    typeof candidate === "function" || (candidate !== null && typeof candidate === "object" && "$$typeof" in candidate);
  if (!isComponent) {
    throw new Error("No component to render. Add `export default function App() { ... }` to your code.");
  }
  return candidate;
}

export function evaluateFunction<T>(env: SandboxEnv, source: string): T {
  return new env.win.Function(`return (${source});`)() as T;
}

function toAbsoluteUrl(input: unknown): URL {
  if (typeof input === "string") return new URL(input, MOCK_ORIGIN);
  if (input instanceof URL) return input;
  if (input && typeof input === "object" && "url" in input) return new URL(String((input as Request).url), MOCK_ORIGIN);
  return new URL(String(input), MOCK_ORIGIN);
}

function makeResponse(res: MockResponse) {
  const status = res.status ?? 200;
  const text = res.body === undefined ? "" : JSON.stringify(res.body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : String(status),
    headers: { get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null) },
    json: async () => (text ? JSON.parse(text) : null),
    text: async () => text,
    clone() {
      return makeResponse(res);
    },
  };
}

export interface FetchOptions {
  getApi: () => MockApi | undefined;
  onCall?: (call: { url: string; init?: RequestInit; signal?: AbortSignal | null }) => void;
  /** Whether requests to other origins may use the real network. */
  allowNetwork: boolean;
}

/** Builds a fetch that answers relative URLs (and api.example.com) from the exercise's fake backend. */
export function createMockFetch(env: SandboxEnv, options: FetchOptions) {
  const { win } = env;
  return function mockFetch(input: unknown, init?: RequestInit): Promise<unknown> {
    const url = toAbsoluteUrl(input);
    const signal = init?.signal ?? null;
    options.onCall?.({ url: url.pathname + url.search, init, signal });

    if (url.origin !== MOCK_ORIGIN) {
      if (options.allowNetwork && env.real.fetch) return env.real.fetch(url.toString(), init);
      return Promise.reject(new TypeError(`Failed to fetch ${url} (the sandbox has no network access)`));
    }
    const api = options.getApi();
    if (!api) return Promise.reject(new TypeError(`Failed to fetch ${url.pathname} (no fake API for this exercise)`));

    const abortError = () => new win.DOMException("The user aborted a request.", "AbortError");
    if (signal?.aborted) return Promise.reject(abortError());

    return new Promise((resolve, reject) => {
      let settled = false;
      const onAbort = () => {
        if (settled) return;
        settled = true;
        reject(abortError());
      };
      signal?.addEventListener("abort", onAbort);
      Promise.resolve()
        .then(() => api(url, init))
        .then(
          (res) => {
            env.real.setTimeout(() => {
              if (settled) return;
              settled = true;
              signal?.removeEventListener("abort", onAbort);
              resolve(makeResponse(res ?? { status: 404 }));
            }, res?.delay ?? 0);
          },
          (error) => {
            if (settled) return;
            settled = true;
            reject(error);
          },
        );
    });
  };
}
