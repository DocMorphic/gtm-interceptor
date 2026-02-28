import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CompanyCard } from "@/components/CompanyCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { SearchStatus } from "@/components/SearchStatus";

interface PageProps {
  searchParams: Promise<{
    region?: string;
    industry?: string;
    employeeCount?: string;
    minScore?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const where: Record<string, unknown> = {};

  if (params.region) where.region = params.region;
  if (params.industry) where.industry = { contains: params.industry };
  if (params.employeeCount) where.employeeCount = params.employeeCount;
  if (params.minScore) where.fitScore = { gte: parseInt(params.minScore) };

  const companies = await prisma.company.findMany({
    where,
    include: { _count: { select: { contacts: true } } },
    orderBy: { fitScore: "desc" },
  });

  return (
    <div>
      <SearchStatus />

      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <Suspense>
            <FilterSidebar />
          </Suspense>
        </div>

        <div className="flex-1">
          {companies.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No prospects yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Click &quot;Run Search Now&quot; above to discover prospective
                companies using AI-powered analysis.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                {companies.length} prospective{" "}
                {companies.length === 1 ? "company" : "companies"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
