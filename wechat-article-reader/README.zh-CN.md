# wechat-article-reader（中文）

把微信公众号文章提取为干净的 Markdown。

## 功能

- 抓取 `mp.weixin.qq.com` 文章页面
- 提取标题、作者、正文
- 将 HTML 转为 Markdown

## 命令

```bash
npm install
node scripts/read_article.mjs read "https://mp.weixin.qq.com/s/你的文章ID"
```

## 输出示例

```md
# 文章标题

**作者：** 作者名

...正文...
```

## 提示

- 遇到反爬/限频可稍后重试
- 提取失败可能是微信页面结构变更

English: [`README.md`](./README.md)
