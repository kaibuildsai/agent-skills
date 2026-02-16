# Agent Skills

Open-source collection of practical skills for coding agents.

## Included Skills

- `wechat-article-reader` — Extract full content from WeChat Official Account articles (`mp.weixin.qq.com`) and convert to Markdown.

## Quick Start

```bash
cd wechat-article-reader
npm install
node scripts/read_article.mjs read "https://mp.weixin.qq.com/s/your-article-id"
```

## Notes

- This repository stores skill source files (not runtime `node_modules`).
- Some WeChat pages may trigger anti-crawler/rate-limit checks.

## License

MIT

---

中文说明见：`README.zh-CN.md`
