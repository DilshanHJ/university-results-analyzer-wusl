import { BrandMark } from './brand-mark';

export function LoadingScreen() {
  return <div className="grid min-h-screen place-items-center bg-navy-950">
    <div className="flex flex-col items-center gap-6"><BrandMark inverse /><div className="h-1 w-32 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-pulse rounded-full bg-amber-400" /></div></div>
  </div>;
}
