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
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-gray-500">Last search run</p>
            <p className="text-sm font-medium text-gray-900">{lastRunTime}</p>
          </div>
          {lastRun && (
            <>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-sm font-medium">
                  <span
                    className={`inline-flex items-center gap-1 ${
                      lastRun.status === "completed"
                        ? "text-green-700"
                        : lastRun.status === "running"
                          ? "text-blue-700"
                          : "text-red-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        lastRun.status === "completed"
                          ? "bg-green-500"
                          : lastRun.status === "running"
                            ? "bg-blue-500 animate-pulse"
                            : "bg-red-500"
                      }`}
                    />
                    {lastRun.status}
                  </span>
                </p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
            </>
          )}
          <div>
            <p className="text-sm text-gray-500">Companies</p>
            <p className="text-sm font-medium text-gray-900">
              {status?.totalCompanies ?? 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contacts</p>
            <p className="text-sm font-medium text-gray-900">
              {status?.totalContacts ?? 0}
            </p>
          </div>
        </div>
        <button
          onClick={triggerSearch}
          disabled={running}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running ? "Running..." : "Run Search Now"}
        </button>
      </div>
    </div>
  );
}
