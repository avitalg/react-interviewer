/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createMockFetch,
  evaluateFunction,
  evaluateModule,
  getComponent,
  type SandboxEnv,
} from "./env";
import { createQueries, matches } from "./queries";
import type { CheckOutcome, CheckPayload, FetchCall, Matchers, MockApi, TestApi, TextMatcher } from "./types";

const DEFAULT_TIMEOUT = 5000;

class CheckFailure extends Error {}

function formatValue(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === undefined) return "undefined";
  if (typeof value === "function") return "a function";
  if (value && typeof value === "object" && "nodeType" in (value as object)) return `<${(value as Element).tagName?.toLowerCase()}>`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatLogArg(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  return formatValue(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => deepEqual((a as any)[key], (b as any)[key]));
}

function createExpect(actual: unknown, message: string | undefined, negate: boolean): Matchers {
  const check = (pass: boolean, description: string) => {
    if (pass === negate) {
      const expectation = `${negate ? "not " : ""}${description}`;
      throw new CheckFailure(`${message ?? "Value"}: expected ${expectation}, got ${formatValue(actual)}.`);
    }
  };
  return {
    toBe: (expected) => check(Object.is(actual, expected), formatValue(expected)),
    toEqual: (expected) => check(deepEqual(actual, expected), formatValue(expected)),
    toBeTruthy: () => check(Boolean(actual), "a truthy value"),
    toBeFalsy: () => check(!actual, "a falsy value"),
    toBeNull: () => check(actual === null, "null"),
    toContain: (expected) =>
      check(
        typeof actual === "string"
          ? actual.includes(String(expected))
          : Array.isArray(actual) && actual.some((item) => deepEqual(item, expected)),
        `something containing ${formatValue(expected)}`,
      ),
    toMatch: (expected) =>
      check(
        typeof actual === "string" &&
          (typeof expected === "string" ? actual.includes(expected) : new RegExp(expected.source, expected.flags).test(actual)),
        `a value matching ${String(expected)}`,
      ),
    toHaveLength: (expected) =>
      check((actual as { length?: number })?.length === expected, `length ${expected}`),
    toBeGreaterThan: (expected) => check(Number(actual) > expected, `more than ${expected}`),
    toBeGreaterThanOrEqual: (expected) => check(Number(actual) >= expected, `at least ${expected}`),
    toBeLessThan: (expected) => check(Number(actual) < expected, `less than ${expected}`),
    toBeLessThanOrEqual: (expected) => check(Number(actual) <= expected, `at most ${expected}`),
  };
}

interface FakeTimer {
  id: number;
  at: number;
  fn: (...args: unknown[]) => void;
  args: unknown[];
  interval?: number;
}

