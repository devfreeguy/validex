-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AnalysisTier" AS ENUM ('quick', 'full');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('pending', 'running', 'completed', 'partial', 'failed');

-- CreateEnum
CREATE TYPE "ValidatorCategory" AS ENUM ('website', 'engineering', 'security', 'trust', 'growth');

-- CreateEnum
CREATE TYPE "ValidatorResultStatus" AS ENUM ('success', 'unavailable', 'error');

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "tier" "AnalysisTier" NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'pending',
    "target" TEXT NOT NULL,
    "domain" TEXT,
    "canonicalUrl" TEXT,
    "companyName" TEXT,
    "refresh" BOOLEAN NOT NULL DEFAULT false,
    "sections" TEXT[],
    "score" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "grade" TEXT,
    "algorithmVersion" TEXT NOT NULL,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "result" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validator_results" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "validatorId" TEXT NOT NULL,
    "category" "ValidatorCategory" NOT NULL,
    "status" "ValidatorResultStatus" NOT NULL,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "evidence" JSONB,
    "source" JSONB,
    "metadata" JSONB,
    "ttl" INTEGER,
    "cachedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validator_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analyses_analysisId_key" ON "analyses"("analysisId");

-- CreateIndex
CREATE INDEX "analyses_analysisId_idx" ON "analyses"("analysisId");

-- CreateIndex
CREATE INDEX "analyses_domain_status_idx" ON "analyses"("domain", "status");

-- CreateIndex
CREATE INDEX "validator_results_analysisId_idx" ON "validator_results"("analysisId");

-- CreateIndex
CREATE INDEX "validator_results_validatorId_idx" ON "validator_results"("validatorId");

-- AddForeignKey
ALTER TABLE "validator_results" ADD CONSTRAINT "validator_results_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("analysisId") ON DELETE RESTRICT ON UPDATE CASCADE;

