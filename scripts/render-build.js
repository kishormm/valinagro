// scripts/render-build.js
// Intended for use in Render's build command. It will:
// - Run `npm install` (Render already does this)
// - If DATABASE_URL starts with 'postgres://' or 'postgresql://', run migrations then generate
// - If DATABASE_URL starts with 'prisma://', skip `prisma migrate deploy` and run `prisma generate --data-proxy`
// - Finally run the Next.js build

const { execSync } = require('child_process');
const net = require('net');

function getEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const fs = require('fs');
    const path = require('path');
    const dotenvPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(dotenvPath)) {
      const content = fs.readFileSync(dotenvPath, 'utf8');
      const match = content.match(new RegExp('^' + name + "=(.*)$", 'm'));
      if (match) return match[1].trim().replace(/^"|"$/g, '');
    }
  } catch (e) {}
  return undefined;
}

function parseHostPort(databaseUrl) {
  try {
    const normalized = databaseUrl.match(/^postgres/) ? databaseUrl : `postgresql://${databaseUrl}`;
    const u = new URL(normalized);
    return { host: u.hostname, port: u.port || '5432' };
  } catch (e) {
    return null;
  }
}

function canConnect(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      done = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.once('error', () => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.connect(Number(port), host);
  });
}

try {
  const dbUrl = getEnv('DATABASE_URL') || '';
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    console.log('Detected Postgres URL. Checking DB reachability before running migrations...');
    const hp = parseHostPort(dbUrl);
    if (hp) {
      const reachable = await canConnect(hp.host, hp.port, 8000);
      if (reachable) {
        console.log('DB host reachable. Running migrations and prisma generate...');
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        execSync('npx prisma generate', { stdio: 'inherit' });
      } else {
        console.warn('DB host not reachable from build environment. Skipping `prisma migrate deploy`.');
        console.warn('Proceeding with `prisma generate` and build (migrations must be applied elsewhere).');
        execSync('npx prisma generate', { stdio: 'inherit' });
      }
    } else {
      console.warn('Could not parse DB host from DATABASE_URL, skipping migrations for safety.');
      execSync('npx prisma generate', { stdio: 'inherit' });
    }
  } else if (dbUrl.startsWith('prisma://')) {
    console.log('Detected Prisma Data Proxy URL. Skipping migrate; running `prisma generate --data-proxy`...');
    execSync('npx prisma generate --data-proxy', { stdio: 'inherit' });
  } else {
    console.log('No DATABASE_URL detected; running `prisma generate` only (safe default).');
    execSync('npx prisma generate', { stdio: 'inherit' });
  }

  console.log('Running Next.js build...');
  execSync('npm run build', { stdio: 'inherit' });
} catch (err) {
  console.error('render-build failed:', err.message || err);
  process.exit(1);
}
