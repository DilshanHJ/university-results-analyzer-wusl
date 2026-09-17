import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/auth/auth-context";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StaffDashboard = {
  kind: "staff";
  students: number;
  modules: number;
  results: number;
  publishedResults: number;
  yearlyGpa: Array<{ year: number; gpa: number }>;
};
type StudentDashboard = {
  kind: "student";
  cumulativeGpa: number;
  completedCredits: number;
  modulesCompleted: number;
  modulesAttempted: number;
  semesterGpa: Array<{ period: string; gpa: number }>;
};
type Metric = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone: string;
};

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      api
        .get<StaffDashboard | StudentDashboard>("/analytics/dashboard")
        .then((response) => response.data),
  });
  const firstName = user?.fullName.split(" ")[0] ?? "there";
  const staffMetrics: Metric[] =
    data?.kind === "staff"
      ? [
          {
            label: "Active students",
            value: data.students,
            icon: Users,
            tone: "bg-blue-50 text-blue-700",
          },
          {
            label: "Academic modules",
            value: data.modules,
            icon: BookOpen,
            tone: "bg-violet-50 text-violet-700",
          },
          {
            label: "Recorded results",
            value: data.results,
            icon: FileCheck2,
            tone: "bg-amber-50 text-amber-700",
          },
          {
            label: "Published results",
            value: data.publishedResults,
            icon: CheckCircle2,
            tone: "bg-emerald-50 text-emerald-700",
          },
        ]
      : [];
  const studentMetrics: Metric[] =
    data?.kind === "student"
      ? [
          {
            label: "Cumulative GPA",
            value: data.cumulativeGpa.toFixed(2),
            icon: Award,
            tone: "bg-amber-50 text-amber-700",
          },
          {
            label: "Credits completed",
            value: data.completedCredits,
            icon: GraduationCap,
            tone: "bg-blue-50 text-blue-700",
          },
          {
            label: "Modules completed",
            value: data.modulesCompleted,
            icon: CheckCircle2,
            tone: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Modules attempted",
            value: data.modulesAttempted,
            icon: BookOpen,
            tone: "bg-violet-50 text-violet-700",
          },
        ]
      : [];
  const metrics: Metric[] =
    data?.kind === "staff" ? staffMetrics : studentMetrics;
  const chart =
    data?.kind === "staff"
      ? data.yearlyGpa.map((item) => ({
          name: String(item.year),
          gpa: item.gpa,
        }))
      : data?.kind === "student"
        ? data.semesterGpa.map((item) => ({
            name: `L${item.period.replace("-", " S")}`,
            gpa: item.gpa,
          }))
        : [];

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Academic command centre"
        title={`Good to see you, ${firstName}.`}
        description="A concise, trusted view of current academic performance and system activity."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="skeleton h-36 rounded-2xl" />
            ))
          : metrics.map((metric) => (
              <Card key={metric.label} className="metric-glow p-5">
                <div
                  className={`grid size-10 place-items-center rounded-xl ${metric.tone}`}
                >
                  <metric.icon size={20} />
                </div>
                <div className="mt-5 font-display text-3xl font-bold tracking-tight text-navy-950">
                  {typeof metric.value === "number"
                    ? formatNumber(metric.value)
                    : metric.value}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  {metric.label}
                </div>
              </Card>
            ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_.7fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Performance trajectory</CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Published credit-weighted academic results
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <TrendingUp className="mr-1 inline" size={13} /> Live
            </span>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              {chart.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chart}
                    margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gpaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#f2ad27"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f2ad27"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e8edf3"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 4]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        borderColor: "#e2e8f0",
                        boxShadow: "0 12px 30px rgba(15,23,42,.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="gpa"
                      stroke="#f2ad27"
                      strokeWidth={3}
                      fill="url(#gpaFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-sm text-slate-400">
                  Performance appears after published results are available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden bg-navy-950 text-white">
          <CardContent className="relative flex h-full min-h-[360px] flex-col p-7">
            <div className="absolute right-[-4rem] top-[-4rem] size-48 rounded-full bg-amber-400/15 blur-2xl" />
            <div className="grid size-11 place-items-center rounded-xl bg-amber-400 text-navy-950">
              <GraduationCap size={22} />
            </div>
            <div className="mt-auto">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">
                Faculty standard
              </p>
              <h3 className="mt-3 font-display text-2xl font-bold leading-tight">
                Decisions backed by consistent academic data.
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Resulta keeps records traceable, calculations deterministic, and
                student access appropriately scoped.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
