# Agent Skills（中文说明）

这是一个开源的 Agent Skill 集合仓库。

## 当前技能

- `wechat-article-reader`：读取微信公众号文章（`mp.weixin.qq.com`）并转换为 Markdown。

## 快速开始

```bash
cd wechat-article-reader
npm install
node scripts/read_article.mjs read "https://mp.weixin.qq.com/s/你的文章ID"
```

## 说明

- 仓库仅保存技能源码，不提交 `node_modules`。
- 部分微信页面可能触发反爬或访问频率限制。

## 许可证

MIT
