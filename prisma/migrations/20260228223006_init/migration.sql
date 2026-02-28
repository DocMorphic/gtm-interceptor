-- CreateTable
CREATE TABLE "SearchRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'running',
    "companiesFound" INTEGER NOT NULL DEFAULT 0,
    "contactsFound" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "industry" TEXT,
    "employeeCount" TEXT,
    "region" TEXT,
    "description" TEXT,
    "fitScore" INTEGER NOT NULL DEFAULT 0,
    "fitReason" TEXT,
    "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "linkedinUrl" TEXT NOT NULL,
    "relevanceScore" INTEGER NOT NULL DEFAULT 0,
    "whyContact" TEXT,
    "companyId" TEXT NOT NULL,
    "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_linkedinUrl_key" ON "Company"("linkedinUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_linkedinUrl_key" ON "Contact"("linkedinUrl");
