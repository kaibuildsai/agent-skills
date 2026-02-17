# wechat-article-reader（中文）

把微信公众号文章提取为干净的 Markdown。

## 功能

- 抓取 `mp.weixin.qq.com` 文章页面
- 提取标题、作者、正文
- 将 HTML 转为 Markdown
- 适合接入 OpenClaw 工作流，对页面内容进行问答
- 在直接访问网页受限时可先提取正文，再基于 Markdown 提问

## 命令

```bash
npm install
npm start "https://mp.weixin.qq.com/s/你的文章ID"
```

## 输出

```md
# 文章标题

**作者：** 作者名

...正文...
```

## 提示

- **反爬虫**：遇到频率限制时，等几分钟重试
- **DOM 变化**：微信偶尔会改页面结构，可能导致提取失败
- **不支持的内容**：视频、评论、点赞无法提取
- **代理**：修改 `scripts/read_article.mjs` 添加代理设置

English: [`README.md`](./README.md)
