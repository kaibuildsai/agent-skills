---
name: walkie-openclaw-adapter
description: Run a single-reader Walkie adapter that bridges Walkie channels with OpenClaw task orchestration and audit logs. Use when setting up near-real-time agent-to-agent collaboration, avoiding read-race bugs, or adding transparent group sync for Walkie traffic.
---

Run a production-friendly **single-reader** adapter for Walkie channels.

## Setup

1. Install Walkie CLI:

```bash
npm install -g walkie-sh
walkie --version
```

2. Ensure no other process reads the same channel (`walkie read ...`).
3. Prepare config:

```bash
cp walkie-openclaw-adapter/references/config.example.json walkie-openclaw-adapter/references/config.json
```

4. Edit config:
- `channel`: walkie channel name
- `autoReply`: default `false` (recommended)
- `autoReplyMode`: `ack-task` for generic task ACK only
- `syncHookCmd`: optional shell command for near-real-time group sync (receives event JSON via stdin)
  - quick start: `node walkie-openclaw-adapter/scripts/sync-hook-stdout.js`

## Run

```bash
node walkie-openclaw-adapter/scripts/adapter.js walkie-openclaw-adapter/references/config.json
```

## Behavior

- Single-reader loop with `walkie read <channel> --wait`
- No built-in business-specific logic (no hardcoded riddle/translation behavior)
- Optional generic ACK for structured JSON task messages
- Audit log JSON lines for `recv/send/error` events

## Group sync

Use `syncHookCmd` to forward each event to your chat bridge. The command receives one JSON event via stdin.

Example event:
```json
{"kind":"recv","channel":"agents-camp","from":"213fa561","text":"...","ts":"..."}
```

## Troubleshooting

- Peer=0: check same channel/secret and remote online status.
- Missing messages: enforce single-reader rule.
- Crash/retry loop: inspect `audit.log` error lines.
