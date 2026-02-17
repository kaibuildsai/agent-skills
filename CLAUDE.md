# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Skills is a collection of practical, open-source skills for coding agents. Each skill is a self-contained tool that agents can use to perform specific tasks.

## Skills

### `wechat-article-reader`
Extracts full text from WeChat Official Account articles (`mp.weixin.qq.com`) and outputs clean Markdown.

**Setup:**
```bash
cd wechat-article-reader
npm install
npx playwright install chromium
```

**Run:**
```bash
node scripts/read_article.mjs read "<wechat-article-url>"
```

Output is printed to stdout as Markdown (title, author, body). Uses Playwright for browser automation and Turndown for HTML-to-Markdown conversion.

### `openclaw-agent-onboarding`
Documentation skill for onboarding OpenClaw into a role-based multi-agent team. Contains a detailed workflow in `SKILL.md` for:
- Creating new agents with `openclaw agents add`
- Discovering group peer IDs from `openclaw status --json`
- Safely updating `~/.openclaw/openclaw.json` bindings with `jq` patches
- Validating routing and model configuration after daemon restart

## Code Structure

```
/home/lighthouse/app/projects/agent-skills/
├── wechat-article-reader/
│   ├── scripts/read_article.mjs   # Main entry point
│   ├── package.json
│   └── SKILL.md                  # Skill metadata
├── openclaw-agent-onboarding/
│   └── SKILL.md                  # Full workflow documentation
└── openclaw-agent-binding/       # Empty placeholder
```

## Common Commands

```bash
# Install dependencies for wechat-article-reader
cd wechat-article-reader && npm install

# Install Playwright browser
cd wechat-article-reader && npx playwright install chromium

# Run WeChat article reader
node wechat-article-reader/scripts/read_article.mjs read "<url>"
```
