import type { Binding, NodePath, Visitor } from "@babel/traverse";
import type * as T from "@babel/types";
import { FILENAME, toCompileError, type Babel, type CompileError } from "@/lib/compile";

export interface Range {
  start: number;
  end: number;
}

export interface MapInfo {
  line: number;
  elementName: string;
  hasKey: boolean;
  keyIsIndex: boolean;
  keyRange?: Range;
  itemParam?: string;
  indexParam?: string;
  /** Offset right after the element's tag name, where a key prop can be inserted. */
  keyInsertAt?: number;
  isFragment: boolean;
}

export interface EffectInfo {
  hook: string;
  line: number;
  hasDeps: boolean;
  deps: string[];
  depsRange?: Range;
  /** Offset right after the callback argument (to append a dependency array). */
  callbackEnd: number;
  /** Component-scope values the effect reads (state, props, derived values). */
  referenced: string[];
  missingDeps: string[];
  /** State variables whose setter the effect calls. */
  setsState: string[];
  hasCleanup: boolean;
  usesInterval: boolean;
  usesTimeout: boolean;
  usesFetch: boolean;
  listeners: { target: string; event: string; handler: string | null }[];
  intervalIds: string[];
  timeoutIds: string[];
  /** Offset of the callback body's closing brace, for inserting a cleanup. */
  bodyCloseAt?: number;
  bodyIndent: string;
}

export interface MutationInfo {
  line: number;
  stateName: string;
  /** state (incl. reducer state), a prop, or a module-level value shared by all renders. */
  kind: "state" | "prop" | "module";
  description: string;
  /** For `x.push(a); setX(x)` style code: the range to replace and a replacement. */
  fix?: { range: Range; text: string };
}

export interface Facts {
  hooks: Record<string, number>;
  functions: string[];
  components: string[];
  jsxNames: Record<string, number>;
  identifiers: string[];
  usesReactMemo: boolean;
  memoComponents: string[];
  createsContext: boolean;
  maps: MapInfo[];
  effects: EffectInfo[];
  mutations: MutationInfo[];
  setStateInRender: { line: number; setter: string }[];
  valueWithoutOnChange: { line: number; tag: string }[];
  controlledInputs: number;
  inlinePropsToMemo: { line: number; component: string; prop: string }[];
  directDom: { line: number; call: string }[];
}

export type AnalysisResult = { ok: true; facts: Facts } | { ok: false; error: CompileError };

const MUTATING_METHODS = new Set(["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin"]);
const DOM_QUERIES = new Set(["getElementById", "querySelector", "querySelectorAll", "getElementsByClassName", "getElementsByTagName"]);

function hookName(callee: T.Node): string | null {
  if (callee.type === "Identifier" && /^use[A-Z0-9]/.test(callee.name)) return callee.name;
  if (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    callee.object.name === "React" &&
    callee.property.type === "Identifier" &&
    /^use[A-Z]/.test(callee.property.name)
  ) {
    return callee.property.name;
  }
  return null;
}

function isCallTo(callee: T.Node, name: string): boolean {
  if (callee.type === "Identifier") return callee.name === name;
  return (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    callee.object.name === "React" &&
    callee.property.type === "Identifier" &&
    callee.property.name === name
  );
}

function jsxName(name: T.JSXOpeningElement["name"]): string {
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") return `${jsxName(name.object)}.${name.property.name}`;
  return `${name.namespace.name}:${name.name.name}`;
}

function unwrap(node: T.Node | null | undefined): T.Node | null | undefined {
  let current = node;
  while (current && (current.type === "ParenthesizedExpression" || current.type === "TSAsExpression")) {
    current = current.expression;
  }
  return current;
}

