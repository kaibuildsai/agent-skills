---
name: walkie-openclaw-adapter
description: Run a single-reader Walkie adapter that bridges Walkie channels with OpenClaw orchestration and transparent audit-based group sync. Use for near-real-time agent collaboration, anti-race message handling, and observable autonomous execution.
---

Run Walkie + OpenClaw in **托管模式（v2）**: stable, observable, and low-noise.

## Core rules (must follow)

1. **Single reader**: only one process may run `walkie read <channel> --wait`.
2. **Single sender path**: all outbound messages must go through adapter path (no manual direct send in production mode).
3. **Audit is source of truth**: group sync reads audit stream (`recv/send/error`) with cursor dedupe.
4. **Structured protocol first**: prefer JSON task/result envelopes over free text.

## Setup

```bash
npm install -g walkie-sh
walkie --version
cp walkie-openclaw-adapter/references/config.example.json walkie-openclaw-adapter/references/config.json
```

### Init confirmation (required)

Before first run, explicitly confirm with user:
1. Which Walkie channel to use (`channel`)
2. Which chat/group should receive callback sync (platform + chat id)

Do not assume callback destination. Bind it only after user confirms.

Edit `config.json`:
- `channel`
- `autoReply` (recommend `false`)
- `autoReplyMode` (`ack-task` if needed)
- `syncHookCmd` (optional)

## Run (dev)

```bash
node walkie-openclaw-adapter/scripts/adapter.js walkie-openclaw-adapter/references/config.json
```

## Run (recommended prod)

- Linux: use `systemd` to supervise adapter
- macOS: use `launchd` to supervise adapter
- Keep `cron/timer` for `audit-forwarder.py` only (sync/announce), not as primary process supervision

## Group sync format (fixed)

Use concise 3-line updates:
- `[walkie][task_id] 收到: ...`
- `[walkie][task_id] 动作: ...`
- `[walkie][task_id] 结果: OK/ERR/WAIT ...`

## Protocol (minimum fields)

```json
{"type":"task","task_id":"t-001","intent":"summarize_links","args":{},"trace_id":"tr-001","ts":"..."}
```

```json
{"type":"result","task_id":"t-001","ok":true,"output":{},"trace_id":"tr-001","ts":"..."}
```

## Decision policy

- **L1/L2 auto-execute**: routine chat, retrieval, summarize, translation, progress updates.
- **L3 human approval**: irreversible/delete/publish/payment/sensitive data externalization.

## Anti-loop safety

- event dedupe key
- task TTL/max rounds
- ignore self-origin loops
- legal state transitions only
- cooldown/rate limit
- circuit breaker after repeated failures

## Privacy and repo hygiene

Never commit runtime files:
- `references/config.json`
- `references/state.json`
- `references/audit.log`
- `references/audit.cursor`

## Troubleshooting

- Missing messages -> check for extra readers first.
- Sync delay -> check forwarder schedule and cursor state.
- Adapter exits -> check supervisor logs (systemd/launchd) + audit error lines.
