#!/usr/bin/env python3
import json
from pathlib import Path

LOG = Path('walkie-openclaw-adapter/references/audit.log')
CURSOR = Path('walkie-openclaw-adapter/references/audit.cursor')
MAX_LINES = 12

if not LOG.exists():
    print('NO_REPLY')
    raise SystemExit(0)

last = 0
if CURSOR.exists():
    try:
        last = int(CURSOR.read_text().strip() or '0')
    except Exception:
        last = 0

lines = LOG.read_text(errors='ignore').splitlines()
new = lines[last:]
CURSOR.write_text(str(len(lines)))

if not new:
    print('NO_REPLY')
    raise SystemExit(0)

out = []
for raw in new[-MAX_LINES:]:
    try:
        e = json.loads(raw)
    except Exception:
        continue
    kind = e.get('kind', 'event')
    if kind == 'recv':
        out.append(f"[walkie] 收到: {e.get('text', '')}")
    elif kind == 'send':
        out.append(f"[walkie] 动作: 已发送 -> {e.get('text', '')}")
    elif kind == 'error':
        out.append(f"[walkie] 错误: {e.get('error', 'unknown')}")

print('\n'.join(out) if out else 'NO_REPLY')
