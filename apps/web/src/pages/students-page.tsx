import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
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

interface Student {
  id: string;
  fullName: string;
  email: string;
  indexNumber: string | null;
  status: string;
  batchYear: number | null;
  programme: string | null;
  lastLoginAt: string | null;
}
interface UsersResponse {
  items: Student[];
  total: number;
}
interface CatalogsResponse {
  programmes: Array<{ id: string; name: string }>;
}

export function StudentsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["students", search],
    queryFn: () =>
      api
        .get<UsersResponse>("/users", {
          params: { role: "STUDENT", search, pageSize: 50 },
        })
        .then((r) => r.data),
  });
  const { data: catalogs } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () =>
      api.get<CatalogsResponse>("/modules/catalogs").then((r) => r.data),
  });
  const createStudent = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post("/users", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      setDialogOpen(false);
      toast.success("Student account created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  function submitStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    createStudent.mutate({
      fullName: values.get("fullName"),
      email: values.get("email"),
      indexNumber: values.get("indexNumber"),
      batchYear: Number(values.get("batchYear")),
      programmeId: values.get("programmeId") || undefined,
      password: values.get("password"),
      role: "STUDENT",
    });
  }
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="People directory"
        title="Students"
        description="Manage identities, enrolment context, access status, and academic associations."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus size={17} /> Add student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader
                title="Create student account"
                description="Register an institutional identity. The student should change the temporary password after first sign-in."
              />
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={submitStudent}
              >
                <div className="field sm:col-span-2">
                  <label htmlFor="student-name">Full name</label>
                  <input
                    id="student-name"
                    name="fullName"
                    className="input"
                    required
                    minLength={2}
                  />
                </div>
                <div className="field">
                  <label htmlFor="student-email">University email</label>
                  <input
                    id="student-email"
                    name="email"
                    type="email"
                    className="input"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="student-index">Index number</label>
                  <input
                    id="student-index"
                    name="indexNumber"
                    className="input"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="student-batch">Batch year</label>
                  <input
                    id="student-batch"
                    name="batchYear"
                    type="number"
                    min="1990"
                    max="2200"
                    className="input"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="student-programme">Programme</label>
                  <select
                    id="student-programme"
                    name="programmeId"
                    className="input"
                  >
                    <option value="">Unassigned</option>
                    {catalogs?.programmes.map((programme) => (
                      <option key={programme.id} value={programme.id}>
                        {programme.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field sm:col-span-2">
                  <label htmlFor="student-password">Temporary password</label>
                  <input
                    id="student-password"
                    name="password"
                    type="password"
                    className="input"
                    required
                    minLength={12}
                    autoComplete="new-password"
                  />
                </div>
                <div className="mt-2 flex justify-end sm:col-span-2">
                  <Button type="submit" disabled={createStudent.isPending}>
                    {createStudent.isPending ? "Creating…" : "Create student"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="relative w-full max-w-sm">
              <Search
                className="absolute left-3 top-3 text-slate-400"
                size={17}
              />
              <input
                className="input h-10 pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, or index number…"
              />
            </div>
            <span className="hidden text-xs font-semibold text-slate-400 sm:block">
              {data?.total ?? 0} students
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Index number</th>
                  <th>Programme</th>
                  <th>Batch</th>
                  <th>Last active</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="skeleton h-10 rounded-lg" />
                    </td>
                  </tr>
                ) : data?.items.length ? (
                  data.items.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 place-items-center rounded-xl bg-navy-950 text-xs font-bold text-white">
                            {student.fullName
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">
                              {student.fullName}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">
                        {student.indexNumber}
                      </td>
                      <td>{student.programme ?? "Unassigned"}</td>
                      <td>{student.batchYear ?? "—"}</td>
                      <td>
                        {student.lastLoginAt
                          ? new Date(student.lastLoginAt).toLocaleDateString(
                              "en-LK",
                            )
                          : "Never"}
                      </td>
                      <td>
                        <Badge
                          className={
                            student.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }
                        >
                          {student.status.toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-14 text-center text-slate-400"
                    >
                      No students found.
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
