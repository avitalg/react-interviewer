/** Matches text content (normalized whitespace) or an accessible name. Strings match case-insensitively. */
export type TextMatcher = string | RegExp;

export interface RoleOptions {
  name?: TextMatcher;
}

export interface Queries {
  getByText(text: TextMatcher): HTMLElement;
  queryByText(text: TextMatcher): HTMLElement | null;
  getAllByText(text: TextMatcher): HTMLElement[];
  queryAllByText(text: TextMatcher): HTMLElement[];
  getByRole(role: string, options?: RoleOptions): HTMLElement;
  queryByRole(role: string, options?: RoleOptions): HTMLElement | null;
  getAllByRole(role: string, options?: RoleOptions): HTMLElement[];
  queryAllByRole(role: string, options?: RoleOptions): HTMLElement[];
  getByTestId(id: string): HTMLElement;
  queryByTestId(id: string): HTMLElement | null;
  getAllByTestId(id: string): HTMLElement[];
  queryAllByTestId(id: string): HTMLElement[];
  getByLabelText(text: TextMatcher): HTMLElement;
  queryByLabelText(text: TextMatcher): HTMLElement | null;
  getByPlaceholderText(text: TextMatcher): HTMLElement;
  queryByPlaceholderText(text: TextMatcher): HTMLElement | null;
  $(selector: string): HTMLElement | null;
  $$(selector: string): HTMLElement[];
}

export interface MockResponse {
  status?: number;
  body?: unknown;
  /** Response delay in ms (real time). */
  delay?: number;
}

/** A fake backend: receives the requested URL and returns a response. Must be self-contained (it is serialized). */
export type MockApi = (url: URL, init?: RequestInit) => MockResponse | Promise<MockResponse>;

export interface FetchCall {
  url: string;
  init?: RequestInit;
  signal?: AbortSignal | null;
}

export interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toContain(expected: unknown): void;
  toMatch(expected: RegExp | string): void;
  toHaveLength(expected: number): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
}

export interface HookResult<T> {
  result: { current: T };
  rerender(props?: unknown): Promise<void>;
  unmount(): Promise<void>;
}

/**
 * The API available to runtime checks. Checks run inside the sandbox, so they must be
 * self-contained functions that only use this API (no outer variables or imports).
 */
export interface TestApi {
  /** Renders the user's default export (or the given component) into a fresh container. */
  render(component?: unknown, props?: Record<string, unknown>): Promise<HTMLElement>;
  unmount(): Promise<void>;
  /** Renders a custom hook exported by the user's module. */
  renderHook<T = unknown>(hook: (props?: unknown) => T, initialProps?: unknown): Promise<HookResult<T>>;
  /** Exports of the user's module (fresh for every check). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly exports: Record<string, any>;
  screen: Queries;
  within(element: Element): Queries;
  click(element: Element): Promise<void>;
  /** Types text one character at a time, firing input events like a real user. */
  type(element: Element, text: string): Promise<void>;
  clear(element: Element): Promise<void>;
  /** Sets a value in one go (useful for <select> and number inputs). */
  change(element: Element, value: string): Promise<void>;
  keyDown(element: Element | Document | Window, key: string): Promise<void>;
  submit(form: Element): Promise<void>;
  /** Waits real time while flushing React updates. */
  sleep(ms: number): Promise<void>;
  waitFor<T>(fn: () => T | Promise<T>, options?: { timeout?: number; message?: string }): Promise<T>;
  /** Replaces setTimeout/setInterval/Date.now with a controllable clock. Call before render(). */
  useFakeTimers(): void;
  advanceTimers(ms: number): Promise<void>;
  /** Timers (timeouts and intervals) started by the user's code that are still scheduled. */
  pendingTimers(): number;
  /** Wraps updates triggered outside of React events (e.g. calling a hook's setter) in act(). */
  act(fn: () => unknown): Promise<void>;
  mockFetch(api: MockApi): void;
  fetchCalls: FetchCall[];
  /** Forms submitted without event.preventDefault() (the page would have reloaded). */
  readonly submitsWithoutPreventDefault: number;
  logs: string[];
  countLogs(matcher: TextMatcher): number;
  clearLogs(): void;
  localStorage: Storage;
  document: Document;
  window: Window;
  React: unknown;
  expect(actual: unknown, message?: string): Matchers & { not: Matchers };
  assert(condition: unknown, message: string): asserts condition;
  fail(message: string): never;
}

export interface CheckPayload {
  id: string;
  source: string;
  timeoutMs?: number;
}

export interface CheckOutcome {
  id: string;
  passed: boolean;
  message?: string;
}

export interface SandboxError {
  name: string;
  message: string;
  stack?: string;
  /** module: import/evaluation; render: thrown while rendering; runtime: after mount (events, timers, promises). */
  phase: "module" | "render" | "runtime";
}

export type ParentToSandbox =
  | { type: "run"; runId: number; code: string; mockApi?: string }
  | { type: "test"; runId: number; code: string; checks: CheckPayload[]; mockApi?: string };

export type SandboxToParent =
  | { type: "ready" }
  | { type: "rendered"; runId: number }
  | { type: "error"; runId: number; error: SandboxError }
  | { type: "testResults"; runId: number; smoke: CheckOutcome; results: CheckOutcome[] };
