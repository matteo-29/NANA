import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const { setPassword } = useAdminAuth();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/login", { password: input });
      return res.json();
    },
    onSuccess: () => {
      setPassword(input);
      navigate("/admin/dashboard");
    },
    onError: () => setError(t("admin.wrongPassword")),
  });

  return (
    <PageShell>
      <div className="flex flex-col items-center text-center mb-8">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{t("admin.title")}</h1>
      </div>
      <Card className="border-card-border max-w-sm mx-auto">
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              login.mutate();
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t("admin.passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                required
                data-testid="input-admin-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" data-testid="text-error">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="rounded-full"
              disabled={login.isPending}
              data-testid="button-login"
            >
              {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin.login")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
