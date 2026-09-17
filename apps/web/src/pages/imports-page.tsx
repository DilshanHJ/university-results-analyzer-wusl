import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, getErrorMessage } from "@/lib/api";

interface ImportResult {
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: string[];
}

export function ImportsPage() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a CSV file first.");
      const form = new FormData();
      form.append("file", file);
      return api
        .post<ImportResult>("/results/import", form)
        .then((r) => r.data);
    },
  });
  function downloadTemplate() {
    const csv =
      "index_number,module_code,attempt,grade,marks,examination_year,status\nUWU/CST/21/001,CMIS1113,1,A,75,2026,PUBLISHED\n";
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "result-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Controlled ingestion"
        title="Data imports"
        description="Validate and upsert academic results from a defined CSV contract with an auditable import summary."
        actions={
          <Button variant="outline" onClick={downloadTemplate}>
            <Download size={17} /> CSV template
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Import result records</CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Maximum 10,000 rows · 2 MB CSV
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <input
              ref={input}
              className="hidden"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                mutation.reset();
              }}
            />
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition hover:border-amber-400 hover:bg-amber-50/30"
            >
              <div className="grid size-14 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm">
                <UploadCloud size={25} />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-navy-950">
                {file ? file.name : "Select a CSV file"}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Required columns: index_number, module_code, grade,
                examination_year. Optional: attempt, marks, status.
              </p>
            </button>
            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={!file || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending
                ? "Validating and importing…"
                : "Validate and import"}{" "}
              <FileSpreadsheet size={18} />
            </Button>
            {mutation.isError && (
              <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <XCircle className="shrink-0" size={19} />
                {getErrorMessage(mutation.error)}
              </div>
            )}
            {mutation.data && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-emerald-800">
                  <CheckCircle2 size={19} /> Import complete
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <b>{mutation.data.totalRows}</b>
                    <span className="block text-xs text-emerald-700">
                      Total
                    </span>
                  </div>
                  <div>
                    <b>{mutation.data.importedRows}</b>
                    <span className="block text-xs text-emerald-700">
                      Imported
                    </span>
                  </div>
                  <div>
                    <b>{mutation.data.failedRows}</b>
                    <span className="block text-xs text-emerald-700">
                      Rejected
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Before you import</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-5">
              {[
                "Use exact student index numbers already registered in Resulta.",
                "Use module codes from the governed module catalogue.",
                "Grades are normalized to uppercase and checked against the grade scale.",
                "Existing matching records are updated by student, module, attempt, and year.",
              ].map((text, index) => (
                <li key={text} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-950 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{text}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
