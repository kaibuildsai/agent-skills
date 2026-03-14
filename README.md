# Agent Skills

Practical skills I built for my own daily use with coding agents (Claude Code, OpenClaw, Codex, etc.) to boost productivity.

## What is this?

- **Real problems, real solutions**: workflows I actually use
- **Minimal setup**: clear structure, easy to understand
- **Open to reuse**: copy, modify, adapt as needed

## Skills

### [wechat-article-reader](./wechat-article-reader/)
Extract full text from WeChat Official Account articles (`mp.weixin.qq.com`) → clean Markdown.

**Use cases**: Save articles, summarize with LLMs, convert to searchable text, Q&A over extracted content.

### [openclaw-agent-onboarding](./openclaw-agent-onboarding/)
Turn OpenClaw into a role-based multi-agent team. Each group auto-routes to the right agent.

**Use cases**: Role-isolated agents, avoid manual `/model` switching, group-specific routing.

### [walkie-openclaw-adapter](./walkie-openclaw-adapter/)
Single-reader Walkie adapter that bridges Walkie channel traffic into OpenClaw orchestration with audit logs.

**Use cases**: Near-real-time agent-to-agent collaboration, avoid read-race bugs, transparent sync of backend chatter.

### [notebooklm-slides-from-link](./notebooklm-slides-from-link/)
Create a fresh NotebookLM notebook from one link, then generate a long slide deck. YouTube is a primary use case, but other webpage links can work too.

**Use cases**: Turn a YouTube video into a detailed PPT, build a shareable deck from a webpage, create one notebook per source link for later review.

## License

MIT

中文文档：[`README.zh-CN.md`](./README.zh-CN.md)
