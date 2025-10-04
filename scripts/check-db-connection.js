// scripts/check-db-connection.js
// Simple TCP connectivity check for the DATABASE_URL host:port
// Usage: node scripts/check-db-connection.js

const net = require('net');

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.replace(/^"|"$/g, '');
  try {
    const fs = require('fs');
    const path = require('path');
    const dotenvPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(dotenvPath)) {
      const content = fs.readFileSync(dotenvPath, 'utf8');
      const m = content.match(/^DATABASE_URL=(.*)$/m);
      if (m) return m[1].trim().replace(/^"|"$/g, '');
    }
  } catch (e) {}
  return null;
}

function parseHostPort(databaseUrl) {
  try {
    // Normalize non-URL-friendly strings by ensuring protocol
    const normalized = databaseUrl.match(/^postgres/) ? databaseUrl : `postgresql://${databaseUrl}`;
    const u = new URL(normalized);
    return { host: u.hostname, port: u.port || '5432' };
  } catch (e) {
    return null;
  }
}

async function check(host, port, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let handled = false;
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      handled = true;
      socket.destroy();
      resolve();
    });
    socket.once('timeout', () => {
      if (!handled) {
        handled = true;
        socket.destroy();
        reject(new Error('timeout'));
      }
    });
    socket.once('error', (err) => {
      if (!handled) {
        handled = true;
        socket.destroy();
        reject(err);
      }
    });
    socket.connect(Number(port), host);
  });
}

async function main() {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    console.error('DATABASE_URL not found in environment nor .env');
    process.exit(2);
  }
  const hp = parseHostPort(dbUrl);
  if (!hp) {
    console.error('Failed to parse host/port from DATABASE_URL:', dbUrl);
    process.exit(2);
  }
  console.log(`Checking TCP connectivity to ${hp.host}:${hp.port} ...`);
  try {
    await check(hp.host, hp.port, 8000);
    console.log('SUCCESS: TCP connection established (port is reachable)');
    process.exit(0);
  } catch (err) {
    console.error('FAILED: could not connect to host:port');
    console.error('error:', err.message || err);
    process.exit(1);
  }
}

main();
