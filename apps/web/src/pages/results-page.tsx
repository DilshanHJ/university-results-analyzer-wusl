import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, BookCheck, Download, Plus, Search } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/auth-context";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, getErrorMessage } from "@/lib/api";
import type { ResultRecord, ResultSummary } from "@/lib/types";

const statusStyle = {
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  DRAFT: "bg-slate-100 text-slate-600",
  WITHHELD: "bg-rose-50 text-rose-700",
};
interface EntryOptions {
  students: Array<{ id: string; label: string; indexNumber: string | null }>;
  modules: Array<{ id: string; code: string; name: string }>;
  grades: string[];
}

export function ResultsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["results"],
    queryFn: () => api.get<ResultRecord[]>("/results").then((r) => r.data),
  });
  const { data: summary } = useQuery({
    queryKey: ["result-summary"],
    queryFn: () =>
      api.get<ResultSummary>("/results/summary").then((r) => r.data),
    enabled: user?.role === "STUDENT",
  });
  const { data: entryOptions } = useQuery({
    queryKey: ["result-entry-options"],
    queryFn: () =>
      api.get<EntryOptions>("/results/entry-options").then((r) => r.data),
    enabled: user?.role !== "STUDENT",
  });
  const createResult = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post("/results", payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["results"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setDialogOpen(false);
      toast.success("Result recorded");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return data.filter((item) =>
      [
        item.moduleCode,
        item.moduleName,
        item.studentName,
        item.indexNumber,
      ].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [data, search]);

  function submitResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const mark = values.get("marks");
    createResult.mutate({
      studentId: values.get("studentId"),
      moduleId: values.get("moduleId"),
      attempt: Number(values.get("attempt")),
      grade: values.get("grade"),
      marks: mark === "" ? undefined : Number(mark),
      examinationYear: Number(values.get("examinationYear")),
      status: values.get("status"),
    });
  }

  function exportCsv() {
    const headers = [
      "index_number",
      "student_name",
      "module_code",
      "module_name",
      "attempt",
      "grade",
      "marks",
      "examination_year",
      "status",
    ];
    const csv = [
      headers,
      ...filtered.map((item) => [
        item.indexNumber,
        item.studentName,
        item.moduleCode,
        item.moduleName,
        item.attempt,
        item.grade,
        item.marks,
        item.examinationYear,
        item.status,
      ]),
    ]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `results-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Academic records"
        title={user?.role === "STUDENT" ? "My results" : "Results register"}
        description={
          user?.role === "STUDENT"
            ? "Your official published results, attempts, credits, and grades in one place."
            : "Review, validate, and trace results across students and examination periods."
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportCsv}
              disabled={!filtered.length}
            >
              <Download size={17} /> Export CSV
            </Button>
            {user?.role !== "STUDENT" && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus size={17} /> Record result
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader
                    title="Record academic result"
                    description="Create an auditable result attempt. Published records become visible to the student immediately."
                  />
                  <form
                    className="grid gap-4 sm:grid-cols-2"
                    onSubmit={submitResult}
                  >
                    <div className="field sm:col-span-2">
                      <label htmlFor="result-student">Student</label>
                      <select
                        id="result-student"
                        name="studentId"
                        className="input"
                        required
                      >
                        <option value="">Select student</option>
                        {entryOptions?.students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.indexNumber} · {student.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field sm:col-span-2">
                      <label htmlFor="result-module">Module</label>
                      <select
                        id="result-module"
                        name="moduleId"
                        className="input"
                        required
                      >
                        <option value="">Select module</option>
                        {entryOptions?.modules.map((module) => (
                          <option key={module.id} value={module.id}>
                            {module.code} · {module.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="result-grade">Grade</label>
                      <select
                        id="result-grade"
                        name="grade"
                        className="input"
                        required
                      >
                        {entryOptions?.grades.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="result-mark">Mark</label>
                      <input
                        id="result-mark"
                        name="marks"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="input"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="result-attempt">Attempt</label>
                      <input
                        id="result-attempt"
                        name="attempt"
                        type="number"
                        min="1"
                        max="10"
                        defaultValue="1"
                        className="input"
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="result-year">Examination year</label>
                      <input
                        id="result-year"
                        name="examinationYear"
                        type="number"
                        min="1990"
                        max="2200"
                        defaultValue={new Date().getFullYear()}
                        className="input"
                        required
                      />
                    </div>
                    <div className="field sm:col-span-2">
                      <label htmlFor="result-status">Publication state</label>
                      <select
                        id="result-status"
                        name="status"
                        className="input"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="WITHHELD">Withheld</option>
                      </select>
                    </div>
                    <div className="mt-2 flex justify-end sm:col-span-2">
                      <Button type="submit" disabled={createResult.isPending}>
                        {createResult.isPending ? "Saving…" : "Save result"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />
      {summary && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Card className="p-5">
            <Award className="text-amber-500" size={20} />
            <p className="mt-4 font-display text-3xl font-bold text-navy-950">
              {summary.cumulativeGpa.toFixed(2)}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Cumulative GPA
            </p>
          </Card>
          <Card className="p-5">
            <BookCheck className="text-blue-600" size={20} />
            <p className="mt-4 font-display text-3xl font-bold text-navy-950">
              {summary.completedCredits}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Credits completed
            </p>
          </Card>
          <Card className="p-5">
            <div className="text-lg font-black text-emerald-600">
              {summary.modulesCompleted}/{summary.modulesAttempted}
            </div>
            <p className="mt-5 text-xs font-semibold text-slate-500">
              Modules completed
            </p>
          </Card>
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search
                className="absolute left-3 top-3 text-slate-400"
                size={17}
              />
              <input
                className="input h-10 pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search module or student…"
              />
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {filtered.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {user?.role !== "STUDENT" && (
                    <>
                      <th>Student</th>
                      <th>Index</th>
                    </>
                  )}
                  <th>Module</th>
                  <th>Period</th>
                  <th>Attempt</th>
                  <th>Mark</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="skeleton h-10 rounded-lg" />
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((result) => (
                    <tr key={result.id}>
                      {user?.role !== "STUDENT" && (
                        <>
                          <td className="font-semibold !text-slate-800">
                            {result.studentName}
                          </td>
                          <td>{result.indexNumber}</td>
                        </>
                      )}
                      <td>
                        <div className="font-semibold text-navy-950">
                          {result.moduleCode}
                        </div>
                        <div className="mt-1 max-w-[260px] truncate text-xs text-slate-400">
                          {result.moduleName}
                        </div>
                      </td>
                      <td>
                        L{result.level} · S{result.semester}
                        <div className="mt-1 text-xs text-slate-400">
                          {result.examinationYear}
                        </div>
                      </td>
                      <td>{result.attempt}</td>
                      <td>{result.marks ?? "—"}</td>
                      <td>
                        <span className="font-display text-base font-black text-navy-950">
                          {result.grade}
                        </span>
                      </td>
                      <td>
                        <Badge className={statusStyle[result.status]}>
                          {result.status.toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-14 text-center text-slate-400"
                    >
                      No results match this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
