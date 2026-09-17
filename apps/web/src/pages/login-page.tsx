import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, BarChart3, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/auth/auth-context';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api';

const schema = z.object({
  identifier: z.string().min(1, 'Enter your university email or index number'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  useEffect(() => { if (isAuthenticated) void navigate({ to: '/app/dashboard' }); }, [isAuthenticated, navigate]);

  const submit = handleSubmit(async (values) => {
    setServerError('');
    try { await login(values.identifier, values.password); await navigate({ to: '/app/dashboard' }); }
    catch (error) { setServerError(getErrorMessage(error)); }
  });

  return <div className="grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
    <section className="login-grid relative hidden overflow-hidden px-12 py-10 text-white lg:flex lg:flex-col xl:px-20">
      <div className="absolute right-[-8rem] top-[-8rem] size-[27rem] rounded-full bg-amber-400/10 blur-3xl" />
      <BrandMark inverse />
      <div className="relative my-auto max-w-2xl">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-amber-300"><Sparkles size={14} /> Academic clarity, by design</div>
        <h1 className="font-display text-5xl font-bold leading-[1.06] tracking-[-.04em] xl:text-6xl">Every result.<br /><span className="text-amber-300">One trusted view.</span></h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-slate-300">A secure academic intelligence workspace for students, lecturers, and administrators at the Faculty of Applied Sciences.</p>
        <div className="mt-12 grid max-w-xl grid-cols-3 gap-3">
          {[['Verified', ShieldCheck], ['Insightful', BarChart3], ['Dependable', CheckCircle2]].map(([label, Icon]) => <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[.04] p-4 backdrop-blur"><Icon className="mb-3 text-amber-300" size={20} /><div className="text-sm font-semibold">{label as string}</div></div>)}
        </div>
      </div>
      <p className="text-xs text-slate-500">Wayamba University of Sri Lanka · Faculty of Applied Sciences</p>
    </section>
    <section className="flex items-center justify-center bg-[#f7f9fc] p-6 sm:p-10">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-10 lg:hidden"><BrandMark /></div>
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-amber-600">Welcome back</p>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-navy-950">Sign in to Resulta</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">Use your institutional email, student index, or staff number.</p>
        <form onSubmit={submit} className="mt-9 space-y-5">
          <div className="field"><label htmlFor="identifier">University ID</label><input id="identifier" className="input h-12" placeholder="student@wusl.ac.lk" autoComplete="username" {...register('identifier')} />{errors.identifier && <span className="text-xs text-red-600">{errors.identifier.message}</span>}</div>
          <div className="field"><div className="flex items-center justify-between"><label htmlFor="password">Password</label><span className="text-xs text-slate-400">Case-sensitive</span></div><div className="relative"><LockKeyhole className="absolute left-3.5 top-3.5 text-slate-400" size={18} /><input id="password" type="password" className="input h-12 pl-11" placeholder="••••••••••••" autoComplete="current-password" {...register('password')} /></div>{errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}</div>
          {serverError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>}
          <Button variant="accent" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Verifying…' : 'Continue securely'} {!isSubmitting && <ArrowRight size={18} />}</Button>
        </form>
        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400"><ShieldCheck size={15} className="text-emerald-600" /> Protected with encrypted credentials and secure sessions.</div>
      </div>
    </section>
  </div>;
}
