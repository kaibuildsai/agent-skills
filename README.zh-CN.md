# Agent Skills

日常使用 coding agents (Claude Code, OpenClaw, Codex 等) 时写的一些 skills，提高效率。

## 这是什么？

- **真实问题，真实方案**：我自己真正在用的工作流
- **minimal setup**：结构清晰，易于理解
- **可复用**：复制、修改、按需调整

## Skills

### [wechat-article-reader](./wechat-article-reader/)
读取微信公众号文章（`mp.weixin.qq.com`）→ 干净 Markdown。

**适用场景**：文章归档、LLM 总结、转可检索文本、基于提取内容问答。

### [openclaw-agent-onboarding](./openclaw-agent-onboarding/)
把 OpenClaw 升级为多 Agent 团队，不同群自动路由到对应 Agent。

**适用场景**：角色隔离、免手动 `/model` 切换、群专属路由。

### [walkie-openclaw-adapter](./walkie-openclaw-adapter/)
单读者 Walkie 适配器，把 Walkie 频道流量桥接到 OpenClaw 编排，并保留审计日志。

**适用场景**：近实时 agent 协作、避免 read 抢消息、后台协作透明同步。

### [notebooklm-slides-from-link](./notebooklm-slides-from-link/)
给一个链接新建 NotebookLM notebook，然后生成长版幻灯片。YouTube 是重要场景，但其他网页链接也可以。

**适用场景**：把 YouTube 视频整理成详细 PPT、把网页内容生成分享用 deck、按“一条链接一个 notebook”沉淀资料。

## 许可证

MIT

English: [`README.md`](./README.md)
