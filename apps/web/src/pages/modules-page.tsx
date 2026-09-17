import { useQuery } from '@tanstack/react-query';
import { BookOpen, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/auth/auth-context';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

interface ModuleRecord { id: string; code: string; name: string; credits: string; level: number; semester: number; category: string; department: string | null; isActive: boolean }

export function ModulesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const { data = [], isLoading } = useQuery({ queryKey: ['modules', search], queryFn: () => api.get<ModuleRecord[]>('/modules', { params: { search } }).then((r) => r.data) });
  return <div className="animate-rise"><PageHeader eyebrow="Academic structure" title="Module catalogue" description="The governed source of module codes, credits, levels, semesters, categories, and departments." actions={user?.role === 'ADMIN' ? <Button><Plus size={17}/> New module</Button> : undefined}/>
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[1,2,3,4].map((level) => <Card key={level} className="p-4"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700"><BookOpen size={17}/></div><div><div className="font-display text-xl font-bold text-navy-950">{data.filter((item) => item.level === level).length}</div><div className="text-xs text-slate-500">Level {level}</div></div></div></Card>)}</div>
    <Card><CardContent className="p-0"><div className="border-b border-slate-200 p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input className="input h-10 pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or module name…"/></div></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Code</th><th>Module</th><th>Department</th><th>Level</th><th>Semester</th><th>Credits</th><th>Category</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={7}><div className="skeleton h-10 rounded-lg"/></td></tr> : data.length ? data.map((module) => <tr key={module.id}><td className="font-mono text-xs font-bold !text-navy-950">{module.code}</td><td className="font-semibold !text-slate-800">{module.name}</td><td>{module.department ?? '—'}</td><td>{module.level}</td><td>{module.semester}</td><td>{Number(module.credits).toFixed(1)}</td><td><Badge className={module.category === 'CORE' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}>{module.category.toLowerCase()}</Badge></td></tr>) : <tr><td colSpan={7} className="py-14 text-center text-slate-400">No modules found.</td></tr>}</tbody></table></div></CardContent></Card>
  </div>;
}
