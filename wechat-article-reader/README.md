# wechat-article-reader

Extract a WeChat Official Account article and return clean Markdown output.

## What it does

- Opens an `mp.weixin.qq.com` article page using Playwright
- Extracts title, author, and main body
- Converts article HTML to Markdown via Turndown

## Usage

```bash
npm install
node scripts/read_article.mjs read "https://mp.weixin.qq.com/s/your-article-id"
```

## Output

Prints Markdown to stdout, for example:

```md
# Article Title

**作者：** Author Name

...article body...
```

## Troubleshooting

- If you see anti-crawler / rate-limit errors, wait and retry later.
- If selector extraction fails, WeChat page structure may have changed.

中文说明见：`README.zh-CN.md`
