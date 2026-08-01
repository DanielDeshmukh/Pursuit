"use client";

import { useState, useEffect } from "react";
import { getAnalytics } from "@/lib/actions/analytics";
import { LoadingScreen } from "@/components/loading-screen";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>;

const COLORS = [
  "#024ad8",
  "#296ef9",
  "#8ebdce",
  "#ff5050",
  "#636363",
  "#356373",
  "#c9e0fc",
  "#b3262b",
];

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    getAnalytics().then(setData);
  }, []);

  if (!data) return <LoadingScreen />;

  const stats = [
    { label: "Total", value: data.total, color: "text-ink" },
    { label: "Applied", value: data.applied, color: "text-primary" },
    { label: "Interviews", value: data.interviews, color: "text-storm-deep" },
    { label: "Offers", value: data.offers, color: "text-bloom-coral" },
    { label: "Rejected/Ghosted", value: data.rejected, color: "text-graphite" },
    {
      label: "Response Rate",
      value: `${data.responseRate}%`,
      color: "text-primary",
    },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <h2 className="mb-6 text-lg font-medium text-ink">Analytics</h2>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-hairline bg-paper p-4"
          >
            <p className="text-xs font-medium text-graphite">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.color}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-paper p-4">
          <h3 className="mb-4 text-sm font-medium text-ink">
            Applications by Source
          </h3>
          {data.bySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.bySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.bySource.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-graphite">
              No data yet
            </p>
          )}
        </div>

        <div className="rounded-xl border border-hairline bg-paper p-4">
          <h3 className="mb-4 text-sm font-medium text-ink">
            Applications by Status
          </h3>
          {data.byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.byStatus}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#636363" }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11, fill: "#636363" }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.byStatus.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-graphite">
              No data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
