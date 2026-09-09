"""Render the small, known Markdown subset in the handoff docs without dependencies."""

from html import escape
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def inline(text):
    text = escape(text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^\s)]+)\)", r'<a href="\2">\1</a>', text)
    return re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)


def render(source):
    lines = source.splitlines()
    blocks = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith("```"):
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(lines[i])
                i += 1
            blocks.append("<pre><code>" + escape("\n".join(code)) + "</code></pre>")
            i += 1
            continue
        if line.startswith("#"):
            level = len(line) - len(line.lstrip("#"))
            blocks.append(f"<h{level}>" + inline(line[level:].strip()) + f"</h{level}>")
            i += 1
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                cells = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r"[-: ]+", cell) for cell in cells):
                    rows.append(cells)
                i += 1
            head = "<thead><tr>" + "".join("<th>" + inline(cell) + "</th>" for cell in rows[0]) + "</tr></thead>"
            body = "<tbody>" + "".join("<tr>" + "".join("<td>" + inline(cell) + "</td>" for cell in row) + "</tr>" for row in rows[1:]) + "</tbody>"
            blocks.append('<div class="table-wrap"><table>' + head + body + "</table></div>")
            continue
        if re.match(r"^(?:- |\d+\. )", line):
            ordered = bool(re.match(r"^\d+\. ", line))
            pattern = r"^\d+\. " if ordered else r"^- "
            tag = "ol" if ordered else "ul"
            items = []
            while i < len(lines) and re.match(pattern, lines[i]):
                items.append("<li>" + inline(re.sub(pattern, "", lines[i])) + "</li>")
                i += 1
            blocks.append(f"<{tag}>" + "".join(items) + f"</{tag}>")
            continue
        paragraphs = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r"^(?:#|\||```|- |\d+\. )", lines[i]):
            paragraphs.append(lines[i])
            i += 1
        blocks.append("<p>" + inline(" ".join(paragraphs)) + "</p>")
    return "\n".join(blocks)


CSS = """
* { box-sizing: border-box; }
html { background: #eef2f6; }
body { margin: 0; color: #4b5563; font: 16px/1.55 Arial, sans-serif; overflow-wrap: anywhere; }
main { max-width: 1120px; margin: 32px auto; padding: 52px 58px; background: #fff; border-top: 6px solid #168c9e; }
.brand { color: #168c9e; font-size: 18px; font-weight: 700; letter-spacing: .1em; margin: 0 0 14px; }
h1 { color: #17365d; font-size: clamp(28px, 4vw, 40px); line-height: 1.15; margin: 0 0 24px; }
h2 { color: #1f4e79; font-size: 23px; line-height: 1.25; margin: 36px 0 14px; }
h3 { color: #168c9e; font-size: 19px; }
p { margin: 0 0 14px; }
a { color: #167486; text-underline-offset: 3px; }
li { margin: 0 0 8px; padding-left: 3px; }
ul, ol { padding-left: 24px; margin: 16px 0 22px; }
.table-wrap { max-width: 100%; overflow-x: auto; margin: 20px 0 26px; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th { background: #1f4e79; color: white; font-weight: 700; text-align: left; }
td, th { padding: 12px 13px; border: 1px solid #d5e0ea; vertical-align: top; }
td:first-child { background: #d9eaf7; color: #17365d; font-weight: 700; }
tr:nth-child(even) td:not(:first-child) { background: #f4f6f8; }
code { font-family: Consolas, monospace; font-size: .92em; }
pre { padding: 20px; color: #17365d; background: #edf4f9; border-left: 3px solid #168c9e; white-space: pre-wrap; }
footer { border-top: 1px solid #d5e0ea; margin-top: 44px; padding-top: 18px; color: #687782; font-size: 13px; }
@media (max-width: 600px) { main { margin: 0; padding: 30px 18px; } td, th { padding: 9px; } table { min-width: 620px; } }
@media print { html { background: white; } body { font-size: 10pt; line-height: 1.3; } main { margin: 0; padding: 0; border: 0; } h1 { font-size: 25pt; } h2 { font-size: 18pt; break-after: avoid; } table { font-size: 8pt; } tr { break-inside: avoid; } th { print-color-adjust: exact; } @page { size: A4; margin: 17mm; } }
"""

for name in ["00_START_HERE", "PROGRAMMER_HANDOFF", "ROOM_DEFAULTS", "CALCULATION_PROPOSAL", "CONFIGURATION_JSON", "ACCEPTANCE"]:
    source = (ROOT / "docs" / f"{name}.md").read_text()
    title = source.splitlines()[0].removeprefix("# ")
    document = f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{escape(title)}</title><style>{CSS}</style></head>
<body><main><p class="brand">ТЕХНОБИТ</p>{render(source)}<footer>Материалы прототипа. 07.09.2026. Расчет оборудования ожидает согласования.</footer></main></body></html>
'''
    (ROOT / "docs" / f"{name}.html").write_text(document)
    print(f"docs/{name}.html")
