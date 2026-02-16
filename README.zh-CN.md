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
- 结合 OpenClaw 对同一篇页面内容做问答
- 先提取再问答，绕过直接网页访问受限的场景

### `openclaw-agent-onboarding`
一步步把 OpenClaw 从“单个助手”升级为“多助理团队”，让不同群自动由对应的专属 Agent 接待（适用于任何支持 `group` 的 channel，飞书/WhatsApp 只是示例）。

**适用场景**
- 搭建“编程/投研/日常助理”分工团队，隔离记忆与角色
- 在群聊中免手动 `/model` 切换
- 用“暗号 + 日志”方式精准定位目标群 `peer.id`
- 自动化修改 `~/.openclaw/openclaw.json`（先备份，再更新）
- 重启并验证路由是否生效

## 快速开始

```bash
git clone https://github.com/kaibuildsai/agent-skills.git
cd agent-skills/wechat-article-reader
npm install
node scripts/read_article.mjs read "https://mp.weixin.qq.com/s/你的文章ID"
```

## 输出

标准输出 Markdown（标题、作者、正文）。

## 许可证

MIT

English: [`README.md`](./README.md)
