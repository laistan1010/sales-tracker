import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Rename admin
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) {
    await prisma.user.update({ where: { id: admin.id }, data: { name: "Koo Yuet Tech" } });
    console.log(`Renamed admin: ${admin.name} → Koo Yuet Tech`);
  }

  // Rename Bob Lee → Stan
  const bob = await prisma.user.findFirst({ where: { name: "Bob Lee" } });
  if (bob) {
    await prisma.user.update({ where: { id: bob.id }, data: { name: "Stan" } });
    console.log(`Renamed: Bob Lee → Stan`);
  }

  // Rename Carol Wong → Alan
  const carol = await prisma.user.findFirst({ where: { name: "Carol Wong" } });
  if (carol) {
    await prisma.user.update({ where: { id: carol.id }, data: { name: "Alan" } });
    console.log(`Renamed: Carol Wong → Alan`);
  }

  // Create new SALES accounts
  const existing = await prisma.user.findMany({ select: { name: true } });
  const existingNames = existing.map(u => u.name);

  for (const name of ["Eddie", "Archer"]) {
    if (!existingNames.includes(name)) {
      await prisma.user.create({ data: { name, role: "SALES" } });
      console.log(`Created: ${name} (SALES)`);
    } else {
      console.log(`Skipped (already exists): ${name}`);
    }
  }

  const all = await prisma.user.findMany({ orderBy: { role: "asc" } });
  console.log("\nFinal user list:");
  all.forEach(u => console.log(`  [${u.role}] ${u.name} (${u.id})`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
