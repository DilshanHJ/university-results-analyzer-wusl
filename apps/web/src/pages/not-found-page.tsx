import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center text-center">
      <div>
        <p className="font-display text-8xl font-black text-slate-200">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-navy-950">
          This page does not exist
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          The address may be outdated or unavailable to your account.
        </p>
        <Button asChild className="mt-6">
          <Link to="/app/dashboard">
            <ArrowLeft size={17} /> Back to overview
          </Link>
        </Button>
      </div>
    </div>
  );
}
