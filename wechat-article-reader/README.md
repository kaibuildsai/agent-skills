# wechat-article-reader

Extract WeChat Official Account articles to clean Markdown.

## Features

- Fetches article pages from `mp.weixin.qq.com`
- Extracts title, author, and main content
- Converts HTML to Markdown
- Works well with OpenClaw pipelines for page-level Q&A
- Helps when direct page browsing is restricted: extract first, then query the Markdown

## CLI

```bash
npm install
npm start "https://mp.weixin.qq.com/s/your-article-id"
```

## Output

```md
# Article Title

**作者：** Author Name

...article body...
```

## Tips

- **Anti-crawler**: If you hit rate limits, wait a few minutes and retry
- **DOM changes**: WeChat occasionally updates their page structure - extraction may fail
- **What's not extracted**: Videos, comments, likes, and comments are not supported
- **Proxy**: Edit `scripts/read_article.mjs` to add proxy settings if needed

中文文档：[`README.zh-CN.md`](./README.zh-CN.md)
