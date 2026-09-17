import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandMark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return <div className="flex items-center gap-3">
    <div className="grid size-10 place-items-center rounded-xl bg-amber-400 text-navy-950 shadow-lg shadow-amber-400/20"><GraduationCap size={21} strokeWidth={2.4} /></div>
    {!compact && <div>
      <div className={cn('font-display text-lg font-bold leading-none tracking-tight', inverse ? 'text-white' : 'text-navy-950')}>Resulta</div>
      <div className={cn('mt-1 text-[9px] font-bold uppercase tracking-[.18em]', inverse ? 'text-slate-400' : 'text-slate-500')}>Academic intelligence</div>
    </div>}
  </div>;
}
