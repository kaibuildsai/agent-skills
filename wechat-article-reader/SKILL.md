---
name: wechat-article-reader
description: Read and extract full content from WeChat Official Account article URLs (mp.weixin.qq.com), including title/author/body, and return clean Markdown text. Use when user asks to parse, summarize, archive, or convert a WeChat article link into readable text.
---

Use `scripts/read_article.mjs` to fetch and convert a WeChat article to Markdown.

Run:

```bash
node scripts/read_article.mjs read "<wechat-article-url>"
```

Return stdout as the canonical Markdown result.

If extraction fails, report the exact error and suggest retrying later for anti-crawler or rate-limit pages.
