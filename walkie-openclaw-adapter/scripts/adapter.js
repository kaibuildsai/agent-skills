#!/usr/bin/env node
/**
 * Walkie Adapter - Single-reader mode with audit + sync + policy engine
 */
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

state.runtime = state.runtime || {
  consecutiveErrors: 0,
  roundsByTraceId: {},
  taskStartByTraceId: {}
};

const defaultPolicy = {
  levels: { L1: 'auto', L2: 'auto', L3: 'require_human' },
  stopConditions: {
    maxRounds: 20,
    maxTaskMinutes: 30,
    maxConsecutiveErrors: 3,
    cooldownSeconds: 10
  },
  allowIntents: ['qa', 'summarize', 'translate', 'game', 'status', 'chat'],
  denyIntents: ['delete', 'publish', 'payment', 'external_sensitive']
};

const policy = {
  ...defaultPolicy,
  ...(cfg.policy || {}),
  levels: { ...defaultPolicy.levels, ...((cfg.policy || {}).levels || {}) },
  stopConditions: { ...defaultPolicy.stopConditions, ...((cfg.policy || {}).stopConditions || {}) },
  allowIntents: (cfg.policy && cfg.policy.allowIntents) || defaultPolicy.allowIntents,
  denyIntents: (cfg.policy && cfg.policy.denyIntents) || defaultPolicy.denyIntents
};

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

function classifyTask(task) {
  const intent = (task.intent || 'chat').toLowerCase();
  if (policy.denyIntents.includes(intent) || task.risk === 'L3') return { intent, level: 'L3' };
  if (policy.allowIntents.includes(intent)) return { intent, level: 'L1' };
  return { intent, level: 'L2' };
}

function evaluateStopConditions(traceId) {
  const sc = policy.stopConditions;
  if (state.runtime.consecutiveErrors >= sc.maxConsecutiveErrors) return 'MAX_CONSECUTIVE_ERRORS';

  if (!traceId) return null;
  const rounds = state.runtime.roundsByTraceId[traceId] || 0;
  if (rounds >= sc.maxRounds) return 'MAX_ROUNDS_REACHED';

  const startAt = state.runtime.taskStartByTraceId[traceId];
  if (startAt) {
    const elapsedMin = (Date.now() - new Date(startAt).getTime()) / 60000;
    if (elapsedMin >= sc.maxTaskMinutes) return 'MAX_TASK_MINUTES_REACHED';
  }

  return null;
}

function buildResult(task, payload) {
  return JSON.stringify({
    v: 1,
    type: 'result',
    task_id: task.task_id || null,
    trace_id: task.trace_id || null,
    ts: new Date().toISOString(),
    ...payload
  });
}

function buildAutoReply(text) {
  let j;
  try { j = JSON.parse(text); } catch { return null; }
  if (!j || j.type !== 'task') return null;

  const traceId = j.trace_id || j.task_id || 'default';
  if (!state.runtime.taskStartByTraceId[traceId]) {
    state.runtime.taskStartByTraceId[traceId] = new Date().toISOString();
  }
  state.runtime.roundsByTraceId[traceId] = (state.runtime.roundsByTraceId[traceId] || 0) + 1;

  const stopReason = evaluateStopConditions(traceId);
  if (stopReason) {
    return buildResult(j, {
      ok: false,
      status: 'wait',
      reason: stopReason,
      note: 'stopped by policy stop conditions, requires human review'
    });
  }

  const { intent, level } = classifyTask(j);
  const decision = policy.levels[level] || 'require_human';

  if (decision !== 'auto') {
    return buildResult(j, {
      ok: false,
      status: 'wait',
      reason: `POLICY_${level}`,
      note: `intent=${intent} level=${level} requires human approval`
    });
  }

  if (cfg.autoReplyMode === 'ack-task') {
    return buildResult(j, {
      ok: true,
      status: 'accepted',
      note: `auto executed by policy (intent=${intent}, level=${level})`
    });
  }

  return null;
}

async function sendAndAudit(text, reason) {
  await sh('walkie', ['send', cfg.channel, text]);
  const sendEvt = { kind: 'send', channel: cfg.channel, text, reason };
  appendAudit(sendEvt);
  await runSyncHook(sendEvt);
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

        if (cfg.autoReply === true || cfg.autoExecute === true) {
          const reply = buildAutoReply(msg.text);
          if (reply) await sendAndAudit(reply, 'policy-auto-reply');
        }
      }

      state.lastReadAt = new Date().toISOString();
      state.runtime.consecutiveErrors = 0;
      saveState();
    } catch (e) {
      state.runtime.consecutiveErrors += 1;
      appendAudit({ kind: 'error', where: 'loop', error: String(e.message || e) });
      saveState();
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
}

loop();
