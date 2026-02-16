# Agent Skills

Practical, open-source skills for coding agents.

## Why this repo

- **Useful over fancy**: real workflows you can run today
- **Small and readable**: minimal setup, clear structure
- **Open to reuse**: copy, modify, ship

## Skills

### `wechat-article-reader`
Extract full text from WeChat Official Account articles (`mp.weixin.qq.com`) and output clean Markdown.

**Use cases**
- Save articles to your knowledge base
- Summarize long posts with LLMs
- Convert links into searchable text
- Feed extracted text into OpenClaw for grounded Q&A on the same page
- Bypass direct webpage access limits by extracting content first, then ask questions over Markdown

### `openclaw-agent-onboarding`
Upgrade OpenClaw from a single assistant into a role-based assistant team, so each group is automatically handled by the right agent (works for any channel that supports `group`; Feishu/WhatsApp are just common examples).

**Use cases**
- Set up role-isolated agents (coding, finance, personal assistant)
- Avoid manual `/model` switching in group chats
- Locate target `peer.id` accurately with a passphrase + logs method
- Update `~/.openclaw/openclaw.json` safely with backup-first automation
- Validate and restart daemon to make routing effective

## Quick start

```bash
git clone https://github.com/kaibuildsai/agent-skills.git
cd agent-skills/wechat-article-reader
npm install
node scripts/read_article.mjs read "https://mp.weixin.qq.com/s/your-article-id"
```

## Output

Markdown printed to stdout (title, author, body).

## License

MIT

中文文档：[`README.zh-CN.md`](./README.zh-CN.md)
