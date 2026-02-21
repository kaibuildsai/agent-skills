#!/usr/bin/env node
/**
 * Read one JSON event from stdin and print a concise sync line.
 * Intended for wiring adapter `syncHookCmd`.
 */
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (buf += d));
process.stdin.on('end', () => {
  try {
    const e = JSON.parse(buf || '{}');
    const k = e.kind || 'event';
    const ch = e.channel || '-';
    const who = e.from || '-';
    const text = (e.text || e.error || '').toString().replace(/\s+/g, ' ').slice(0, 240);
    const out = `[walkie-sync] ${k} ch=${ch} from=${who} ${text}`.trim();
    console.log(out);
  } catch (err) {
    console.log(`[walkie-sync] invalid-event ${String(err.message || err)}`);
  }
});
