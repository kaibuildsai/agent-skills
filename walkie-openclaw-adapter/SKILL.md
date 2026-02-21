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

## Group sync（推荐）

采用“单读者 + 审计转发器”模式，避免抢消息：

1. 适配器持续写 `references/audit.log`
2. 用定时任务执行：

```bash
python3 walkie-openclaw-adapter/scripts/audit-forwarder.py
```

脚本输出规则：
- 有增量事件 -> 输出 `[walkie] ...` 多行文本（可直接发群）
- 无增量事件 -> 输出 `NO_REPLY`

如需 hook 模式，也可用 `syncHookCmd`（stdin 收一条 JSON 事件）。

## Troubleshooting

- Peer=0: check same channel/secret and remote online status.
- Missing messages: enforce single-reader rule.
- Crash/retry loop: inspect `audit.log` error lines.
