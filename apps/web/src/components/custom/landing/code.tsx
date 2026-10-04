import type { ReactNode } from "react";

/**
 * A deliberately tiny syntax highlighter for the marketing snippets: strings,
 * comments, keywords, numbers, types and JSX tags. No dependencies.
 */

const KEYWORDS = new Set(
  "import from export default function return const let type interface async await if else for of new null undefined true false".split(
    " ",
  ),
);

const TOKEN =
  /(\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?\b|<\/?[A-Za-z][\w.]*|\b[A-Za-z_]\w*\b|@[\w./]+)/gm;

export function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const [tok] = m;
    const i = m.index ?? 0;
    if (i > last) out.push(line.slice(last, i));
    let cls = "";
    if (tok.startsWith("//")) cls = "text-dim italic";
    else if (/^["'`]/.test(tok)) cls = "text-acid";
    else if (/^\d/.test(tok) || tok.startsWith("@")) cls = "text-[#F5B971]";
    else if (tok.startsWith("<")) cls = "text-teal";
    else if (KEYWORDS.has(tok)) cls = "text-[#C792EA]";
    else if (/^[A-Z]/.test(tok)) cls = "text-teal";
    else if (line[i + tok.length] === "(") cls = "text-[#82AAFF]";
    out.push(
      cls ? (
        <span key={i} className={cls}>
          {tok}
        </span>
      ) : (
        tok
      ),
    );
    last = i + tok.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}