/** Builds a fresh test context: new module instance, container, mocks and patched globals. */
export function createTestContext(env: SandboxEnv, code: string, defaultApi?: MockApi) {
  const { win, React, ReactDOM } = env;
  const doc = win.document;
  const h = React.createElement;
  const act: (fn: () => unknown) => Promise<void> = React.act ?? React.unstable_act;

  const roots: any[] = [];
  const containers: HTMLElement[] = [];
  const fetchCalls: FetchCall[] = [];
  const logs: string[] = [];
  const crashes: Error[] = [];
  const realTimers = new Set<number>();
  const listeners: [EventTarget, string, EventListenerOrEventListenerObject, unknown][] = [];
  let api = defaultApi;
  let fake: { now: number; timers: Map<number, FakeTimer>; nextId: number } | null = null;
  let submitsWithoutPreventDefault = 0;

  const patched: [object, string, PropertyDescriptor | undefined][] = [];
  const patch = (target: object, key: string, value: unknown) => {
    patched.push([target, key, Object.getOwnPropertyDescriptor(target, key)]);
    Object.defineProperty(target, key, { value, configurable: true, writable: true });
  };

  // Track timers so they can be cleared between checks; fake timers replace them when enabled.
  patch(win, "setTimeout", (fn: any, ms?: number, ...args: unknown[]) => {
    if (fake) {
      const id = fake.nextId++;
      fake.timers.set(id, { id, at: fake.now + Math.max(0, Number(ms) || 0), fn, args });
      return id;
    }
    const id = env.real.setTimeout(
      (...callArgs: unknown[]) => {
        realTimers.delete(id);
        if (typeof fn === "function") fn(...callArgs);
      },
      ms,
      ...args,
    ) as unknown as number;
    realTimers.add(id);
    return id;
  });
  patch(win, "setInterval", (fn: any, ms?: number, ...args: unknown[]) => {
    if (fake) {
      const id = fake.nextId++;
      const interval = Math.max(1, Number(ms) || 0);
      fake.timers.set(id, { id, at: fake.now + interval, fn, args, interval });
      return id;
    }
    const id = env.real.setInterval(fn, ms, ...args) as unknown as number;
    realTimers.add(id);
    return id;
  });
  const clear = (id: number) => {
    if (fake?.timers.delete(id)) return;
    realTimers.delete(id);
    env.real.clearTimeout(id);
    env.real.clearInterval(id);
  };
  patch(win, "clearTimeout", clear);
  patch(win, "clearInterval", clear);

  // Track listeners on window/document so leftovers (e.g. keydown handlers) don't leak into the next check.
  for (const target of [win, doc] as EventTarget[]) {
    const add = target.addEventListener;
    patch(target, "addEventListener", function (this: EventTarget, type: string, listener: any, options?: unknown) {
      if (type !== "selectionchange") listeners.push([target, type, listener, options]);
      return add.call(target, type, listener, options as AddEventListenerOptions);
    });
  }

  patch(
    win,
    "fetch",
    createMockFetch(env, {
      getApi: () => api,
      onCall: (call) => fetchCalls.push(call),
      allowNetwork: false,
    }),
  );

  const originalConsole: Record<string, (...args: unknown[]) => void> = {};
  for (const method of ["log", "info", "warn", "error", "debug"] as const) {
    originalConsole[method] = win.console[method];
    patch(win.console, method, (...args: unknown[]) => {
      logs.push(args.map(formatLogArg).join(" "));
      if (method !== "error" && method !== "warn") return;
      originalConsole[method].apply(win.console, args);
    });
  }

  const onError = (event: ErrorEvent) => {
    crashes.push(event.error instanceof Error ? event.error : new Error(event.message));
    event.preventDefault();
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (reason?.name === "AbortError") return;
    crashes.push(reason instanceof Error ? reason : new Error(String(reason)));
  };
  const onSubmit = (event: Event) => {
    if (!event.defaultPrevented) {
      submitsWithoutPreventDefault++;
      event.preventDefault();
    }
  };
  win.addEventListener("error", onError);
  win.addEventListener("unhandledrejection", onRejection);
  win.addEventListener("submit", onSubmit);

  const initialTitle = doc.title;
  let exports: Record<string, any> = {};
  let moduleError: Error | null = null;
  try {
    exports = evaluateModule(env, code);
  } catch (error) {
    moduleError = error instanceof Error ? error : new Error(String(error));
  }

  const throwIfCrashed = () => {
    const crash = crashes.shift();
    if (crash) throw new CheckFailure(`Your component threw an error: ${crash.message}`);
  };

  const realSleep = (ms: number) => new Promise<void>((resolve) => env.real.setTimeout(resolve, ms));

  const interact = async (fn: () => void) => {
    await act(async () => {
      fn();
    });
    throwIfCrashed();
  };

  let current: { root: any; container: HTMLElement; component: any; boundaryKey: number } | null = null;

  const renderInto = async (component: any, props?: Record<string, unknown>) => {
    if (moduleError) throw new CheckFailure(`Your code threw while loading: ${moduleError.message}`);
    const container = doc.createElement("div");
    doc.body.appendChild(container);
    containers.push(container);
    const root = ReactDOM.createRoot(container);
    roots.push(root);
    current = { root, container, component, boundaryKey: 0 };
    await act(async () => {
      root.render(
        h(env.ErrorBoundary, { onError: (error: Error) => crashes.push(error) }, h(component, props ?? null)),
      );
    });
    throwIfCrashed();
    return container;
  };

  const fakeRun = (timer: FakeTimer) => {
    timer.fn(...timer.args);
  };

  const testApi: TestApi = {
    async render(component, props) {
      return renderInto(component ?? getComponent(exports), props);
    },
    async unmount() {
      if (!current) return;
      const { root } = current;
      await act(async () => root.unmount());
      current = null;
    },
    async renderHook(hook, initialProps) {
      const result = { current: undefined as any };
      function HookHost(props: { hookProps: unknown }) {
        result.current = hook(props.hookProps);
        return null;
      }
      await renderInto(HookHost, { hookProps: initialProps });
      const host = current!;
      return {
        result,
        async rerender(nextProps) {
          await act(async () => {
            host.root.render(
              h(
                env.ErrorBoundary,
                { onError: (error: Error) => crashes.push(error) },
                h(HookHost, { hookProps: nextProps }),
              ),
            );
          });
          throwIfCrashed();
        },
        async unmount() {
          await act(async () => host.root.unmount());
        },
      };
    },
    get exports() {
      if (moduleError) throw new CheckFailure(`Your code threw while loading: ${moduleError.message}`);
      return exports;
    },
    screen: createQueries(doc.body),
    within: (element) => createQueries(element),
    async click(element) {
      const el = element as HTMLElement;
      if ((el as HTMLButtonElement).disabled) return;
      await interact(() => {
        const init = { bubbles: true, cancelable: true, view: win };
        el.dispatchEvent(new win.MouseEvent("pointerdown", init));
        el.dispatchEvent(new win.MouseEvent("mousedown", init));
        if (typeof el.focus === "function") el.focus();
        el.dispatchEvent(new win.MouseEvent("pointerup", init));
        el.dispatchEvent(new win.MouseEvent("mouseup", init));
        if (typeof el.click === "function") el.click();
        else el.dispatchEvent(new win.MouseEvent("click", init));
      });
    },
    async type(element, text) {
      const el = element as HTMLInputElement;
      await interact(() => el.focus());
      for (const char of text) {
        await interact(() => {
          el.dispatchEvent(new win.KeyboardEvent("keydown", { key: char, bubbles: true, cancelable: true }));
          setNativeValue(win, el, el.value + char);
          el.dispatchEvent(new win.Event("input", { bubbles: true }));
          el.dispatchEvent(new win.KeyboardEvent("keyup", { key: char, bubbles: true }));
        });
      }
    },
    async clear(element) {
      const el = element as HTMLInputElement;
      await interact(() => {
        setNativeValue(win, el, "");
        el.dispatchEvent(new win.Event("input", { bubbles: true }));
      });
    },
    async change(element, value) {
      const el = element as HTMLInputElement;
      await interact(() => {
        setNativeValue(win, el, value);
        el.dispatchEvent(new win.Event("input", { bubbles: true }));
        el.dispatchEvent(new win.Event("change", { bubbles: true }));
      });
    },
    async keyDown(target, key) {
      await interact(() => {
        const event = new win.KeyboardEvent("keydown", { key, code: key, bubbles: true, cancelable: true });
        const notPrevented = target.dispatchEvent(event);
        target.dispatchEvent(new win.KeyboardEvent("keyup", { key, code: key, bubbles: true }));
        // Browsers submit a form when Enter is pressed in one of its text inputs.
        const el = target as HTMLInputElement;
        if (key === "Enter" && notPrevented && el.tagName === "INPUT" && el.form) {
          el.form.requestSubmit();
        }
      });
    },
    async submit(form) {
      await interact(() => (form as HTMLFormElement).requestSubmit());
    },
    async sleep(ms) {
      await act(async () => {
        await realSleep(ms);
      });
      throwIfCrashed();
    },
    async waitFor(fn, options = {}) {
      const timeout = options.timeout ?? 2000;
      const start = env.real.dateNow();
      let lastError: unknown;
      for (;;) {
        try {
          throwIfCrashed();
          return await fn();
        } catch (error) {
          lastError = error;
        }
        if (env.real.dateNow() - start > timeout) break;
        await act(async () => {
          await realSleep(25);
        });
      }
      if (options.message) throw new CheckFailure(options.message);
      throw lastError instanceof Error ? lastError : new CheckFailure(String(lastError));
    },
    useFakeTimers() {
      if (fake) return;
      fake = { now: env.real.dateNow(), timers: new Map(), nextId: 1_000_000 };
      const clock = fake;
      patch(win.Date, "now", () => clock.now);
    },
    async advanceTimers(ms) {
      if (!fake) throw new Error("Call t.useFakeTimers() before t.advanceTimers().");
      const clock = fake;
      const target = clock.now + ms;
      for (;;) {
        let next: FakeTimer | undefined;
        for (const timer of clock.timers.values()) {
          if (timer.at <= target && (!next || timer.at < next.at || (timer.at === next.at && timer.id < next.id))) {
            next = timer;
          }
        }
        if (!next) break;
        clock.now = next.at;
        if (next.interval) next.at += next.interval;
        else clock.timers.delete(next.id);
        const timer = next;
        await act(async () => fakeRun(timer));
        throwIfCrashed();
      }
      clock.now = target;
      await act(async () => {});
      throwIfCrashed();
    },
    pendingTimers() {
      return fake ? fake.timers.size : realTimers.size;
    },
    mockFetch(nextApi) {
      api = nextApi;
    },
    fetchCalls,
    logs,
    countLogs: (matcher: TextMatcher) =>
      logs.filter((line) => (typeof matcher === "string" ? line.includes(matcher) : matches(line, matcher))).length,
    clearLogs() {
      logs.length = 0;
    },
    get localStorage() {
      return win.localStorage;
    },
    document: doc,
    window: win,
    React,
    expect(actual, message) {
      return Object.assign(createExpect(actual, message, false), { not: createExpect(actual, message, true) });
    },
    assert(condition, message): asserts condition {
      if (!condition) throw new CheckFailure(message);
    },
    fail(message): never {
      throw new CheckFailure(message);
    },
    act: async (fn) => {
      await act(async () => {
        await fn();
      });
      throwIfCrashed();
    },
    get submitsWithoutPreventDefault() {
      return submitsWithoutPreventDefault;
    },
  };

  const cleanup = async () => {
    for (const root of roots.reverse()) {
      try {
        await act(async () => root.unmount());
      } catch {
        // The root may already be unmounted.
      }
    }
    for (const container of containers) container.remove();
    doc.body.innerHTML = "";
    for (const id of realTimers) {
      env.real.clearTimeout(id);
      env.real.clearInterval(id);
    }
    for (const [target, type, listener, options] of listeners) {
      target.removeEventListener(type, listener, options as EventListenerOptions);
    }
    win.removeEventListener("error", onError);
    win.removeEventListener("unhandledrejection", onRejection);
    win.removeEventListener("submit", onSubmit);
    for (const [target, key, descriptor] of patched.reverse()) {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else delete (target as Record<string, unknown>)[key];
    }
    try {
      win.localStorage.clear();
      win.sessionStorage.clear();
    } catch {
      // Ignore storage errors during cleanup.
    }
    doc.title = initialTitle;
  };

  return { api: testApi, cleanup };
}

