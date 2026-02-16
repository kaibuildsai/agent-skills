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
node scripts/read_article.mjs read "https://mp.weixin.qq.com/s/your-article-id"
```

## Example output

```md
# Article Title

**作者：** Author Name

...article body...
```

## Tips

- If extraction fails, WeChat DOM may have changed

中文文档：[`README.zh-CN.md`](./README.zh-CN.md)
