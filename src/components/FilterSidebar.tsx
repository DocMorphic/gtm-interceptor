"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const REGIONS = ["All", "DACH", "Western Europe", "Nordics", "Eastern Europe", "Global"];
const EMPLOYEE_COUNTS = [
  "All",
  "1-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5000+",
];
const INDUSTRIES = [
  "All",
  "Automotive",
  "Electronics Manufacturing",
  "Industrial Equipment",
  "Consumer Goods",
  "Aerospace",
  "Chemical",
  "Pharmaceutical",
];

export function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRegion = searchParams.get("region") || "All";
  const currentEmployeeCount = searchParams.get("employeeCount") || "All";
  const currentIndustry = searchParams.get("industry") || "All";
  const currentMinScore = searchParams.get("minScore") || "0";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "All" || value === "0") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-5">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
        Filters
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Region
        </label>
        <select
          value={currentRegion}
          onChange={(e) => updateFilter("region", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Size
        </label>
        <select
          value={currentEmployeeCount}
          onChange={(e) => updateFilter("employeeCount", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {EMPLOYEE_COUNTS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Industry
        </label>
        <select
          value={currentIndustry}
          onChange={(e) => updateFilter("industry", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Min Fit Score: {currentMinScore}
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={currentMinScore}
          onChange={(e) => updateFilter("minScore", e.target.value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}
