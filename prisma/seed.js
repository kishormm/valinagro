const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding initial admin user...');

  const adminPassword = 'sachin123';
  const salt = await bcrypt.genSalt(10);
  const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);
  
  
  const admin = await prisma.user.upsert({
    where: { userId: 'sachinj' }, 
    update: {
        name: 'Sachin Jadhav',
        password: hashedAdminPassword,
        role: 'Admin', 
    },
    create: {
      userId: 'sachinj', 
      name: 'Sachin Jadhav',
      password: hashedAdminPassword, 
      role: 'Admin',
    },
  });

  console.log(`Admin user '${admin.name}' with ID '${admin.userId}' has been created/updated.`);
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

