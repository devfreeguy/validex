-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnalysisTier" ADD VALUE 'security';
ALTER TYPE "AnalysisTier" ADD VALUE 'trust';
ALTER TYPE "AnalysisTier" ADD VALUE 'web';
ALTER TYPE "AnalysisTier" ADD VALUE 'engineering';
ALTER TYPE "AnalysisTier" ADD VALUE 'ai';
ALTER TYPE "AnalysisTier" ADD VALUE 'compare';

-- CreateTable
CREATE TABLE "comparisons" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "targets" TEXT[],
    "targetCount" INTEGER NOT NULL,
    "ranking" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comparisons_comparisonId_key" ON "comparisons"("comparisonId");

-- CreateIndex
CREATE INDEX "comparisons_comparisonId_idx" ON "comparisons"("comparisonId");
