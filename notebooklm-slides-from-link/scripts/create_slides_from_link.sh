#!/usr/bin/env bash
set -euo pipefail

NLM=(uvx --from notebooklm-mcp-cli nlm)

URL=""
LANGUAGE="zh-CN"
STYLE=""
PROMPT=""
TITLE=""
PROFILE=""
LENGTH="long"
MAX_WAIT=1800
POLL_INTERVAL=180
FORM="detailed_deck"

usage() {
  cat <<USAGE
Create NotebookLM slides from a single URL (webpage/YouTube).
This script only creates artifacts and monitors status (no file download).

Usage:
  $(basename "$0") --url <LINK> [options]

Options:
  --url <LINK>             Source URL (required)
  --language <BCP47>       Slides language (default: zh-CN)
  --form <VALUE>           Slides form: detailed_deck|presenter_slides (default: detailed_deck)
  --prompt <TEXT>          Full slide-generation prompt
  --style <TEXT>           Optional style requirement appended into prompt
  --length <VALUE>         Slides length: short|medium|default|long (default: long)
  --title <TEXT>           Notebook title (default: auto-generated)
  --profile <NAME>         Optional nlm auth profile
  --max-wait <SECONDS>     Max poll wait time (default: 1800)
  --poll-interval <SEC>    Poll interval (default: 180)
  -h, --help               Show help

Example:
  $(basename "$0") \
    --url "https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
    --language "zh-CN" \
    --form "presenter_slides" \
    --prompt "请输出详细版复盘 PPT，覆盖所有关键论点、案例和演示细节" \
    --style "简洁商务风，16:9" \
    --length "long"
USAGE
}

strip_ansi() {
  sed -r 's/\x1B\[[0-9;]*[mK]//g'
}

now_ts() {
  date +%s
}

title_from_url() {
  local u="$1"
  local host
  host="$(printf '%s' "$u" | sed -E 's#^[a-zA-Z]+://##; s#/.*$##; s#^www\.##')"
  if [[ -z "$host" ]]; then
    host="link"
  fi
  printf 'Link Slides %s %s' "$host" "$(date +%Y%m%d-%H%M%S)"
}

extract_uuid_like() {
  grep -Eo '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -n1
}

require_auth() {
  local out
  set +e
  if [[ -n "$PROFILE" ]]; then
    out="$(${NLM[@]} login --check --profile "$PROFILE" 2>&1 | strip_ansi)"
  else
    out="$(${NLM[@]} login --check 2>&1 | strip_ansi)"
  fi
  local code=$?
  set -e

  if [[ $code -ne 0 ]]; then
    echo "[ERROR] NotebookLM authentication is not ready."
    echo "Run: uvx --from notebooklm-mcp-cli nlm login${PROFILE:+ --profile $PROFILE}"
    echo "Raw output:"
    echo "$out"
    exit 1
  fi
}

run_nlm() {
  if [[ -n "$PROFILE" ]]; then
    "${NLM[@]}" "$@" --profile "$PROFILE"
  else
    "${NLM[@]}" "$@"
  fi
}

create_slides_via_code() {
  local notebook_id="$1"
  local language="$2"
  local focus_prompt="$3"
  local length_name="$4"
  local form_name="$5"
  local profile_name="${6:-}"

  uvx --from notebooklm-mcp-cli python - <<PY
import json
from notebooklm_tools.cli.utils import get_client

nb = ${notebook_id@Q}
lang = ${language@Q}
focus = ${focus_prompt@Q}
length_name = ${length_name@Q}.lower()
form_name = ${form_name@Q}.lower()
profile = ${profile_name@Q}

length_map = {"short": 1, "medium": 2, "default": 3, "long": 4}
if length_name not in length_map:
    raise SystemExit(f"Invalid length: {length_name}. Use short|medium|default|long")
format_map = {"detailed_deck": 1, "presenter_slides": 2}
if form_name not in format_map:
    raise SystemExit(f"Invalid form: {form_name}. Use detailed_deck|presenter_slides")

with get_client(profile if profile else None) as c:
    r = c.create_slide_deck(
        nb,
        format_code=format_map[form_name],
        length_code=length_map[length_name],
        language=lang,
        focus_prompt=focus,
    )
print(json.dumps(r or {}, ensure_ascii=False))
PY
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      URL="${2:-}"; shift 2 ;;
    --language)
      LANGUAGE="${2:-}"; shift 2 ;;
    --form)
      FORM="${2:-}"; shift 2 ;;
    --prompt)
      PROMPT="${2:-}"; shift 2 ;;
    --style)
      STYLE="${2:-}"; shift 2 ;;
    --length)
      LENGTH="${2:-}"; shift 2 ;;
    --title)
      TITLE="${2:-}"; shift 2 ;;
    --profile)
      PROFILE="${2:-}"; shift 2 ;;
    --max-wait)
      MAX_WAIT="${2:-}"; shift 2 ;;
    --poll-interval)
      POLL_INTERVAL="${2:-}"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1 ;;
  esac
