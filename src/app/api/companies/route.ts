import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const region = searchParams.get("region");
  const industry = searchParams.get("industry");
  const minScore = searchParams.get("minScore");
  const employeeCount = searchParams.get("employeeCount");
  const sort = searchParams.get("sort") || "fitScore";
  const order = searchParams.get("order") || "desc";

  const where: Record<string, unknown> = {};
  if (region) where.region = region;
  if (industry) where.industry = { contains: industry };
  if (minScore) where.fitScore = { gte: parseInt(minScore) };
  if (employeeCount) where.employeeCount = employeeCount;

  const companies = await prisma.company.findMany({
    where,
    include: { _count: { select: { contacts: true } } },
    orderBy: { [sort]: order },
  });

  return NextResponse.json(companies);
}
