const { PrismaClient } = require('@prisma/client');

// --- IMPORTANT ---
// Paste the EXACT same connection string from your Vercel Environment Variables here.
const connectionString = "postgresql://postgres:VishalDaware1307@db.vkleypotizernyilhhtg.supabase.co:5432/postgres";

console.log("Attempting to connect to the database...");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

async function main() {
  try {
    // The most basic query to test the connection
    await prisma.$connect();
    console.log("✅ Connection successful!");
    
    // Optional: A simple query to be extra sure
    const firstUser = await prisma.User.findFirst(); // Change 'user' to a real model name in your schema
    if (firstUser) {
        console.log("✅ Successfully queried a record:", firstUser);
    } else {
        console.log("✅ Query successful, but no records were found in the 'user' table.");
    }

  } catch (error) {
    console.error("❌ FAILED TO CONNECT:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();