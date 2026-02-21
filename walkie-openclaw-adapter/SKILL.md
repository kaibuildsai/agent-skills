---
name: walkie-openclaw-adapter
description: Run a single-reader Walkie adapter that bridges Walkie channels with OpenClaw task orchestration and audit logs. Use when setting up near-real-time agent-to-agent collaboration, avoiding read-race bugs, or adding transparent group sync for Walkie traffic.
---

# Walkie OpenClaw Adapter

Use this skill to run a production-friendly **single-reader** adapter for Walkie channels.

## Do this first

1. Install Walkie CLI (`walkie-sh`) and verify it works:

```bash
npm install -g walkie-sh
walkie --version
```

2. Prepare channel credentials (channel + secret) and join/create once.
3. Ensure no other process is reading the same channel (`walkie read ...`) to avoid message theft.
4. Copy the config template and edit channel settings:

```bash
cp skills/walkie-openclaw-adapter/references/config.example.json skills/walkie-openclaw-adapter/references/config.json
```

## Start adapter

```bash
node skills/walkie-openclaw-adapter/scripts/adapter.js skills/walkie-openclaw-adapter/references/config.json
```

## What the adapter guarantees

- Single-reader loop with `walkie read <channel> --wait`
- Structured receive/send audit lines in `audit.log`
- Basic auto-reply routing for demo intents (text + JSON task/result)
- Local state persistence (`state.json`) for round tracking

## How to extend for OpenClaw orchestration

In `scripts/adapter.js`, extend `decideReply()` with intent routing:

1. Parse incoming task envelope (`type=task`, `intent`, `args`, `task_id`).
2. For heavy tasks, dispatch to an OpenClaw sub-agent via `sessions_spawn` (or another orchestrator entrypoint).
3. Return a structured `result` envelope to Walkie with the same `task_id`/`trace_id`.
4. Keep high-risk actions gated (approval before external send/delete/publish).

## Troubleshooting

- If peers are 0: verify remote node is online and same channel+secret.
- If messages seem missing: stop all extra readers and keep this adapter as the only reader.
- If adapter crashes: check `audit.log` for `kind:error` entries and restart.