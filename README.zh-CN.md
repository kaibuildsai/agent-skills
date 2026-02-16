# Agent Skills（中文）

实用型的开源 Agent Skills 仓库。

## 这个仓库的目标

- **先有用，再炫技**：解决真实场景问题
- **体积小、结构清晰**：易读易改
- **可复用**：拿去即用，按需二改

## 当前技能

### `wechat-article-reader`
读取微信公众号文章（`mp.weixin.qq.com`），输出干净的 Markdown。

**适用场景**
- 文章归档到知识库
- 给 LLM 做总结/提炼
- 把链接转成可检索文本

## 快速开始

```bash
git clone https://github.com/kaibuildsai/agent-skills.git
cd agent-skills/wechat-article-reader
npm install
node scripts/read_article.mjs read "https://mp.weixin.qq.com/s/你的文章ID"
```

## 输出

标准输出 Markdown（标题、作者、正文）。

## 说明

- 仓库不提交 `node_modules`
- 部分页面可能触发反爬/限频

## 许可证

MIT

English: [`README.md`](./README.md)
