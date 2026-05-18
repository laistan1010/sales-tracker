/**
 * One-time migration: converts existing Lead.appointmentDate/Time/Notes
 * records into Task rows (type = MEETING).
 *
 * Run ONCE after deploying the Task feature:
 *   npx tsx scripts/migrate-appointments.ts
 *
 * Safe to re-run — skips leads that already have tasks.
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const leads = await prisma.lead.findMany({
    where: { appointmentDate: { not: null } },
    select: {
      id:              true,
      storeName:       true,
      appointmentDate: true,
      appointmentTime: true,
      appointmentNotes: true,
      tasks:           { select: { id: true }, take: 1 },
    },
  });

  console.log(`Found ${leads.length} lead(s) with appointmentDate set.`);

  let migrated = 0;
  let skipped  = 0;

  for (const lead of leads) {
    if (lead.tasks.length > 0) {
      console.log(`  SKIP  ${lead.storeName} — already has task(s)`);
      skipped++;
      continue;
    }
    await prisma.task.create({
      data: {
        leadId: lead.id,
        type:   "MEETING",
        date:   lead.appointmentDate!,
        time:   lead.appointmentTime  ?? null,
        notes:  lead.appointmentNotes ?? null,
      },
    });
    console.log(`  OK    ${lead.storeName} → MEETING on ${lead.appointmentDate}`);
    migrated++;
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
