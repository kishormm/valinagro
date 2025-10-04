// scripts/prisma-postinstall.js
// Runs after npm install. If DATABASE_URL starts with prisma://, run prisma generate --data-proxy
// otherwise run a normal prisma generate. This avoids the P1012 schema validation error when
// using Prisma Data Proxy on platforms like Render that run `prisma migrate deploy` during build.

const { execSync } = require('child_process');

function getEnv(name) {
  if (process.env[name]) return process.env[name];
  // Try to load from .env file in project root if present
  try {
    const fs = require('fs');
    const path = require('path');
    const dotenvPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(dotenvPath)) {
      const content = fs.readFileSync(dotenvPath, 'utf8');
      const match = content.match(new RegExp('^' + name + "=(.*)$", 'm'));
      if (match) return match[1].trim();
    }
  } catch (e) {
    // ignore
  }
  return undefined;
}

try {
  const dbUrl = getEnv('DATABASE_URL');
  if (dbUrl && dbUrl.startsWith('prisma://')) {
    console.log('Detected prisma Data Proxy URL. Running `prisma generate --data-proxy`...');
    execSync('npx prisma generate --data-proxy', { stdio: 'inherit' });
  } else {
    console.log('Running `prisma generate`...');
    execSync('npx prisma generate', { stdio: 'inherit' });
  }
} catch (err) {
  console.error('prisma-postinstall script failed:', err.message || err);
  // Do not fail the install; log for debugging.
}
