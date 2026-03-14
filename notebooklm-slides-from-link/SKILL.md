---
name: notebooklm-slides-from-link
description: Create a NotebookLM slide deck from a single link, especially a YouTube link, using nlm via uvx. Use this when the user wants: create a fresh notebook for each link, add the link as source, generate a slide deck from a custom prompt, default to long length, and monitor generation status until ready. Outputs notebook URL and artifact ID.
---

# NotebookLM Slides From Link

Use this skill when the user gives one link, usually a YouTube link, and wants a fresh NotebookLM notebook plus a generated slide deck.

## What this skill does

1. Create a new notebook
2. Add the link as source (web or YouTube)
3. Generate slide deck with a prompt that captures the user's requirements
4. Poll artifact status periodically until ready
5. Return NotebookLM notebook link for user to open directly

## Runtime requirements

- `uvx` available in PATH
- `notebooklm-mcp-cli` resolvable by `uvx`
- Valid NotebookLM auth (run `uvx --from notebooklm-mcp-cli nlm login` once)

## Command

```bash
bash scripts/create_slides_from_link.sh --url "<LINK>" [--language <BCP47>] [--form <detailed_deck|presenter_slides>] [--prompt "<FULL_PROMPT>"] [--style "<STYLE>"] [--length <short|medium|default|long>] [--title "<NOTEBOOK_TITLE>"]
```

## Defaults

- Length default: `long` (code `4`; also supports `short|medium|default`)
- No direct download step (open NotebookLM link manually)
- Language: if omitted, script uses `zh-CN`
- Base generation prompt if `--prompt` is omitted:
  - `请基于这个 YouTube 内容生成一个完整的 PPT，覆盖内容里的所有干货、案例、步骤、关键观点，以及视频里屏幕共享或演示过的重点内容。默认按长篇详细版输出，适合复盘、分享和二次讲解。`
- If user gives `--prompt`, use it as the main generation prompt.
- If user gives style, append it to the chosen prompt:
  - `风格要求：<STYLE>`
- Slide form:
  - `detailed_deck` or `presenter_slides`

## Notes

- YouTube is a primary use case, but any supported webpage link can work.
- For reliability, the script waits for source processing before generating slides.
- The script polls `studio status` every 180 seconds by default and prints `still generating` / `ready`.
- Default max wait is 1800 seconds (30 minutes), configurable via `--max-wait`.
- On completion, the script outputs notebook URL and artifact ID.
- This skill creates a new notebook for every input link. It does not reuse an existing notebook.
