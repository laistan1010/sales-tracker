/*
  Warnings:

  - You are about to drop the column `picName` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `picPhone` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `picTitle` on the `Lead` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "picName",
DROP COLUMN "picPhone",
DROP COLUMN "picTitle",
ALTER COLUMN "address" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "phone" TEXT,
    "leadId" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
