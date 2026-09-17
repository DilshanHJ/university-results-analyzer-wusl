import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

interface Student { id: string; fullName: string; email: string; indexNumber: string | null; status: string; batchYear: number | null; programme: string | null; lastLoginAt: string | null }
interface UsersResponse { items: Student[]; total: number }

export function StudentsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['students', search], queryFn: () => api.get<UsersResponse>('/users', { params: { role: 'STUDENT', search, pageSize: 50 } }).then((r) => r.data) });
  return <div className="animate-rise"><PageHeader eyebrow="People directory" title="Students" description="Manage identities, enrolment context, access status, and academic associations." actions={<Button><UserPlus size={17}/> Add student</Button>} />
    <Card><CardContent className="p-0"><div className="flex items-center justify-between border-b border-slate-200 p-4"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input className="input h-10 pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, or index number…"/></div><span className="hidden text-xs font-semibold text-slate-400 sm:block">{data?.total ?? 0} students</span></div>
      <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Student</th><th>Index number</th><th>Programme</th><th>Batch</th><th>Last active</th><th>Status</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={6}><div className="skeleton h-10 rounded-lg"/></td></tr> : data?.items.length ? data.items.map((student) => <tr key={student.id}><td><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-navy-950 text-xs font-bold text-white">{student.fullName.split(' ').map((part) => part[0]).slice(0,2).join('')}</div><div><div className="font-semibold text-slate-800">{student.fullName}</div><div className="mt-1 text-xs text-slate-400">{student.email}</div></div></div></td><td className="font-mono text-xs">{student.indexNumber}</td><td>{student.programme ?? 'Unassigned'}</td><td>{student.batchYear ?? '—'}</td><td>{student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleDateString('en-LK') : 'Never'}</td><td><Badge className={student.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{student.status.toLowerCase()}</Badge></td></tr>) : <tr><td colSpan={6} className="py-14 text-center text-slate-400">No students found.</td></tr>}</tbody></table></div>
    </CardContent></Card>
  </div>;
}
