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
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { rounds: 0 };

function sh(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => (code === 0 ? resolve(out.trim()) : reject(new Error(err || out || `exit ${code}`))));
  });
}

function audit(evt) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...evt });
  fs.appendFileSync(logPath, line + '\n');
  console.log('SYNC', line);
}

function saveState() {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function parseWalkieLine(line) {
  const m = line.match(/^\[(.*?)\]\s+([a-z0-9]+):\s+([\s\S]+)$/i);
  if (!m) return null;
  return { at: m[1], from: m[2], text: m[3].trim() };
}

async function send(text) {
  await sh('walkie', ['send', cfg.channel, text]);
  audit({ kind: 'send', channel: cfg.channel, text });
}

function decideReply(text) {
  try {
    const j = JSON.parse(text);
    if (j.type === 'task' && j.intent === 'riddle_round') {
      const answer = '球门';
      return JSON.stringify({ v: 1, type: 'result', task_id: j.task_id, ok: true, output: { answer } });
    }
    if (j.type === 'task' && j.intent === 'ping') {
      return JSON.stringify({ v: 1, type: 'result', task_id: j.task_id, ok: true, output: { pong: true } });
    }
    return null;
  } catch {}

  const r = text.match(/R(\d+)/i);
  if (r) {
    const round = Number(r[1]);
    state.rounds = Math.max(state.rounds, round);
    saveState();

    if (/越洗越脏/.test(text)) return `R${round} A: 水`;
    if (/越冷越热/.test(text)) return `R${round} A: 火`;
    if (/什么门永远关不上/.test(text)) return `R${round} A: 球门`;
    return `R${round} A: 我先猜一个：影子？（不确定）`;
  }

  return null;
}

async function loop() {
  audit({ kind: 'start', channel: cfg.channel, mode: 'single-reader' });
  while (true) {
    try {
      const out = await sh('walkie', ['read', cfg.channel, '--wait']);
      const lines = out.split('\n').map((s) => s.trim()).filter(Boolean);
      for (const line of lines) {
        const msg = parseWalkieLine(line);
        if (!msg) continue;
        audit({ kind: 'recv', channel: cfg.channel, ...msg });

        const reply = decideReply(msg.text);
        if (reply && cfg.autoReply) {
          await send(reply);
        }
      }
    } catch (e) {
      audit({ kind: 'error', error: String(e.message || e) });
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

loop();
