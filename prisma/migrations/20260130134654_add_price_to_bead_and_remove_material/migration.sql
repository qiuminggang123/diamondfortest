/*
  Warnings:

  - You are about to drop the column `materialId` on the `Bead` table. All the data in the column will be lost.
  - You are about to drop the `BeadMaterial` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `price` to the `Bead` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Bead" DROP CONSTRAINT "Bead_materialId_fkey";

-- AlterTable
ALTER TABLE "public"."Bead" DROP COLUMN "materialId",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "public"."BeadMaterial";
