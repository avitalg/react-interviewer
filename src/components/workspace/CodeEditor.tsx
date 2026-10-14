"use client";

import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { indentUnit } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import { useTheme } from "@/lib/theme";

const lightTheme = EditorView.theme({
  "&": { backgroundColor: "var(--surface)" },
  ".cm-gutters": { backgroundColor: "var(--surface)", borderRight: "1px solid var(--border)", color: "var(--muted)" },
});

const spacingTheme = EditorView.theme({
  ".cm-content": { padding: "10px 0" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 16px" },
  ".cm-line": { padding: "0 16px 0 12px" },
});

export function CodeEditor({
  value,
  onChange,
  onSave,
  onReady,
  readOnly = false,
  ariaLabel = "Code editor",
}: {
  value: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  onReady?: (view: EditorView) => void;
  readOnly?: boolean;
  ariaLabel?: string;
}) {
  const theme = useTheme();
  const extensions = useMemo(
    () => [
      javascript({ jsx: true }),
      indentUnit.of("  "),
      keymap.of([
        indentWithTab,
        {
          key: "Mod-s",
          preventDefault: true,
          stopPropagation: true,
          run: () => {
            onSave?.();
            return true;
          },
        },
      ]),
      EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
      spacingTheme,
      ...(theme === "light" ? [lightTheme] : []),
    ],
    [theme, ariaLabel, onSave],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      onCreateEditor={onReady}
      theme={theme === "dark" ? oneDark : "light"}
      extensions={extensions}
      editable={!readOnly}
      readOnly={readOnly}
      height="100%"
      className="h-full"
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        indentOnInput: true,
        tabSize: 2,
      }}
    />
  );
}
