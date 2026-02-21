#!/usr/bin/env node
/**
 * Self-check script for walkie-openclaw-adapter v2
 * Run this after installation to verify all requirements are met
 * 
 * Exit codes:
 *   0 = all checks passed
 *   1 = warnings only (partial pass)
 *   2 = critical failures (must fix before production)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_ROOT = './skills/walkie-openclaw-adapter';
const CONFIG_PATH = path.join(SKILL_ROOT, 'references/config.json');
const STATE_PATH = path.join(SKILL_ROOT, 'references/state.json');
const AUDIT_LOG = path.join(SKILL_ROOT, 'references/audit.log');
const AUDIT_CURSOR = path.join(SKILL_ROOT, 'references/audit.cursor');

let warnings = [];
let errors = [];

function check(name, fn) {
  try {
    const result = fn();
    if (result.pass) {
      console.log(`✅ ${name}`);
    } else {
      if (result.critical) {
        errors.push(result.message);
        console.log(`❌ ${name}: ${result.message}`);
      } else {
        warnings.push(result.message);
        console.log(`⚠️  ${name}: ${result.message}`);
      }
    }
  } catch (e) {
    errors.push(`${name} threw: ${e.message}`);
    console.log(`❌ ${name}: ERROR - ${e.message}`);
  }
}

function readJson(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    return null;
  }
}

console.log('🔍 Walkie Adapter Self-Check (v2)\n');
console.log('--- Configuration Checks ---\n');

// Check 1: Config file exists and valid
check('Config file exists', () => {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { pass: false, critical: true, message: 'config.json not found' };
  }
  const cfg = readJson(CONFIG_PATH);
  if (!cfg) {
    return { pass: false, critical: true, message: 'config.json is not valid JSON' };
  }
  if (!cfg.channel) {
    return { pass: false, critical: true, message: 'channel is not set in config.json' };
  }
  return { pass: true };
});

// Check 2: Config has callback group bound
check('Callback group configured', () => {
  const cfg = readJson(CONFIG_PATH);
  // Note: In v2, callback should be in config or confirmed via init
  // For now we check if syncHookCmd is set (indicating callback intent)
  if (!cfg.syncHookCmd) {
    return { pass: false, critical: false, message: 'syncHookCmd not set - callback sync may not work' };
  }
  return { pass: true };
});

console.log('\n--- Runtime Checks ---\n');

// Check 3: Audit files writable
check('Audit log writable', () => {
  try {
    fs.appendFileSync(AUDIT_LOG, '');
    return { pass: true };
  } catch (e) {
    return { pass: false, critical: true, message: `Cannot write to ${AUDIT_LOG}: ${e.message}` };
  }
});

// Check 4: State file writable
check('State file writable', () => {
  try {
    fs.appendFileSync(STATE_PATH, '');
    return { pass: true };
  } catch (e) {
    return { pass: false, critical: true, message: `Cannot write to ${STATE_PATH}: ${e.message}` };
  }
});

// Check 5: No duplicate reader (check for running adapter processes)
check('Single reader enforcement', () => {
  try {
    const ps = execSync('ps aux | grep -E "walkie.*read|adapter.js" | grep -v grep', { encoding: 'utf8' });
    const lines = ps.trim().split('\n').filter(l => l.length > 0);
    
    // Check if multiple processes share the same parent (adapter spawns walkie sub-process)
    // This is OK - it means single reader with its child process
    const pids = lines.map(l => {
      const match = l.match(/^\S+\s+(\d+)/);
      return match ? parseInt(match[1]) : null;
    }).filter(p => p !== null);
    
    if (lines.length > 2) {
      return { pass: false, critical: true, message: `Multiple readers detected (${lines.length} processes running) - possible race condition` };
    }
    return { pass: true };
  } catch (e) {
    // No processes found - this is actually OK for a fresh check
    return { pass: true };
  }
});

// Check 6: Systemd service (Linux) or launchd (macOS) for production
check('System service supervision', () => {
  const os = require('os');
  const isLinux = os.platform() === 'linux';
  const isMac = os.platform() === 'darwin';
  
  if (isLinux) {
    try {
      // Check both system and user systemd
      execSync('systemctl is-enabled walkie-adapter', { stdio: 'ignore' });
      return { pass: true };
    } catch (e) {
      // Check user service
      try {
        execSync('systemctl --user is-enabled walkie-adapter', { stdio: 'ignore' });
        return { pass: true };
      } catch (e2) {
        return { pass: false, critical: false, message: 'systemd service not enabled - adapter may not auto-restart on crash' };
      }
    }
  } else if (isMac) {
    try {
      execSync('launchctl list | grep walkie-adapter', { stdio: 'ignore' });
      return { pass: true };
    } catch (e) {
      return { pass: false, critical: false, message: 'launchd service not configured - adapter may not auto-restart on crash' };
    }
  }
  return { pass: false, critical: false, message: 'Unknown OS - cannot verify service supervision' };
});

// Check 7: Walkie CLI available
check('Walkie CLI available', () => {
  try {
    execSync('walkie --version', { encoding: 'utf8' });
    return { pass: true };
  } catch (e) {
    return { pass: false, critical: true, message: 'walkie CLI not installed or not in PATH' };
  }
});

// Check 8: Node.js adapter script exists
check('Adapter script exists', () => {
  const adapterPath = path.join(SKILL_ROOT, 'scripts/adapter.js');
  if (!fs.existsSync(adapterPath)) {
    return { pass: false, critical: true, message: 'adapter.js not found' };
  }
  return { pass: true };
});

console.log('\n--- Summary ---\n');

if (errors.length > 0) {
  console.log(`❌ CRITICAL FAILURES (${errors.length}):`);
  errors.forEach(e => console.log(`   - ${e}`));
  console.log('\n🔧 Fix these before running in production mode.\n');
  process.exit(2);
} else if (warnings.length > 0) {
  console.log(`⚠️  WARNINGS (${warnings.length}):`);
  warnings.forEach(w => console.log(`   - ${w}`));
  console.log('\n✅ Core checks passed. These warnings indicate potential issues but are not blocking.\n');
  process.exit(1);
} else {
  console.log('✅ All checks passed! Adapter is ready for production use.\n');
  process.exit(0);
}
