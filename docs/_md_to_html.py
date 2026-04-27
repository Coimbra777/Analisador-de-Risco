#!/usr/bin/env python3
"""Minimal MD→HTML for the course doc (headings, bold, code, lists, tables, pre, hr)."""
import html
import re
import sys


def convert(md: str) -> str:
    lines = md.splitlines()
    out: list[str] = []
    i = 0
    in_ul = False
    in_ol = False
    in_pre = False
    pre_buf: list[str] = []

    def close_lists():
        nonlocal in_ul, in_ol
        if in_ul:
            out.append("</ul>")
            in_ul = False
        if in_ol:
            out.append("</ol>")
            in_ol = False

    def inline(s: str) -> str:
        s = html.escape(s)
        s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
        s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
        s = s.replace("*", "&#42;")
        s = s.replace("&#42;&#42;", "**")
        s = s.replace("&#42;", "<em>", 1) if s.count("em") < 0 else s
        return s

    def fix_inline_bold_code(t: str) -> str:
        t = html.escape(t)
        t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
        t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
        t = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", t)
        return t

    while i < len(lines):
        line = lines[i]
        if line.strip().startswith("```"):
            if in_pre:
                out.append(
                    "<pre><code>" + html.escape("\n".join(pre_buf)) + "</code></pre>"
                )
                pre_buf = []
                in_pre = False
            else:
                close_lists()
                in_pre = True
            i += 1
            continue
        if in_pre:
            pre_buf.append(line)
            i += 1
            continue

        if line.strip() == "---":
            close_lists()
            out.append("<hr/>")
            i += 1
            continue

        if re.match(r"^\|.*\|", line) and "|" in line[1:]:
            close_lists()
            rows = []
            while i < len(lines) and "|" in lines[i]:
                rows.append(lines[i])
                i += 1
            if len(rows) >= 2 and re.match(r"^[\s|:-]+$", rows[1]):
                header = [c.strip() for c in rows[0].strip("|").split("|")]
                out.append("<table><thead><tr>")
                for h in header:
                    out.append(f"<th>{fix_inline_bold_code(h)}</th>")
                out.append("</tr></thead><tbody>")
                for row in rows[2:]:
                    cells = [c.strip() for c in row.strip("|").split("|")]
                    out.append("<tr>")
                    for c in cells:
                        out.append(f"<td>{fix_inline_bold_code(c)}</td>")
                    out.append("</tr>")
                out.append("</tbody></table>")
            i -= 0
            continue

        m = re.match(r"^(#{1,3})\s+(.*)$", line)
        if m:
            close_lists()
            level = len(m.group(1))
            text = m.group(2)
            if level == 1:
                out.append(f"<h1>{fix_inline_bold_code(text)}</h1>")
            elif level == 2:
                out.append(f"<h2>{fix_inline_bold_code(text)}</h2>")
            else:
                out.append(f"<h3>{fix_inline_bold_code(text)}</h3>")
            i += 1
            continue

        m = re.match(r"^[-*]\s+(.+)$", line)
        if m:
            if not in_ul:
                close_lists()
                out.append("<ul>")
                in_ul = True
            out.append(f"<li>{fix_inline_bold_code(m.group(1))}</li>")
            i += 1
            continue

        if re.match(r"^\d+\.\s", line):
            if not in_ol:
                close_lists()
                out.append("<ol>")
                in_ol = True
            text = re.sub(r"^\d+\.\s+", "", line)
            out.append(f"<li>{fix_inline_bold_code(text)}</li>")
            i += 1
            continue

        if line.strip() == "":
            close_lists()
            i += 1
            continue

        close_lists()
        out.append(f"<p>{fix_inline_bold_code(line)}</p>")
        i += 1

    close_lists()
    if in_pre and pre_buf:
        out.append("<pre><code>" + html.escape("\n".join(pre_buf)) + "</code></pre>")
    return "\n".join(out)


def wrap(body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Trilha Nest — Supplier Risk Analyzer (Etapas 1–15)</title>
  <style>
    @page {{ size: A4; margin: 12mm; }}
    body {{ font-family: "Segoe UI", system-ui, sans-serif; line-height: 1.45; color: #111; max-width: 48rem; margin: 0 auto; padding: 1rem; font-size: 10.5pt; }}
    h1 {{ font-size: 1.35rem; border-bottom: 1px solid #ccc; padding-bottom: 0.35rem; page-break-after: avoid; }}
    h2 {{ font-size: 1.15rem; margin-top: 1.5rem; page-break-after: avoid; color: #1a365d; }}
    h3 {{ font-size: 1.05rem; margin-top: 1rem; page-break-after: avoid; }}
    p {{ margin: 0.4rem 0; text-align: justify; }}
    ul, ol {{ margin: 0.35rem 0 0.5rem 1.2rem; }}
    li {{ margin: 0.2rem 0; }}
    code {{ background: #f4f4f4; padding: 0.1em 0.35em; font-size: 0.9em; }}
    pre code {{ display: block; background: #f7f7f7; padding: 0.75rem; font-size: 0.8rem; white-space: pre-wrap; border: 1px solid #e2e2e2; border-radius: 4px; }}
    table {{ border-collapse: collapse; width: 100%; margin: 0.5rem 0; font-size: 0.95em; page-break-inside: avoid; }}
    th, td {{ border: 1px solid #ccc; padding: 0.35rem 0.5rem; text-align: left; }}
    th {{ background: #eef2f7; }}
    hr {{ border: none; border-top: 1px solid #ddd; margin: 1rem 0; }}
    @media print {{ body {{ max-width: none; }} h2, h3 {{ break-after: avoid; }} tr {{ break-inside: avoid; }} }}
  </style>
</head>
<body>
{body}
</body>
</html>"""


if __name__ == "__main__":
    inp = sys.argv[1] if len(sys.argv) > 1 else "curso-nest-trilha-completa-etapas-1-15.md"
    outf = sys.argv[2] if len(sys.argv) > 2 else "curso-nest-trilha-completa-etapas-1-15.html"
    p = __import__("pathlib").Path(__file__).parent / inp
    md = p.read_text(encoding="utf-8")
    html_path = __import__("pathlib").Path(__file__).parent / outf
    html_path.write_text(wrap(convert(md)), encoding="utf-8")
    print(f"Wrote {html_path}")
