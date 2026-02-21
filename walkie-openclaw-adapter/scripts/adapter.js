#!/usr/bin/env node
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const cfgPath = process.argv[2] || path.join(__dirname, '..', 'references', 'config.json');
if (!fs.existsSync(cfgPath)) {
  console.error(`Missing config: ${cfgPath}`);
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

const logPath = cfg.auditLog || path.join(__dirname, '..', 'references', 'audit.log');
const statePath = cfg.stateFile || path.join(__dirname, '..', 'references', 'state.json');
const state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { startedAt: new Date().toISOString() };

function saveState() {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function sh(cmd, args, stdinText) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';

    if (stdinText) p.stdin.write(stdinText);
    p.stdin.end();

    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => (code === 0 ? resolve(out.trim()) : reject(new Error(err || out || `exit ${code}`))));
  });
}

function parseWalkieLine(line) {
  const m = line.match(/^\[(.*?)\]\s+([a-z0-9]+):\s+([\s\S]+)$/i);
  if (!m) return null;
  return { at: m[1], from: m[2], text: m[3].trim() };
}

function appendAudit(evt) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...evt });
  fs.appendFileSync(logPath, line + '\n');
  console.log('SYNC', line);
  return line;
}

async function runSyncHook(eventObj) {
  if (!cfg.syncHookCmd) return;
  try {
    await sh('bash', ['-lc', cfg.syncHookCmd], JSON.stringify(eventObj));
  } catch (e) {
    appendAudit({ kind: 'error', where: 'syncHook', error: String(e.message || e) });
  }
}

async function send(text, meta = {}) {
  await sh('walkie', ['send', cfg.channel, text]);
  const evt = { kind: 'send', channel: cfg.channel, text, ...meta };
  appendAudit(evt);
  await runSyncHook(evt);
}

function buildAutoReply(text) {
  // 通用模式：仅处理结构化 task 包；不内置任何具体业务（例如猜谜、翻译等）
  try {
    const j = JSON.parse(text);
    if (j && j.type === 'task' && cfg.autoReplyMode === 'ack-task') {
      return JSON.stringify({
        v: 1,
        type: 'result',
        task_id: j.task_id || null,
        ok: true,
        status: 'accepted',
        note: 'task received by adapter'
      });
    }
  } catch {}
  return null;
}

async function loop() {
  appendAudit({ kind: 'start', channel: cfg.channel, mode: 'single-reader' });
  while (true) {
    try {
      const out = await sh('walkie', ['read', cfg.channel, '--wait']);
      const lines = out.split('\n').map((s) => s.trim()).filter(Boolean);

      for (const line of lines) {
        const msg = parseWalkieLine(line);
        if (!msg) continue;

        const evt = { kind: 'recv', channel: cfg.channel, ...msg };
        appendAudit(evt);
        await runSyncHook(evt);

        if (cfg.autoReply === true) {
          const reply = buildAutoReply(msg.text);
          if (reply) await send(reply, { reason: 'autoReply' });
        }
      }

      state.lastReadAt = new Date().toISOString();
      saveState();
    } catch (e) {
      appendAudit({ kind: 'error', where: 'loop', error: String(e.message || e) });
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
}

loop();
