#!/usr/bin/env node
/**
 * Sync Hook for WhatsApp - Send messages to WhatsApp group via OpenClaw CLI
 * 
 * Usage: Configure in config.json:
 * {
 *   "syncHookCmd": "node /path/to/sync-hook-whatsapp.js",
 *   "syncGroupId": "YOUR_WHATSAPP_GROUP_ID"
 * }
 * 
 * Reads event from stdin, formats, and sends to configured WhatsApp group.
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('path');

// Try to find config.json in typical locations
const possiblePaths = [
  path.join(__dirname, '..', 'references', 'config.json'),
  path.join(process.cwd(), 'skills/walkie-openclaw-adapter/references/config.json'),
  './references/config.json',
  '../../references/config.json'
];

let config = {};
for (const p of possiblePaths) {
  try {
    if (fs.existsSync(p)) {
      config = JSON.parse(fs.readFileSync(p, 'utf8'));
      break;
    }
  } catch (e) {}
}

const GROUP_ID = config.syncGroupId || process.env.SYNC_GROUP_ID;

if (!GROUP_ID) {
  console.error('Error: syncGroupId not configured. Add to config.json or set SYNC_GROUP_ID env var.');
  process.exit(1);
}

// Read event from stdin
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (buf += d));
process.stdin.on('end', async () => {
  try {
    const e = JSON.parse(buf || '{}');
    const msg = formatMessage(e);
    
    if (msg) {
      await sendToWhatsApp(msg);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
});

function formatMessage(e) {
  const kind = e.kind || 'event';
  const text = e.text || e.error || '';
  
  if (kind === 'recv') {
    return `[walkie] 收到: ${text}`;
  } else if (kind === 'send') {
    return `[walkie] 动作: 已发送 -> ${text}`;
  } else if (kind === 'error') {
    return `[walkie] 错误: ${text}`;
  }
  
  return null;
}

function sendToWhatsApp(message) {
  return new Promise((resolve, reject) => {
    // Use OpenClaw CLI to send message
    const openclaw = spawn('openclaw', [
      'message', 'send',
      '--channel', 'whatsapp',
      '--target', GROUP_ID,
      '--message', message
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    openclaw.stdout.on('data', (d) => { stdout += d.toString(); });
    openclaw.stderr.on('data', (d) => { stderr += d.toString(); });

    openclaw.on('close', (code) => {
      if (code === 0) {
        console.log(`Sent to ${GROUP_ID}: ${message.slice(0, 50)}...`);
        resolve();
      } else {
        console.error(`Error: ${stderr || stdout}`);
        reject(new Error(`Exit code ${code}: ${stderr || stdout}`));
      }
    });

    openclaw.on('error', (err) => {
      console.error(`Spawn error: ${err.message}`);
      reject(err);
    });
  });
}
