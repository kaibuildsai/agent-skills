# wechat-article-reader（中文）

读取微信公众号文章并输出 Markdown。

## 功能

- 使用 Playwright 打开 `mp.weixin.qq.com` 文章页
- 提取标题、作者、正文
- 使用 Turndown 将 HTML 转为 Markdown

## 用法

```bash
npm install
node scripts/read_article.mjs read "https://mp.weixin.qq.com/s/你的文章ID"
```

## 输出

脚本会把 Markdown 直接打印到标准输出。

## 常见问题

- 若出现反爬/访问频率限制，稍后重试。
- 若选择器提取失败，可能是微信页面结构变化导致。
