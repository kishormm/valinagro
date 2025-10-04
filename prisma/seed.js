// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding for the new hierarchy...');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password', salt);

  // --- 1. Create the User Hierarchy ---
  const admin = await prisma.user.upsert({
    where: { userId: 'admin' },
    update: {},
    create: {
      userId: 'admin',
      name: 'Admin User',
      password: hashedPassword,
      role: 'Admin',
    },
  });

  const franchise = await prisma.user.upsert({
    where: { userId: 'FRN1001' },
    update: { uplineId: admin.id },
    create: {
      userId: 'FRN1001',
      name: 'Main Franchise',
      password: hashedPassword,
      role: 'Franchise',
      uplineId: admin.id,
    },
  });

  const distributor = await prisma.user.upsert({
    where: { userId: 'DIS3309' },
    update: { uplineId: franchise.id },
    create: {
      userId: 'DIS3309',
      name: 'Kishor Distributor',
      password: hashedPassword,
      role: 'Distributor',
      uplineId: franchise.id,
    },
  });

  const subDistributor = await prisma.user.upsert({
    where: { userId: 'SUB5555' },
    update: { uplineId: distributor.id },
    create: {
      userId: 'SUB5555',
      name: 'Sub Distributor One',
      password: hashedPassword,
      role: 'SubDistributor',
      uplineId: distributor.id,
    },
  });

  const dealer = await prisma.user.upsert({
    where: { userId: 'DLR789' },
    update: { uplineId: subDistributor.id },
    create: {
      userId: 'DLR789',
      name: 'Rohan Dealer',
      password: hashedPassword,
      role: 'Dealer',
      uplineId: subDistributor.id,
    },
  });

  const farmer = await prisma.user.upsert({
    where: { userId: 'FRM456' },
    update: { uplineId: dealer.id },
    create: {
      userId: 'FRM456',
      name: 'Aditya Farmer',
      password: hashedPassword,
      role: 'Farmer',
      uplineId: dealer.id,
    },
  });

  // --- SECTIONS FOR CREATING PRODUCTS AND INVENTORY HAVE BEEN REMOVED ---
  
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });