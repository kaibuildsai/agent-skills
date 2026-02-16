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

## Quick start

```bash
git clone https://github.com/kaibuildsai/agent-skills.git
cd agent-skills/wechat-article-reader
npm install
node scripts/read_article.mjs read "https://mp.weixin.qq.com/s/your-article-id"
```

## Output

Markdown printed to stdout (title, author, body).

## Notes

- `node_modules` is intentionally not tracked
- Some pages may hit anti-crawler/rate limits

## License

MIT

中文文档：[`README.zh-CN.md`](./README.zh-CN.md)