function isFunction(node: T.Node | null | undefined): node is T.ArrowFunctionExpression | T.FunctionExpression {
  return Boolean(node && (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression"));
}

function rootIdentifier(node: T.Node): string | null {
  let current: T.Node = node;
  while (current.type === "MemberExpression" || current.type === "OptionalMemberExpression") current = current.object;
  return current.type === "Identifier" ? current.name : null;
}

function lineOf(node: T.Node): number {
  return node.loc?.start.line ?? 0;
}

/** Returns statements returned directly by a function (not by nested functions). */
function returnedNodes(fn: T.ArrowFunctionExpression | T.FunctionExpression): T.Node[] {
  if (fn.body.type !== "BlockStatement") return [fn.body];
  const results: T.Node[] = [];
  const visit = (node: T.Node | null | undefined) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "ReturnStatement") {
      if (node.argument) results.push(node.argument);
      return;
    }
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      return;
    }
    for (const key of Object.keys(node) as (keyof typeof node)[]) {
      if (key === "loc" || key === "leadingComments" || key === "trailingComments") continue;
      const value = node[key] as unknown;
      if (Array.isArray(value)) value.forEach((child) => visit(child as T.Node));
      else if (value && typeof value === "object" && "type" in (value as object)) visit(value as T.Node);
    }
  };
  fn.body.body.forEach(visit);
  return results;
}

function jsxRoots(node: T.Node | null | undefined): (T.JSXElement | T.JSXFragment)[] {
  const n = unwrap(node);
  if (!n) return [];
  if (n.type === "JSXElement" || n.type === "JSXFragment") return [n];
  if (n.type === "ConditionalExpression") return [...jsxRoots(n.consequent), ...jsxRoots(n.alternate)];
  if (n.type === "LogicalExpression") return jsxRoots(n.right);
  return [];
}

