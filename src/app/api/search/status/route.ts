import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const latestRun = await prisma.searchRun.findFirst({
    orderBy: { startedAt: "desc" },
  });

  const totalCompanies = await prisma.company.count();
  const totalContacts = await prisma.contact.count();

  return NextResponse.json({
    latestRun,
    totalCompanies,
    totalContacts,
  });
}
