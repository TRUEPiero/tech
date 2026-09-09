"""Package committed source and readable handoff with per-file SHA-256 hashes."""
from datetime import datetime, timezone
from hashlib import sha256
from io import BytesIO
from pathlib import Path, PurePosixPath
import json
import re
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)

if len(sys.argv) != 2 or not Path(sys.argv[1]).is_absolute():
    raise SystemExit("Usage: python3 scripts/package-handoff.py /absolute/path/package.zip")
if git("status", "--porcelain", "--untracked-files=no").strip():
    raise SystemExit("Commit tracked changes before packaging.")

commit = git("rev-parse", "--verify", "HEAD").decode().strip()
out = Path(sys.argv[1])
files = {}
with zipfile.ZipFile(BytesIO(git("archive", "--format=zip", "HEAD"))) as archive:
    for info in archive.infolist():
        if info.is_dir():
            continue
        path = PurePosixPath(info.filename)
        forbidden = {".git", "node_modules", ".wrangler", ".sites-runtime", "dist", ".next"}
        if any(part in forbidden for part in path.parts):
            continue
        if path.name.startswith(".env") and path.name != ".env.example":
            continue
        if path.suffix in {".sqlite", ".sqlite3", ".db"}:
            continue
        files[info.filename] = archive.read(info)

start_html = files["docs/00_START_HERE.html"].decode()
start_html = re.sub(r'href="(?!https?://)([^\"]+)"', r'href="docs/\1"', start_html)
files["00_START_HERE.html"] = start_html.encode()
start_md = files["docs/00_START_HERE.md"].decode()
start_md = re.sub(r'\]\((?!https?://)([^\s)]+)\)', r'](docs/\1)', start_md)
files["00_START_HERE.md"] = start_md.encode()
manifest = {
    "packageFormatVersion": 1,
    "title": "Технобит: сайт и калькулятор - пакет для программиста",
    "createdAt": datetime.now(timezone.utc).isoformat(),
    "sourceCommit": commit,
    "applicationBase": {
        "publishedSiteVersion": 9,
        "sourceCommit": "13ea8bff7287e31ef44d012c6fb89f3b61ee3dcf",
        "note": "Пакет дополняет документацию и локальные вспомогательные файлы; приложение соответствует версии 9.",
    },
    "roomDefaults": {"count": 30, "source": "seed", "databaseOverridesObserved": 0, "checkedOn": "2026-09-07"},
    "pricingStatus": "pending_rules_approval",
    "integrationsStatus": "not_connected",
    "fileCountExcludingManifest": len(files),
    "files": [{"path": name, "sizeBytes": len(data), "sha256": sha256(data).hexdigest()} for name, data in sorted(files.items())],
}
files["PACKAGE_MANIFEST.json"] = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode()
out.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for name, data in sorted(files.items()):
        info = zipfile.ZipInfo(name)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o755 if name.startswith("scripts/") and name.endswith(".sh") else 0o644) << 16
        archive.writestr(info, data)
with zipfile.ZipFile(out) as archive:
    assert archive.testzip() is None
    for item in manifest["files"]:
        assert sha256(archive.read(item["path"])).hexdigest() == item["sha256"]
print(json.dumps({"archive": str(out), "sourceCommit": commit, "files": len(files), "bytes": out.stat().st_size}, ensure_ascii=False))
