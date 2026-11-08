import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { rust } from "@codemirror/lang-rust";
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import {
  FlaskConical,
  LoaderCircle,
  Play,
  RotateCcw,
  Square,
  Terminal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Question } from "../../entities/curriculum/model";
import { tabStorage } from "../../shared/storage/browser";
import type { RunResult } from "./api";
import { practiceApi } from "./api";

function SourceEditor({
  value,
  onChange,
  language,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  language: string;
  label: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const change = useRef(onChange);
  change.current = onChange;
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          highlightActiveLine(),
          bracketMatching(),
          indentOnInput(),
          syntaxHighlighting(
            HighlightStyle.define([
              { tag: tags.keyword, color: "#c8a8e9" },
              { tag: [tags.string, tags.character], color: "#b7ce9d" },
              { tag: [tags.number, tags.bool, tags.null], color: "#e7b88a" },
              { tag: tags.comment, color: "#999f9a", fontStyle: "italic" },
              { tag: [tags.typeName, tags.className], color: "#e3cf9b" },
              { tag: tags.function(tags.variableName), color: "#a5c8eb" },
              { tag: tags.meta, color: "#b1bbc8" },
            ]),
          ),
          language === "go" ? go() : language === "rust" ? rust() : cpp(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.contentAttributes.of({
            "aria-label": label,
            spellcheck: "false",
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) change.current(update.state.doc.toString());
          }),
          EditorView.theme(
            {
              "&": {
                backgroundColor: "#191919",
                color: "#dedede",
                fontSize: "13px",
              },
              ".cm-content": {
                fontFamily: "var(--mono)",
                padding: "16px 0",
                minHeight: "340px",
                caretColor: "#e8e8e8",
              },
              ".cm-scroller": {
                overflow: "auto",
                maxHeight: "560px",
                lineHeight: "1.7",
              },
              ".cm-gutters": {
                backgroundColor: "#191919",
                color: "#777",
                borderRight: "1px solid #303030",
              },
              ".cm-activeLine, .cm-activeLineGutter": {
                backgroundColor: "#ffffff06",
              },
              "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
                backgroundColor: "#55555588 !important",
              },
              ".cm-cursor": { borderLeftColor: "#eee" },
              "&.cm-focused": {
                outline: "2px solid #999",
                outlineOffset: "-2px",
              },
            },
            { dark: true },
          ),
        ],
      }),
    });
    editor.current = view;
    return () => {
      view.destroy();
      editor.current = null;
    };
    // The external-value effect below synchronizes resets without rebuilding the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, label]);
  useEffect(() => {
    const view = editor.current;
    if (view && view.state.doc.toString() !== value)
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
  }, [value]);
  return <div ref={host} className="source-editor" />;
}

