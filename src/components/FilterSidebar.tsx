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

  const hasActiveFilters = currentRegion !== "All" || currentEmployeeCount !== "All" || currentIndustry !== "All" || currentMinScore !== "0";

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

  const clearAll = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div className="animate-slide-in-right sticky top-20 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-[11px] font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        <FilterGroup
          label="Region"
          options={REGIONS}
          value={currentRegion}
          onChange={(v) => updateFilter("region", v)}
        />

        <FilterGroup
          label="Company Size"
          options={EMPLOYEE_COUNTS}
          value={currentEmployeeCount}
          onChange={(v) => updateFilter("employeeCount", v)}
        />

        <FilterGroup
          label="Industry"
          options={INDUSTRIES}
          value={currentIndustry}
          onChange={(v) => updateFilter("industry", v)}
        />

        <div className="pt-1">
          <label className="flex items-center justify-between text-[13px] font-medium text-gray-600 mb-3">
            <span>Min. Fit Score</span>
            <span className="text-sm font-semibold text-gray-900 tabular-nums">{currentMinScore}</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={currentMinScore}
            onChange={(e) => updateFilter("minScore", e.target.value)}
            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-500 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-indigo-500/20"
          />
          <div className="flex justify-between text-[10px] text-gray-300 mt-1.5 font-medium px-0.5">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-600 mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              value === option
                ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
