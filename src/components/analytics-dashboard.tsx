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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>;

const COLORS = [
  "var(--color-primary)",
  "var(--color-primary-bright)",
  "var(--color-sky-mist)",
  "var(--color-bloom-coral)",
  "var(--color-graphite)",
  "var(--color-storm-deep)",
  "var(--color-primary-soft)",
  "var(--color-bloom-rose)",
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

  const funnelSteps = [
    { label: "Saved", value: data.funnel.saved },
    { label: "Applied", value: data.funnel.applied },
    { label: "Screening", value: data.funnel.screening },
    { label: "Interview", value: data.funnel.interview },
    { label: "Offer", value: data.funnel.offer },
  ];

  const tickColor = "var(--color-graphite)";

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

      <div className="mb-8">
        <h3 className="mb-4 text-sm font-medium text-ink">
          Conversion Funnel
        </h3>
        <div className="flex items-end gap-2">
          {funnelSteps.map((step, i) => {
            const maxVal = Math.max(...funnelSteps.map((s) => s.value), 1);
            const heightPct = (step.value / maxVal) * 100;
            return (
              <div key={step.label} className="flex flex-1 flex-col items-center">
                <span className="mb-1 text-sm font-medium text-ink">
                  {step.value}
                </span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    minHeight: 8,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
                <span className="mt-2 text-[10px] text-graphite">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-4 text-sm font-medium text-ink">
          Applications Over Time
        </h3>
        {data.timeSeries.length > 0 ? (
          <div className="rounded-xl border border-hairline bg-paper p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.timeSeries}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: tickColor }}
                  tickFormatter={(v: string) => {
                    const [y, m] = v.split("-");
                    return `${["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m)]} ${y?.slice(2)}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-paper)",
                    border: "1px solid var(--color-hairline)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-primary)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-graphite">
            No timeline data yet
          </p>
        )}
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
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-paper)",
                    border: "1px solid var(--color-hairline)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
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
                  tick={{ fontSize: 11, fill: tickColor }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-paper)",
                    border: "1px solid var(--color-hairline)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.byStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