export function CodeWorkspace({
  question,
  value,
  onChange,
  storageKey,
}: {
  question: Question;
  value: string;
  onChange: (code: string) => void;
  storageKey: string;
}) {
  const [file, setFile] = useState<"source" | "tests">("source");
  const [tests, setTests] = useState(() => {
    try {
      return tabStorage.read(storageKey + ":tests") ?? question.tests ?? "";
    } catch {
      return question.tests ?? "";
    }
  });
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState<"run" | "test" | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [lastMode, setLastMode] = useState<"run" | "test">("run");
  const controller = useRef<AbortController | null>(null);
  const language = question.language || "";
  const executable = ["go", "rust", "cpp"].includes(language);
  const extension =
    language === "go" ? "go" : language === "rust" ? "rs" : "cpp";
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );
  useEffect(() => {
    try {
      tabStorage.write(storageKey + ":tests", tests);
    } catch {
      /* Optional storage. */
    }
  }, [tests, storageKey]);
  async function run(mode: "run" | "test") {
    if (controller.current) return;
    const abort = new AbortController();
    controller.current = abort;
    setRunning(mode);
    setLastMode(mode);
    setError("");
    setResult(null);
    setSnapshot(JSON.stringify([value, tests]));
    try {
      const output = await practiceApi.execute(
        question.id,
        { code: value, tests, mode },
        abort.signal,
      );
      if (!abort.signal.aborted) setResult(output);
    } catch (e) {
      if (!abort.signal.aborted) setError((e as Error).message);
    } finally {
      if (controller.current === abort) {
        controller.current = null;
        setRunning(null);
      }
    }
  }
  function stop() {
    controller.current?.abort();
    controller.current = null;
    setRunning(null);
    setError("Execution stopped.");
  }
  if (!executable)
    return (
      <div className="text-answer code-answer">
        <div className="editor-toolbar">Pseudocode · written exercise</div>
        <textarea
          aria-label="Your implementation"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  const stale = !!result && snapshot !== JSON.stringify([value, tests]);
  return (
    <div className="code-workspace">
      <div className="workspace-toolbar">
        <span className="runtime-language">
          <span className="online-dot" />
          {language === "cpp"
            ? "C++20"
            : language === "go"
              ? "Go 1.24"
              : "Rust 1.85"}
        </span>
        <div>
          <button
            type="button"
            title="Restore the open file to its starter code"
            disabled={!!running}
            onClick={() => {
              if (
                window.confirm(
                  "Restore this file to its starter code? Your edits to this file will be replaced.",
                )
              ) {
                if (file === "source") onChange(question.code || "");
                else setTests(question.tests || "");
              }
            }}
          >
            <RotateCcw size={14} />
            Reset file
          </button>
          {running ? (
            <button type="button" onClick={stop}>
              <Square size={14} />
              Stop
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => run("run")}
                disabled={!value.trim()}
              >
                <Play size={14} />
                Run
              </button>
              <button
                type="button"
                className="run-tests"
                onClick={() => run("test")}
                disabled={!value.trim() || !tests.trim()}
              >
                <FlaskConical size={14} />
                Run tests
              </button>
            </>
          )}
        </div>
      </div>
      <div className="workspace-files" role="tablist" aria-label="Code files">
        <button
          type="button"
          role="tab"
          id="source-tab"
          aria-controls="source-panel"
          aria-selected={file === "source"}
          onClick={() => setFile("source")}
        >
          main.{extension}
        </button>
        <button
          type="button"
          role="tab"
          id="tests-tab"
          aria-controls="tests-panel"
          aria-selected={file === "tests"}
          onClick={() => setFile("tests")}
        >
          {language === "go" ? "main_test.go" : "tests." + extension}
          <span>EXAMPLES</span>
        </button>
      </div>
      <div role="tabpanel" id={file + "-panel"} aria-labelledby={file + "-tab"}>
        <SourceEditor
          key={file}
          value={file === "source" ? value : tests}
          onChange={file === "source" ? onChange : setTests}
          language={language}
          label={
            file === "source" ? "Your implementation" : "Editable example tests"
          }
        />
      </div>
      <div className="editor-help">
        Tab indents · Press Escape, then Tab to leave the editor
      </div>
      <div
        className="execution-console"
        aria-live="polite"
        aria-busy={!!running}
      >
        <div className="console-heading">
          <span>
            <Terminal size={14} />
            Output
          </span>
          <span
            className={
              result && !stale && result.exitCode === 0
                ? "execution-success"
                : ""
            }
          >
            {running ? (
              <>
                <LoaderCircle size={13} className="spin" />
                {running === "test" ? "Testing…" : "Running…"}
              </>
            ) : stale ? (
              "Code changed · run again"
            ) : result ? (
              `${result.timedOut ? "Time limit reached" : result.exitCode === 0 ? (lastMode === "test" ? "Example tests passed" : "Finished") : "Failed"} · ${(result.durationMs / 1000).toFixed(2)}s`
            ) : (
              "Ready"
            )}
          </span>
        </div>
        <pre>
          {error ||
            result?.output ||
            (result
              ? "Process completed with no output."
              : "Run your implementation or test it against the editable example cases.")}
        </pre>
        {result?.truncated && <p>Output limited to 64 KiB.</p>}
      </div>
      <p className="runtime-note">
        20-second limit · Standard library only. Example tests check behavior;
        use the reflection to assess reasoning and concurrency guarantees.
      </p>
    </div>
  );
}