done

if [[ -z "$URL" ]]; then
  echo "--url is required"
  usage
  exit 1
fi

if [[ -z "$TITLE" ]]; then
  TITLE="$(title_from_url "$URL")"
fi

case "${LENGTH,,}" in
  short|medium|default|long) ;;
  *)
    echo "[ERROR] Invalid --length: $LENGTH (use short|medium|default|long)"
    exit 1
    ;;
esac

case "${FORM,,}" in
  detailed_deck|presenter_slides) ;;
  *)
    echo "[ERROR] Invalid --form: $FORM (use detailed_deck|presenter_slides)"
    exit 1
    ;;
esac

DEFAULT_PROMPT="请基于这个 YouTube 内容生成一个完整的 PPT，覆盖内容里的所有干货、案例、步骤、关键观点，以及视频里屏幕共享或演示过的重点内容。默认按长篇详细版输出，适合复盘、分享和二次讲解。"
if [[ -n "$PROMPT" ]]; then
  FOCUS_PROMPT="$PROMPT"
else
  FOCUS_PROMPT="$DEFAULT_PROMPT"
fi

if [[ -n "$STYLE" ]]; then
  FOCUS_PROMPT="$FOCUS_PROMPT 风格要求：$STYLE"
fi

echo "[1/5] Checking auth..."
require_auth

echo "[2/5] Creating notebook: $TITLE"
nb_out="$(run_nlm notebook create "$TITLE" 2>&1 | strip_ansi)"
NOTEBOOK_ID="$(printf '%s\n' "$nb_out" | extract_uuid_like)"
if [[ -z "$NOTEBOOK_ID" ]]; then
  echo "[ERROR] Failed to parse notebook id"
  echo "$nb_out"
  exit 1
fi
echo "Notebook ID: $NOTEBOOK_ID"
NOTEBOOK_URL="https://notebooklm.google.com/notebook/$NOTEBOOK_ID"
echo "Notebook URL (open now): $NOTEBOOK_URL"

echo "[3/5] Adding source URL and waiting until ready"
run_nlm source add "$NOTEBOOK_ID" --url "$URL" --wait >/tmp/nlm-source-add.log 2>&1 || {
  echo "[ERROR] source add failed"
  cat /tmp/nlm-source-add.log | strip_ansi
  exit 1
}

echo "[4/5] Creating slides (form=$FORM, length=$LENGTH, language=$LANGUAGE)"
slides_out="$(create_slides_via_code "$NOTEBOOK_ID" "$LANGUAGE" "$FOCUS_PROMPT" "$LENGTH" "$FORM" "$PROFILE" 2>&1 | strip_ansi)"
ARTIFACT_ID="$(printf '%s\n' "$slides_out" | extract_uuid_like)"
if [[ -z "$ARTIFACT_ID" ]]; then
  echo "[ERROR] Failed to parse slide artifact id"
  echo "$slides_out"
  exit 1
fi
echo "Slide Artifact ID: $ARTIFACT_ID"

echo "[5/5] Polling studio status every ${POLL_INTERVAL}s until completed"
start="$(now_ts)"
while true; do
  status_out="$(run_nlm studio status "$NOTEBOOK_ID" --json 2>/dev/null || true)"
  if printf '%s' "$status_out" | grep -q "$ARTIFACT_ID"; then
    if printf '%s' "$status_out" | grep -A8 -B2 "$ARTIFACT_ID" | grep -q '"status"[[:space:]]*:[[:space:]]*"completed"'; then
      echo "Status: ready"
      echo "Completed: slide deck is ready."
      echo "Open in NotebookLM: $NOTEBOOK_URL"
      break
    elif printf '%s' "$status_out" | grep -A8 -B2 "$ARTIFACT_ID" | grep -q '"status"[[:space:]]*:[[:space:]]*"in_progress"'; then
      echo "Status: still generating..."
    else
      echo "Status: processing..."
    fi
  else
    echo "Status: artifact not visible yet, still generating..."
  fi

  now="$(now_ts)"
  elapsed=$((now - start))
  if (( elapsed > MAX_WAIT )); then
    echo "[ERROR] Timed out waiting for slide completion (${MAX_WAIT}s)"
    echo "Check manually: ${NLM[*]} studio status $NOTEBOOK_ID"
    exit 1
  fi
  sleep "$POLL_INTERVAL"
done

echo "Done"
echo "Notebook ID: $NOTEBOOK_ID"
echo "Artifact ID: $ARTIFACT_ID"
echo "Notebook URL: $NOTEBOOK_URL"
