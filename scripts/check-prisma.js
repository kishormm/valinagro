const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  env.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)=(?:"([^"]*)"|'([^']*)'|(.*))\s*$/);
    if (m) {
      const key = m[1];
      const value = m[2] ?? m[3] ?? m[4] ?? '';
      process.env[key] = value;
    }
  });
}

(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    console.log('Connecting to DB...');
    const products = await prisma.product.findMany({ take: 5 });
    console.log('Products:', products);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Prisma check failed:', err);
    process.exit(2);
  }
})();
