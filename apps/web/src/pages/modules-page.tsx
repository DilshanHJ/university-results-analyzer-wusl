import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
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

interface ModuleRecord {
  id: string;
  code: string;
  name: string;
  credits: string;
  level: number;
  semester: number;
  category: string;
  department: string | null;
  isActive: boolean;
}
interface CatalogsResponse {
  departments: Array<{ id: string; name: string }>;
}

export function ModulesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["modules", search],
    queryFn: () =>
      api
        .get<ModuleRecord[]>("/modules", { params: { search } })
        .then((r) => r.data),
  });
  const { data: catalogs } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () =>
      api.get<CatalogsResponse>("/modules/catalogs").then((r) => r.data),
  });
  const createModule = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post("/modules", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["modules"] });
      setDialogOpen(false);
      toast.success("Academic module created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  function submitModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    createModule.mutate({
      code: values.get("code"),
      name: values.get("name"),
      credits: Number(values.get("credits")),
      level: Number(values.get("level")),
      semester: Number(values.get("semester")),
      category: values.get("category"),
      departmentId: values.get("departmentId") || undefined,
    });
  }
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Academic structure"
        title="Module catalogue"
        description="The governed source of module codes, credits, levels, semesters, categories, and departments."
        actions={
          user?.role === "ADMIN" ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={17} /> New module
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader
                  title="Create academic module"
                  description="Add a governed module definition. Codes are normalized to uppercase and must be unique."
                />
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={submitModule}
                >
                  <div className="field">
                    <label htmlFor="module-code">Module code</label>
                    <input
                      id="module-code"
                      name="code"
                      className="input"
                      required
                      maxLength={32}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="module-credits">Credits</label>
                    <input
                      id="module-credits"
                      name="credits"
                      type="number"
                      step="0.5"
                      min="0"
                      max="30"
                      className="input"
                      required
                    />
                  </div>
                  <div className="field sm:col-span-2">
                    <label htmlFor="module-name">Module name</label>
                    <input
                      id="module-name"
                      name="name"
                      className="input"
                      required
                      maxLength={180}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="module-level">Level</label>
                    <select id="module-level" name="level" className="input">
                      {[1, 2, 3, 4].map((value) => (
                        <option key={value} value={value}>
                          Level {value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="module-semester">Semester</label>
                    <select
                      id="module-semester"
                      name="semester"
                      className="input"
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="module-category">Category</label>
                    <select
                      id="module-category"
                      name="category"
                      className="input"
                    >
                      <option value="CORE">Core</option>
                      <option value="ELECTIVE">Elective</option>
                      <option value="GENERAL">General</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="module-department">Department</label>
                    <select
                      id="module-department"
                      name="departmentId"
                      className="input"
                    >
                      <option value="">Unassigned</option>
                      {catalogs?.departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 flex justify-end sm:col-span-2">
                    <Button type="submit" disabled={createModule.isPending}>
                      {createModule.isPending ? "Creating…" : "Create module"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((level) => (
          <Card key={level} className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
                <BookOpen size={17} />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-navy-950">
                  {data.filter((item) => item.level === level).length}
                </div>
                <div className="text-xs text-slate-500">Level {level}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-slate-200 p-4">
            <div className="relative max-w-sm">
              <Search
                className="absolute left-3 top-3 text-slate-400"
                size={17}
              />
              <input
                className="input h-10 pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or module name…"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Module</th>
                  <th>Department</th>
                  <th>Level</th>
                  <th>Semester</th>
                  <th>Credits</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="skeleton h-10 rounded-lg" />
                    </td>
                  </tr>
                ) : data.length ? (
                  data.map((module) => (
                    <tr key={module.id}>
                      <td className="font-mono text-xs font-bold !text-navy-950">
                        {module.code}
                      </td>
                      <td className="font-semibold !text-slate-800">
                        {module.name}
                      </td>
                      <td>{module.department ?? "—"}</td>
                      <td>{module.level}</td>
                      <td>{module.semester}</td>
                      <td>{Number(module.credits).toFixed(1)}</td>
                      <td>
                        <Badge
                          className={
                            module.category === "CORE"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-violet-50 text-violet-700"
                          }
                        >
                          {module.category.toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-14 text-center text-slate-400"
                    >
                      No modules found.
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
