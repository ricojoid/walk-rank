import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.stepLog.deleteMany();
  await prisma.user.deleteMany();

  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const hashedUserPassword = await bcrypt.hash("user123", 10);

  // 1. Create Super Admin
  const admin = await prisma.user.create({
    data: {
      name: "Super Admin TMMIN",
      email: "admin@walkrank.com",
      password: hashedAdminPassword,
      role: Role.SUPER_ADMIN,
      department: "Management",
      dailyGoal: 10000,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 2. Create Regular Users
  const usersData = [
    {
      name: "Budi Santoso",
      email: "budi@walkrank.com",
      department: "Engineering",
      dailyGoal: 8000,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Siti Rahma",
      email: "siti@walkrank.com",
      department: "Quality Control",
      dailyGoal: 8000,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Andi Wijaya",
      email: "andi@walkrank.com",
      department: "Assembly Line",
      dailyGoal: 8000,
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Dewi Lestari",
      email: "dewi@walkrank.com",
      department: "Logistics",
      dailyGoal: 8000,
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Fajar Pratama",
      email: "fajar@walkrank.com",
      department: "Maintenance",
      dailyGoal: 8000,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Rina Kusuma",
      email: "rina@walkrank.com",
      department: "HR & GA",
      dailyGoal: 8000,
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashedUserPassword,
        role: Role.USER,
        department: u.department,
        dailyGoal: u.dailyGoal,
        avatarUrl: u.avatarUrl,
      },
    });
    createdUsers.push(user);
  }

  // Also include admin in step logger test
  const allWalkers = [admin, ...createdUsers];

  const sampleNotes = [
    "Morning jog keliling area pabrik",
    "Patroli 5S & safety walk",
    "Jalan kaki ke stasiun & kantor",
    "Aktivitas lapangan & inventory check",
    "Jogging sore setelah jam kerja",
    "Car Free Day akhir pekan",
    "Langkah harian normal",
    "Strolling malam di komplek",
  ];

  // 3. Generate 30 days of realistic step history for each user
  const today = new Date();
  const stepLogsToInsert = [];

  for (const user of allWalkers) {
    // Each user has a base performance multiplier
    const baseSteps = user.dailyGoal;
    const variance = 0.35;

    for (let i = 29; i >= 0; i--) {
      // Create date without time (00:00:00 UTC)
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateOnly = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

      // Random factor
      const factor = 0.7 + Math.random() * 0.7; // 0.7x to 1.4x of goal
      const stepCount = Math.max(2500, Math.round(baseSteps * factor));
      const distanceKm = Number((stepCount * 0.00076).toFixed(2));
      const calories = Math.round(stepCount * 0.042);
      const note = sampleNotes[Math.floor(Math.random() * sampleNotes.length)];

      stepLogsToInsert.push({
        userId: user.id,
        date: dateOnly,
        stepCount,
        distanceKm,
        calories,
        note: i === 0 ? "Target langkah hari ini tercatat!" : note,
      });
    }
  }

  await prisma.stepLog.createMany({
    data: stepLogsToInsert,
  });

  console.log(`✅ Seeding finished!`);
  console.log(`- Created ${allWalkers.length} users (1 Super Admin, ${createdUsers.length} Users)`);
  console.log(`- Created ${stepLogsToInsert.length} step logs across 30 days`);
  console.log(`\nDemo Credentials:`);
  console.log(`🔑 Super Admin: admin@walkrank.com / admin123`);
  console.log(`👤 User Demo: budi@walkrank.com / user123 (or siti@walkrank.com, andi@walkrank.com)`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