function setNativeValue(win: SandboxEnv["win"], el: HTMLInputElement, value: string) {
  const proto =
    el.tagName === "TEXTAREA"
      ? win.HTMLTextAreaElement.prototype
      : el.tagName === "SELECT"
        ? win.HTMLSelectElement.prototype
        : win.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
}

function withTimeout<T>(env: SandboxEnv, promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = env.real.setTimeout(() => reject(new CheckFailure(`Timed out after ${ms}ms.`)), ms);
    promise.then(
      (value) => {
        env.real.clearTimeout(id);
        resolve(value);
      },
      (error) => {
        env.real.clearTimeout(id);
        reject(error);
      },
    );
  });
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as Error).message);
  return String(error);
}

export async function runCheck(
  env: SandboxEnv,
  code: string,
  check: { id: string; run: (t: TestApi) => unknown; timeoutMs?: number },
  defaultApi?: MockApi,
): Promise<CheckOutcome> {
  const context = createTestContext(env, code, defaultApi);
  try {
    await withTimeout(env, Promise.resolve().then(() => check.run(context.api)), check.timeoutMs ?? DEFAULT_TIMEOUT);
    return { id: check.id, passed: true };
  } catch (error) {
    return { id: check.id, passed: false, message: describeError(error) };
  } finally {
    await context.cleanup();
  }
}

export async function runChecks(
  env: SandboxEnv,
  payload: { code: string; checks: CheckPayload[]; mockApi?: string },
): Promise<{ smoke: CheckOutcome; results: CheckOutcome[] }> {
  env.win.IS_REACT_ACT_ENVIRONMENT = true;
  const defaultApi = payload.mockApi ? evaluateFunction<MockApi>(env, payload.mockApi) : undefined;

  const smoke = await runCheck(
    env,
    payload.code,
    {
      id: "__smoke__",
      run: async (t) => {
        await t.render();
        await t.sleep(30);
      },
    },
    defaultApi,
  );

  const results: CheckOutcome[] = [];
  for (const check of payload.checks) {
    let run: (t: TestApi) => unknown;
    try {
      run = evaluateFunction(env, check.source);
    } catch (error) {
      results.push({ id: check.id, passed: false, message: `Check could not be loaded: ${describeError(error)}` });
      continue;
    }
    results.push(await runCheck(env, payload.code, { id: check.id, run, timeoutMs: check.timeoutMs }, defaultApi));
  }
  return { smoke, results };
}
