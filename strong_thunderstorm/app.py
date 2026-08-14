#!/usr/bin/env python3
from pathlib import Path

_root = Path(__file__).resolve().parent
_source_dir = _root / "app_source"
_source = "".join(path.read_text(encoding="utf-8") for path in sorted(_source_dir.glob("*.part")))
exec(compile(_source, "/app/app_source.py", "exec"), globals(), globals())
