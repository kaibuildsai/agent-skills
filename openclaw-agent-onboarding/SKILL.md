---
name: openclaw-agent-onboarding
description: Onboard OpenClaw into a role-based multi-agent team by creating a new agent and binding a specific group to it. Use when user asks to route any channel group to a dedicated agent (Feishu/WhatsApp are examples), isolate memory by role, avoid manual model switching, extract peer IDs, update ~/.openclaw/openclaw.json bindings, and verify routing/model behavior after daemon restart.
---

Follow this workflow to configure a new OpenClaw agent binding safely.

1. Confirm requirements in one short checklist:
- `agent_id` (lowercase id used by OpenClaw)
- `agent_name` (display name, optional)
- `model_provider/model` (for example `openai-codex/gpt-5.3-codex`, `minimax/MiniMax-M2.5`)
- `channel` (`feishu` or `whatsapp`)
- whether to use isolated `workspace` and `agent-dir`

2. Discover CLI syntax first; do not assume subcommand names:
```bash
openclaw agents --help
openclaw agents add --help
```
Notes:
- Some docs mention `agents create`; current versions commonly use `agents add`.
- Always generate a non-interactive command with `--non-interactive`.
- If isolation is requested, include `--workspace` and `--agent-dir`.

3. Create agent and immediately sanity-check local state:
```bash
openclaw agents add <agent_id> \
  --non-interactive \
  --workspace <workspace_dir> \
  --agent-dir <agent_dir> \
  --model <provider/model> \
  --json
```
Then verify:
- `openclaw agents list --json` contains the new agent.
- `openclaw.json` has the expected `agents.list[].model`.
- If `agent_dir` does not exist or has no auth/model files, create/fill it before final validation.

4. Resolve target group `peer.id` with minimal user friction:
- Preferred: use `openclaw status --json` and inspect `sessions.recent` for newest `agent:<id>:<channel>:group:<peer_id>` style keys.
- Fallback: use `openclaw logs` and filter lines for the passphrase or group traffic; do not force user to manually browse server logs.
- Ask user to send a unique passphrase in target group when needed.
Typical IDs:
- Feishu group: starts with `oc_`
- WhatsApp group: usually ends with `@g.us`

5. Update `~/.openclaw/openclaw.json` with backup + deterministic patches:
- Back up first:
```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak.$(date +%F-%H%M%S)
```
- Upsert binding rule (append only when same `channel + peer.id` absent):
```bash
AGENT_ID="<agent_id>"
CHANNEL="<channel>"
PEER_ID="<peer_id>"

jq --arg agent "$AGENT_ID" --arg ch "$CHANNEL" --arg pid "$PEER_ID" '
  .bindings = ((.bindings // []) | if any(.[]; .match.channel == $ch and .match.peer.kind == "group" and .match.peer.id == $pid)
    then .
    else . + [{
      agentId: $agent,
      match: { channel: $ch, peer: { kind: "group", id: $pid } }
    }]
  end)
' ~/.openclaw/openclaw.json > /tmp/openclaw.json && mv /tmp/openclaw.json ~/.openclaw/openclaw.json
```
- Channel-specific safety toggles:
```bash
# Feishu: allow no-mention trigger if required by user policy
jq '.channels.feishu.requireMention = false' ~/.openclaw/openclaw.json > /tmp/openclaw.json && mv /tmp/openclaw.json ~/.openclaw/openclaw.json

# WhatsApp: if groupPolicy is allowlist, ensure group exists in channels.whatsapp.groups
jq --arg pid "$PEER_ID" '.channels.whatsapp.groups[$pid] = ((.channels.whatsapp.groups[$pid] // {}) + {requireMention: false})' \
  ~/.openclaw/openclaw.json > /tmp/openclaw.json && mv /tmp/openclaw.json ~/.openclaw/openclaw.json
```

6. Validate and activate:
```bash
jq '.' ~/.openclaw/openclaw.json >/dev/null
openclaw daemon restart
```

7. Verify behavior in two layers:
- Routing verification:
  - Send one short text in target group (prefer an `@mention` once as trigger sanity check).
  - Confirm session key appears under expected agent/group via `openclaw status --json`.
- Runtime model verification:
  - Run a non-delivered agent turn and inspect returned provider/model.
```bash
openclaw agent --agent <agent_id> --message "Model check: reply with OK only" --json
```
  - Confirm `agentMeta.provider/model` matches requested model (no unintended fallback).

8. If user sent image/media, run media-path verification too:
- Confirm inbound media is logged for the same group.
- Verify the bound agent still responds (text+media can expose policy gaps).

9. If wrong group was bound, provide deterministic rollback:
```bash
CHANNEL="<channel>"
PEER_ID="<wrong_peer_id>"
AGENT_ID="<agent_id>"

jq --arg ch "$CHANNEL" --arg pid "$PEER_ID" --arg aid "$AGENT_ID" '
  .bindings = ((.bindings // []) | map(select(.agentId != $aid or .match.channel != $ch or .match.peer.id != $pid)))
' ~/.openclaw/openclaw.json > /tmp/openclaw.json && mv /tmp/openclaw.json ~/.openclaw/openclaw.json

openclaw daemon restart
```

Execution rules:
- Keep all commands copy-paste ready.
- Never edit JSON manually when a `jq` patch can avoid syntax mistakes.
- If command output indicates schema/CLI mismatch, inspect current help/config first and regenerate commands.
- Prefer idempotent upserts over blind append.
