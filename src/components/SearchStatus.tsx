"use client";

import { useState, useEffect } from "react";

interface StatusData {
  latestRun: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    status: string;
    companiesFound: number;
    contactsFound: number;
  } | null;
  totalCompanies: number;
  totalContacts: number;
}

export function SearchStatus() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [running, setRunning] = useState(false);

  async function fetchStatus() {
    const res = await fetch("/api/search/status");
    const data = await res.json();
    setStatus(data);
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function triggerSearch() {
    setRunning(true);
    try {
      await fetch("/api/search/run", { method: "POST" });
      await fetchStatus();
      // Refresh the page so the server component re-renders with new data
      window.location.reload();
    } catch {
      // Error handled by status refresh
    } finally {
      setRunning(false);
    }
  }

  const lastRun = status?.latestRun;
  const lastRunTime = lastRun?.completedAt
    ? new Date(lastRun.completedAt).toLocaleString()
    : lastRun?.startedAt
      ? `Started ${new Date(lastRun.startedAt).toLocaleString()}`
      : "Never";

  return (
    <div className="animate-fade-in mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-6">
          {/* Stats pills */}
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 leading-tight">{status?.totalCompanies ?? 0}</p>
              <p className="text-[11px] text-gray-400 font-medium">Companies</p>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-200" />

          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 leading-tight">{status?.totalContacts ?? 0}</p>
              <p className="text-[11px] text-gray-400 font-medium">Contacts</p>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-200 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            {lastRun && (
              <span
                className={`w-2 h-2 rounded-full ${
                  lastRun.status === "completed"
                    ? "bg-emerald-400"
                    : lastRun.status === "running"
                      ? "bg-indigo-500 animate-pulse"
                      : "bg-red-400"
                }`}
              />
            )}
            <span className="text-xs text-gray-400">{lastRunTime}</span>
          </div>
        </div>

        <button
          onClick={triggerSearch}
          disabled={running}
          className="group relative px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 flex items-center gap-2"
        >
          {running ? (
            <>
              <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Discovering...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Run Discovery
            </>
          )}
        </button>
      </div>
    </div>
  );
}
