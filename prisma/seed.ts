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
  await prisma.activity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: { name: "Alice Chan", role: "ADMIN" },
  });

  const sales1 = await prisma.user.create({
    data: { name: "Bob Lee", role: "SALES" },
  });

  const sales2 = await prisma.user.create({
    data: { name: "Carol Wong", role: "SALES" },
  });

  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        storeName: "Pho Saigon",
        industry: "F_AND_B",
        address: "G/F, 18 Kimberley Road, Tsim Sha Tsui, Kowloon",
        status: "CONTACTED",
        googleMapsUrl: "https://maps.google.com/?q=Pho+Saigon+Tsim+Sha+Tsui",
        assignedToId: sales1.id,
      },
    }),
    prisma.lead.create({
      data: {
        storeName: "Skin Lux Medical Beauty",
        industry: "MEDICAL_BEAUTY",
        address: "Unit 5, 3/F, 100 Queen's Road Central, Hong Kong",
        status: "DEMO",
        googleMapsUrl: "https://maps.google.com/?q=Skin+Lux+Medical+Beauty",
        assignedToId: sales1.id,
      },
    }),
    prisma.lead.create({
      data: {
        storeName: "Blossom Beauty Studio",
        industry: "BEAUTY",
        address: "Shop 2, 45 Lockhart Road, Wan Chai, Hong Kong",
        status: "LEAD",
        assignedToId: sales2.id,
      },
    }),
    prisma.lead.create({
      data: {
        storeName: "Happy Foot Reflexology",
        industry: "FOOT",
        address: "1/F, 88 Nathan Road, Mong Kok, Kowloon",
        status: "CLOSED_WON",
        googleMapsUrl: "https://maps.google.com/?q=Happy+Foot+Reflexology",
        openRiceUrl: "https://www.openrice.com/",
        assignedToId: sales2.id,
      },
    }),
    prisma.lead.create({
      data: {
        storeName: "The Dumpling House",
        industry: "F_AND_B",
        address: "G/F, 23 Elgin Street, SoHo, Hong Kong",
        status: "CLOSED_LOST",
        assignedToId: sales2.id,
      },
    }),
  ]);

  await prisma.activity.createMany({
    data: [
      {
        leadId: leads[0].id,
        type: "WALK_IN",
        notes: "Spoke with manager. Interested in POS system. Follow up next week.",
      },
      {
        leadId: leads[1].id,
        type: "PHONE",
        notes: "Initial call. Owner requested a formal proposal.",
      },
      {
        leadId: leads[1].id,
        type: "WHATSAPP",
        notes: "Sent proposal PDF. Awaiting response.",
      },
      {
        leadId: leads[3].id,
        type: "WALK_IN",
        notes: "Contract signed. Onboarding scheduled for next month.",
      },
    ],
  });

  console.log(`Seeded:`);
  console.log(`  Users: 1 ADMIN (${admin.name}), 2 SALES (${sales1.name}, ${sales2.name})`);
  console.log(`  Leads: ${leads.length} across F&B, Medical Beauty, Beauty, Foot industries`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
