---
name: openclaw-agent-onboarding
description: Onboard OpenClaw into a role-based multi-agent team by creating a new agent and binding a specific group to it. Use when user asks to route a channel group to a dedicated agent, enforce workspace/path conventions, ensure shared skills reuse, create missing memory files, patch ~/.openclaw/openclaw.json safely, and verify routing/model behavior after restart.
---

Follow this workflow to configure a new OpenClaw agent binding safely.

1. Confirm requirements in one short checklist:
- `agent_id` (lowercase id used by OpenClaw)
- `agent_name` (display name, optional)
- `model_provider/model` (for example `openai-codex/gpt-5.3-codex`, `minimax/MiniMax-M2.5`)
- `channel` (`feishu` or `whatsapp`)
- whether non-default paths are explicitly requested by the user

2. Enforce default path conventions unless user explicitly overrides:
- Workspace root: `~/.openclaw/workspaces`
- Agent workspace: `~/.openclaw/workspaces/<agent_id>`
- Agent dir: `~/.openclaw/agents/<agent_id>/agent`
- Shared skills root: `~/.openclaw/skills`
- Workspace skills link: `~/.openclaw/workspaces/<agent_id>/skills -> ~/.openclaw/skills`
- Always create `MEMORY.md` in the agent workspace if missing.

3. Discover CLI syntax first; do not assume subcommand names:
```bash
openclaw agents --help
openclaw agents add --help
```
Notes:
- Some docs mention `agents create`; current versions commonly use `agents add`.
- Always generate a non-interactive command with `--non-interactive`.
- Always pass `--workspace` and `--agent-dir` for deterministic onboarding.

4. Create agent with deterministic paths and immediately sanity-check local state:
```bash
AGENT_ID="<agent_id>"
MODEL="<provider/model>"
WORKSPACE="$HOME/.openclaw/workspaces/$AGENT_ID"
AGENT_DIR="$HOME/.openclaw/agents/$AGENT_ID/agent"

openclaw agents add "$AGENT_ID" \
  --non-interactive \
  --workspace "$WORKSPACE" \
  --agent-dir "$AGENT_DIR" \
  --model "$MODEL" \
  --json
```
Then verify:
- `openclaw agents list --json` contains the new agent.
- `openclaw.json` has the expected `agents.list[].model`.
- If `agent_dir` has no auth/model files, initialize/copy required auth before final validation.

5. Normalize workspace essentials (idempotent):
```bash
AGENT_ID="<agent_id>"
WORKSPACE="$HOME/.openclaw/workspaces/$AGENT_ID"
SHARED_SKILLS="$HOME/.openclaw/skills"

mkdir -p "$WORKSPACE"
test -f "$WORKSPACE/MEMORY.md" || cat > "$WORKSPACE/MEMORY.md" <<'EOF'
# MEMORY.md

Long-term memory for this agent. Keep concise, stable, and non-sensitive.
EOF

if [ -e "$WORKSPACE/skills" ] && [ ! -L "$WORKSPACE/skills" ]; then
  mv "$WORKSPACE/skills" "$WORKSPACE/skills.prelink.$(date +%Y%m%d_%H%M%S)"
fi
ln -sfn "$SHARED_SKILLS" "$WORKSPACE/skills"
```

6. Resolve target group `peer.id` with minimal user friction:
- Preferred: use `openclaw status --json` and inspect `sessions.recent` for newest `agent:<id>:<channel>:group:<peer_id>` style keys.
- Fallback: use `openclaw logs` and filter lines for the passphrase or group traffic; do not force user to manually browse server logs.
- Ask user to send a unique passphrase in target group when needed.
Typical IDs:
- Feishu group: starts with `oc_`
- WhatsApp group: usually ends with `@g.us`

7. Update `~/.openclaw/openclaw.json` with backup + deterministic patches:
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

8. Validate and activate:
```bash
jq '.' ~/.openclaw/openclaw.json >/dev/null
openclaw daemon restart
```

9. Verify behavior in two layers:
- Routing verification:
  - Send one short text in target group (prefer an `@mention` once as trigger sanity check).
  - Confirm session key appears under expected agent/group via `openclaw status --json`.
- Runtime model verification:
  - Run a non-delivered agent turn and inspect returned provider/model.
```bash
openclaw agent --agent <agent_id> --message "Model check: reply with OK only" --json
```
  - Confirm `agentMeta.provider/model` matches requested model (no unintended fallback).

10. If user sent image/media, run media-path verification too:
- Confirm inbound media is logged for the same group.
- Verify the bound agent still responds (text+media can expose policy gaps).

11. If wrong group was bound, provide deterministic rollback:
```bash
CHANNEL="<channel>"
PEER_ID="<wrong_peer_id>"
AGENT_ID="<agent_id>"

jq --arg ch "$CHANNEL" --arg pid "$PEER_ID" --arg aid "$AGENT_ID" '
  .bindings = ((.bindings // []) | map(select(.agentId != $aid or .match.channel != $ch or .match.peer.id != $pid)))
' ~/.openclaw/openclaw.json > /tmp/openclaw.json && mv /tmp/openclaw.json ~/.openclaw/openclaw.json

openclaw daemon restart
```

12. If historical paths exist, preserve compatibility:
- If old path style exists (for example `~/.openclaw/workspace-<agent_id>`), keep it as symlink to `~/.openclaw/workspaces/<agent_id>`.
- Do not remove old path entry points abruptly in environments with cron/scripts.

13. Final acceptance checklist:
- Agent exists in `openclaw agents list --json`.
- `openclaw.json` binding is present and deduplicated.
- `~/.openclaw/workspaces/<agent_id>/MEMORY.md` exists.
- `~/.openclaw/workspaces/<agent_id>/skills` is a symlink to `~/.openclaw/skills`.
- Runtime model check returns expected provider/model.
- One real group message routes to the intended agent.

Execution rules:
- Keep all commands copy-paste ready.
- Never edit JSON manually when a `jq` patch can avoid syntax mistakes.
- If command output indicates schema/CLI mismatch, inspect current help/config first and regenerate commands.
- Prefer idempotent upserts over blind append.
- Never include secrets/tokens/real user identifiers in skill text, examples, commit messages, or logs.
