import { Code2 } from "lucide-react";

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  return (
    <div className="code-block">
      <div>
        <span>
          <Code2 size={13} />
          {language || "code"}
        </span>
        <span>READ & REASON</span>
      </div>
      <pre>
        <code>
          {code.split("\n").map((line, i) => (
            <span className="code-line" key={i}>
              <span className="line-number">{i + 1}</span>
              <span>{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
