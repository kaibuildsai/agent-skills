---
name: openclaw-agent-onboarding
description: Configure OpenClaw multi-agent routing by creating a new agent and binding a specific Feishu or WhatsApp group to that agent. Use when user asks to set up role-isolated assistants, find group peer IDs from logs, update ~/.openclaw/openclaw.json bindings, enable channel options like requireMention, and verify routing after daemon restart.
---

Follow this workflow to configure a new OpenClaw agent binding safely.

1. Confirm requirements in one short checklist:
- `agent_id` (lowercase id used by OpenClaw)
- `agent_name` (display name, optional)
- `model_provider/model` (for example `openai-codex/gpt-5.3-codex`, `minimax/MiniMax-M2.5`)
- `channel` (`feishu` or `whatsapp`)
- whether to use isolated `workspace` and `agent-dir`

2. Discover command syntax before generating create commands:
```bash
openclaw agents create --help
```
Then generate a non-interactive command that matches the current CLI help output and includes `--non-interactive`.
If user requests isolation, include dedicated workspace and agent-dir flags supported by the current CLI.

3. Collect group ID from logs without asking user to browse backend manually:
```bash
openclaw logs --follow
```
Ask user to send a unique passphrase in the target group (for example `绑定投资群-2026-02-16`), then provide the matching log line.
Extract `peer.id` from that line.
Typical patterns:
- Feishu group: starts with `oc_`
- WhatsApp group: usually ends with `@g.us`

4. Update `~/.openclaw/openclaw.json` with backup + deterministic patch:
- Back up first:
```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak.$(date +%F-%H%M%S)
```
- Ensure channel option is set when needed (for example Feishu no-mention trigger):
```bash
jq '.channels.feishu.requireMention = false' ~/.openclaw/openclaw.json > /tmp/openclaw.json && mv /tmp/openclaw.json ~/.openclaw/openclaw.json
```
- Upsert binding rule (append only when same `channel + peer.id` is absent):
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

5. Validate config and activate:
```bash
jq '.' ~/.openclaw/openclaw.json >/dev/null
openclaw daemon restart
```

6. Verify in-group behavior:
- Send a test message in the bound group without manual `/model` switching.
- Confirm the expected agent persona/model responds.
- If routing fails, check:
  - `channel` spelling in binding
  - exact `peer.id`
  - whether another binding conflicts with same `channel + peer`

Execution rules:
- Keep all commands copy-paste ready.
- Never edit JSON manually when a `jq` patch can avoid syntax mistakes.
- If command output indicates a schema mismatch, inspect current config structure first, then regenerate patch commands.
