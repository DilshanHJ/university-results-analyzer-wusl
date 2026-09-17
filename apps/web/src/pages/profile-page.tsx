import { useMutation } from "@tanstack/react-query";
import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/auth-context";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, getErrorMessage } from "@/lib/api";

export function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      api.post("/auth/change-password", { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed. Sign in again on your other devices.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  if (!user) return null;
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Account and security"
        title="My profile"
        description="Review your institutional identity and maintain your account credentials."
      />
      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <Card className="overflow-hidden">
          <div className="h-24 bg-navy-950" />
          <CardContent className="-mt-10">
            <div className="grid size-20 place-items-center rounded-2xl border-4 border-white bg-amber-400 font-display text-xl font-black text-navy-950">
              {user.fullName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold text-navy-950">
              {user.fullName}
            </h2>
            <Badge className="mt-2 bg-blue-50 text-blue-700">
              {user.role.toLowerCase()}
            </Badge>
            <div className="mt-7 space-y-4 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={17} className="text-slate-400" />
                {user.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <UserRound size={17} className="text-slate-400" />
                {user.indexNumber ?? "Staff account"}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <ShieldCheck size={17} className="text-emerald-500" />
                Active, verified access
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Change password</CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Use at least 12 characters. Avoid passwords reused elsewhere.
              </p>
            </div>
            <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <KeyRound size={19} />
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="max-w-xl space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              <div className="field">
                <label htmlFor="current-password">Current password</label>
                <input
                  id="current-password"
                  type="password"
                  className="input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="field">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={12}
                />
              </div>
              <Button
                type="submit"
                disabled={mutation.isPending || newPassword.length < 12}
              >
                {mutation.isPending ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