export function analyzeWith(babel: Babel, code: string): AnalysisResult {
  const facts: Facts = {
    hooks: {},
    functions: [],
    components: [],
    jsxNames: {},
    identifiers: [],
    usesReactMemo: false,
    memoComponents: [],
    createsContext: false,
    maps: [],
    effects: [],
    mutations: [],
    setStateInRender: [],
    valueWithoutOnChange: [],
    controlledInputs: 0,
    inlinePropsToMemo: [],
    directDom: [],
  };

  const identifiers = new Set<string>();
  const stateBindings = new Map<Binding, string>();
  const setterBindings = new Map<Binding, string>();
  const stableBindings = new Set<Binding>();
  const functionBindings = new Set<Binding>();
  const memoComponents = new Set<string>();
  const src = (node: T.Node) => code.slice(node.start ?? 0, node.end ?? 0);

  const collect: Visitor = {
    VariableDeclarator(path) {
      const { id, init } = path.node;
      const initNode = unwrap(init);
      if (id.type === "Identifier" && isFunction(initNode)) {
        facts.functions.push(id.name);
        const binding = path.scope.getBinding(id.name);
        if (binding) functionBindings.add(binding);
      }
      if (!initNode || initNode.type !== "CallExpression") return;
      const callee = initNode.callee;
      if ((isCallTo(callee, "useState") || isCallTo(callee, "useReducer")) && id.type === "ArrayPattern") {
        const [value, setter] = id.elements;
        if (value?.type === "Identifier") {
          const binding = path.scope.getBinding(value.name);
          if (binding) stateBindings.set(binding, value.name);
        }
        if (setter?.type === "Identifier") {
          const binding = path.scope.getBinding(setter.name);
          if (binding) {
            setterBindings.set(binding, value?.type === "Identifier" ? value.name : setter.name);
            stableBindings.add(binding);
          }
        }
      }
      if (isCallTo(callee, "useRef") && id.type === "Identifier") {
        const binding = path.scope.getBinding(id.name);
        if (binding) stableBindings.add(binding);
      }
      if ((isCallTo(callee, "memo") || isCallTo(callee, "forwardRef")) && id.type === "Identifier") {
        facts.functions.push(id.name);
        if (isCallTo(callee, "memo")) memoComponents.add(id.name);
      }
    },
    FunctionDeclaration(path) {
      if (path.node.id) {
        facts.functions.push(path.node.id.name);
        const binding = path.parentPath.scope.getBinding(path.node.id.name);
        if (binding) functionBindings.add(binding);
      }
    },
    CallExpression(path) {
      // Updater callbacks: setTodos((prev) => ...) — `prev` is state too.
      const { callee, arguments: args } = path.node;
      if (callee.type !== "Identifier") return;
      const binding = path.scope.getBinding(callee.name);
      if (!binding || !setterBindings.has(binding)) return;
      const fnPath = path.get("arguments.0") as NodePath;
      const fn = args[0];
      if (isFunction(fn) && fn.params[0]?.type === "Identifier") {
        const paramBinding = fnPath.scope.getBinding(fn.params[0].name);
        if (paramBinding) stateBindings.set(paramBinding, setterBindings.get(binding)!);
      }
    },
  };

  /** What kind of shared value `name` is, if mutating it in place is a bug. */
  const mutationTarget = (path: NodePath, name: string): MutationInfo["kind"] | null => {
    const binding = path.scope.getBinding(name);
    if (!binding) return null;
    if (stateBindings.has(binding)) return "state";
    if (binding.kind !== "module" && binding.scope.path.isProgram() && path.scope.getFunctionParent()) return "module";
    if (binding.kind === "param") {
      const fn = binding.scope.path;
      const node = fn.node as { id?: T.Identifier | null };
      let fnName = node.id?.name ?? "";
      if (!fnName && fn.parentPath?.isVariableDeclarator()) {
        const id = (fn.parentPath.node as T.VariableDeclarator).id;
        if (id.type === "Identifier") fnName = id.name;
      }
      if (/^[A-Z]/.test(fnName) || /reducer$/i.test(fnName)) return /reducer$/i.test(fnName) ? "state" : "prop";
    }
    return null;
  };

  const analyzeEffect = (path: NodePath<T.CallExpression>, hook: string) => {
    const [callbackNode, depsNode] = path.node.arguments;
    if (!isFunction(callbackNode)) return;
    const callbackPath = path.get("arguments.0") as NodePath<T.ArrowFunctionExpression | T.FunctionExpression>;
    const ownerScope = path.scope.getFunctionParent();

    const referenced = new Set<string>();
    const setsState = new Set<string>();
    const listeners: EffectInfo["listeners"] = [];
    const intervalIds: string[] = [];
    const timeoutIds: string[] = [];
    let usesInterval = false;
    let usesTimeout = false;
    let usesFetch = false;

    callbackPath.traverse({
      Identifier(idPath) {
        if (!idPath.isReferencedIdentifier()) return;
        const binding = idPath.scope.getBinding(idPath.node.name);
        if (!binding || !ownerScope || binding.scope !== ownerScope) return;
        if (setterBindings.has(binding) || stableBindings.has(binding) || functionBindings.has(binding)) return;
        if (binding.kind === "module") return;
        referenced.add(idPath.node.name);
      },
      CallExpression(callPath) {
        const callee = callPath.node.callee;
        if (callee.type === "Identifier") {
          const binding = callPath.scope.getBinding(callee.name);
          if (binding && setterBindings.has(binding)) setsState.add(setterBindings.get(binding)!);
          if (callee.name === "setInterval") usesInterval = true;
          if (callee.name === "setTimeout") usesTimeout = true;
          if (callee.name === "fetch") usesFetch = true;
          const parent = callPath.parent;
          if (
            (callee.name === "setInterval" || callee.name === "setTimeout") &&
            parent.type === "VariableDeclarator" &&
            parent.id.type === "Identifier"
          ) {
            (callee.name === "setInterval" ? intervalIds : timeoutIds).push(parent.id.name);
          }
        }
        if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
          if (callee.property.name === "addEventListener" || callee.property.name === "subscribe") {
            const [eventArg, handlerArg] = callPath.node.arguments;
            listeners.push({
              target: src(callee.object),
              event: eventArg ? src(eventArg) : "''",
              handler: handlerArg?.type === "Identifier" ? handlerArg.name : null,
            });
          }
          if (callee.property.name === "fetch") usesFetch = true;
        }
      },
    });

    let hasCleanup = false;
    if (callbackNode.body.type === "BlockStatement") {
      hasCleanup = returnedNodes(callbackNode).some(
        (node) => isFunction(unwrap(node)) || unwrap(node)?.type === "Identifier",
      );
    } else {
      hasCleanup = isFunction(unwrap(callbackNode.body));
    }

    const deps: string[] = [];
    let depsRange: Range | undefined;
    const depRoots = new Set<string>();
    if (depsNode && depsNode.type === "ArrayExpression") {
      depsRange = { start: depsNode.start!, end: depsNode.end! };
      for (const element of depsNode.elements) {
        if (!element) continue;
        deps.push(src(element));
        const root = rootIdentifier(element);
        if (root) depRoots.add(root);
      }
    }

    const missingDeps =
      depsNode && depsNode.type === "ArrayExpression" ? [...referenced].filter((name) => !depRoots.has(name)) : [];

    let bodyIndent = "  ";
    let bodyCloseAt: number | undefined;
    if (callbackNode.body.type === "BlockStatement") {
      bodyCloseAt = callbackNode.body.end! - 1;
      const first = callbackNode.body.body[0];
      if (first?.start != null) {
        const start = first.start;
        const lineStart = code.lastIndexOf("\n", start - 1) + 1;
        bodyIndent = code.slice(lineStart, start).match(/^\s*/)?.[0] ?? "  ";
      }
    }

    facts.effects.push({
      hook,
      line: lineOf(path.node),
      hasDeps: Boolean(depsNode),
      deps,
      depsRange,
      callbackEnd: callbackNode.end!,
      referenced: [...referenced],
      missingDeps,
      setsState: [...setsState],
      hasCleanup,
      usesInterval,
      usesTimeout,
      usesFetch,
      listeners,
      intervalIds,
      timeoutIds,
      bodyCloseAt,
      bodyIndent,
    });
  };

  const analyzeMap = (path: NodePath<T.CallExpression>) => {
    const fn = path.node.arguments[0];
    if (!isFunction(fn)) return;
    const itemParam = fn.params[0]?.type === "Identifier" ? fn.params[0].name : undefined;
    const indexParam = fn.params[1]?.type === "Identifier" ? fn.params[1].name : undefined;
    for (const root of returnedNodes(fn).flatMap(jsxRoots)) {
      if (root.type === "JSXFragment") {
        facts.maps.push({
          line: lineOf(root),
          elementName: "<>",
          hasKey: false,
          keyIsIndex: false,
          itemParam,
          indexParam,
          isFragment: true,
        });
        continue;
      }
      const opening = root.openingElement;
      const keyAttr = opening.attributes.find(
        (attr): attr is T.JSXAttribute => attr.type === "JSXAttribute" && attr.name.name === "key",
      );
      let keyIsIndex = false;
      let keyRange: Range | undefined;
      if (keyAttr?.value?.type === "JSXExpressionContainer" && keyAttr.value.expression.type !== "JSXEmptyExpression") {
        const expr = keyAttr.value.expression;
        keyRange = { start: expr.start!, end: expr.end! };
        if (indexParam) keyIsIndex = new RegExp(`\\b${indexParam}\\b`).test(src(expr));
      }
      facts.maps.push({
        line: lineOf(root),
        elementName: jsxName(opening.name),
        hasKey: Boolean(keyAttr),
        keyIsIndex,
        keyRange,
        itemParam,
        indexParam,
        keyInsertAt: opening.name.end!,
        isFragment: false,
      });
    }
  };

  const analyzeMutation = (path: NodePath<T.CallExpression>) => {
    const callee = path.node.callee;
    if (callee.type !== "MemberExpression" || callee.property.type !== "Identifier") return;
    if (!MUTATING_METHODS.has(callee.property.name) || callee.object.type !== "Identifier") return;
    const name = callee.object.name;
    const kind = mutationTarget(path, name);
    if (!kind) return;

    let fix: MutationInfo["fix"];
    const statement = path.parentPath;
    if (callee.property.name === "push" && statement?.isExpressionStatement()) {
      const container = statement.container;
      const index = statement.key;
      if (Array.isArray(container) && typeof index === "number") {
        const next = container[index + 1] as T.Statement | undefined;
        if (
          next?.type === "ExpressionStatement" &&
          next.expression.type === "CallExpression" &&
          next.expression.callee.type === "Identifier"
        ) {
          const setterName = next.expression.callee.name;
          const setterBinding = path.scope.getBinding(setterName);
          const arg = next.expression.arguments[0];
          const passesSame =
            (arg?.type === "Identifier" && arg.name === name) ||
            (arg?.type === "ArrayExpression" &&
              arg.elements.length === 1 &&
              arg.elements[0]?.type === "SpreadElement" &&
              arg.elements[0].argument.type === "Identifier" &&
              arg.elements[0].argument.name === name);
          if (setterBinding && setterBindings.has(setterBinding) && passesSame) {
            const pushed = path.node.arguments.map(src).join(", ");
            fix = {
              range: { start: statement.node.start!, end: next.end! },
              text: `${setterName}([...${name}, ${pushed}]);`,
            };
          }
        }
      }
    }

    facts.mutations.push({
      line: lineOf(path.node),
      stateName: name,
      kind,
      description: `\`${name}.${callee.property.name}()\``,
      fix,
    });
  };

  const main: Visitor = {
    Identifier(path) {
      identifiers.add(path.node.name);
    },
    CallExpression(path) {
      const { callee } = path.node;
      const hook = hookName(callee);
      if (hook) {
        facts.hooks[hook] = (facts.hooks[hook] ?? 0) + 1;
        if (hook === "useEffect" || hook === "useLayoutEffect") analyzeEffect(path, hook);
      }
      if (isCallTo(callee, "memo")) facts.usesReactMemo = true;
      if (isCallTo(callee, "createContext")) facts.createsContext = true;
      if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
        if (callee.property.name === "map") analyzeMap(path);
        if (
          DOM_QUERIES.has(callee.property.name) &&
          callee.object.type === "Identifier" &&
          callee.object.name === "document"
        ) {
          facts.directDom.push({ line: lineOf(path.node), call: `document.${callee.property.name}` });
        }
      }
      analyzeMutation(path);

      if (callee.type === "Identifier") {
        const binding = path.scope.getBinding(callee.name);
        if (binding && setterBindings.has(binding)) {
          const callFn = path.scope.getFunctionParent();
          const ownerFn = binding.scope.getFunctionParent();
          if (callFn && callFn === ownerFn) {
            facts.setStateInRender.push({ line: lineOf(path.node), setter: callee.name });
          }
        }
      }
    },
    AssignmentExpression(path) {
      const left = path.node.left;
      if (left.type !== "MemberExpression") return;
      const root = rootIdentifier(left);
      if (!root) return;
      const kind = mutationTarget(path, root);
      if (kind) {
        facts.mutations.push({
          line: lineOf(path.node),
          stateName: root,
          kind,
          description: `\`${src(left)} = …\``,
        });
      }
    },
    JSXOpeningElement(path) {
      const name = jsxName(path.node.name);
      facts.jsxNames[name] = (facts.jsxNames[name] ?? 0) + 1;
      const attrs = path.node.attributes.filter((attr): attr is T.JSXAttribute => attr.type === "JSXAttribute");
      const has = (attr: string) => attrs.some((a) => a.name.name === attr);
      const hasSpread = path.node.attributes.some((attr) => attr.type === "JSXSpreadAttribute");

      if (["input", "textarea", "select"].includes(name)) {
        const controlledProp = has("value") || has("checked");
        if (controlledProp && (has("onChange") || hasSpread)) facts.controlledInputs++;
        else if (controlledProp && !has("readOnly") && !hasSpread) {
          facts.valueWithoutOnChange.push({ line: lineOf(path.node), tag: name });
        }
      }

      if (memoComponents.has(name)) {
        for (const attr of attrs) {
          if (attr.value?.type !== "JSXExpressionContainer") continue;
          const expr = attr.value.expression;
          if (
            expr.type === "ArrowFunctionExpression" ||
            expr.type === "FunctionExpression" ||
            expr.type === "ObjectExpression" ||
            expr.type === "ArrayExpression"
          ) {
            facts.inlinePropsToMemo.push({ line: lineOf(path.node), component: name, prop: String(attr.name.name) });
          }
        }
      }
    },
  };

  const plugin = () => ({
    visitor: {
      Program(path: NodePath<T.Program>) {
        path.traverse(collect);
        path.traverse(main);
      },
    },
  });

  try {
    babel.transform(code, {
      filename: FILENAME,
      sourceType: "module",
      parserOpts: { plugins: ["jsx"] },
      plugins: [plugin],
      code: false,
      ast: false,
    });
  } catch (error) {
    return { ok: false, error: toCompileError(error) };
  }

  facts.identifiers = [...identifiers];
  facts.memoComponents = [...memoComponents];
  facts.functions = [...new Set(facts.functions)];
  facts.components = facts.functions.filter((name) => /^[A-Z]/.test(name));
  return { ok: true, facts };
}
