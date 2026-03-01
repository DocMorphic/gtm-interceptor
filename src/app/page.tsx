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
    <div className="animate-fade-in">
      <SearchStatus />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 shrink-0">
          <Suspense>
            <FilterSidebar />
          </Suspense>
        </div>

        <div className="flex-1 min-w-0">
          {companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 animate-fade-in-up">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No prospects yet
              </h3>
              <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed">
                Hit &quot;Run Discovery&quot; to let AI find and score high-value prospects for you.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Prospects
                </h2>
                <span className="text-xs font-medium text-gray-400 tabular-nums">
                  {companies.length} result{companies.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden shadow-sm stagger-children" suppressHydrationWarning>
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
