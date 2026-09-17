import { useQuery } from '@tanstack/react-query';
import { Award, BookCheck, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/auth/auth-context';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { ResultRecord, ResultSummary } from '@/lib/types';

const statusStyle = { PUBLISHED: 'bg-emerald-50 text-emerald-700', DRAFT: 'bg-slate-100 text-slate-600', WITHHELD: 'bg-rose-50 text-rose-700' };

export function ResultsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const { data = [], isLoading } = useQuery({ queryKey: ['results'], queryFn: () => api.get<ResultRecord[]>('/results').then((r) => r.data) });
  const { data: summary } = useQuery({ queryKey: ['result-summary'], queryFn: () => api.get<ResultSummary>('/results/summary').then((r) => r.data), enabled: user?.role === 'STUDENT' });
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return data.filter((item) => [item.moduleCode, item.moduleName, item.studentName, item.indexNumber].some((value) => value?.toLowerCase().includes(term)));
  }, [data, search]);

  return <div className="animate-rise">
    <PageHeader eyebrow="Academic records" title={user?.role === 'STUDENT' ? 'My results' : 'Results register'} description={user?.role === 'STUDENT' ? 'Your official published results, attempts, credits, and grades in one place.' : 'Review, validate, and trace results across students and examination periods.'} />
    {summary && <div className="mb-5 grid gap-3 sm:grid-cols-3"><Card className="p-5"><Award className="text-amber-500" size={20}/><p className="mt-4 font-display text-3xl font-bold text-navy-950">{summary.cumulativeGpa.toFixed(2)}</p><p className="text-xs font-semibold text-slate-500">Cumulative GPA</p></Card><Card className="p-5"><BookCheck className="text-blue-600" size={20}/><p className="mt-4 font-display text-3xl font-bold text-navy-950">{summary.completedCredits}</p><p className="text-xs font-semibold text-slate-500">Credits completed</p></Card><Card className="p-5"><div className="text-lg font-black text-emerald-600">{summary.modulesCompleted}/{summary.modulesAttempted}</div><p className="mt-5 text-xs font-semibold text-slate-500">Modules completed</p></Card></div>}
    <Card><CardContent className="p-0">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input className="input h-10 pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search module or student…" /></div><span className="text-xs font-semibold text-slate-400">{filtered.length} records</span></div>
      <div className="overflow-x-auto"><table className="data-table"><thead><tr>{user?.role !== 'STUDENT' && <><th>Student</th><th>Index</th></>}<th>Module</th><th>Period</th><th>Attempt</th><th>Mark</th><th>Grade</th><th>Status</th></tr></thead><tbody>
        {isLoading ? <tr><td colSpan={8}><div className="skeleton h-10 rounded-lg" /></td></tr> : filtered.length ? filtered.map((result) => <tr key={result.id}>{user?.role !== 'STUDENT' && <><td className="font-semibold !text-slate-800">{result.studentName}</td><td>{result.indexNumber}</td></>}<td><div className="font-semibold text-navy-950">{result.moduleCode}</div><div className="mt-1 max-w-[260px] truncate text-xs text-slate-400">{result.moduleName}</div></td><td>L{result.level} · S{result.semester}<div className="mt-1 text-xs text-slate-400">{result.examinationYear}</div></td><td>{result.attempt}</td><td>{result.marks ?? '—'}</td><td><span className="font-display text-base font-black text-navy-950">{result.grade}</span></td><td><Badge className={statusStyle[result.status]}>{result.status.toLowerCase()}</Badge></td></tr>) : <tr><td colSpan={8} className="py-14 text-center text-slate-400">No results match this view.</td></tr>}
      </tbody></table></div>
    </CardContent></Card>
  </div>;
}
