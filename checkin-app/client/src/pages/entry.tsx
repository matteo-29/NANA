import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell, Hero } from "@/components/layout";
import { Loader2 } from "lucide-react";
import type { Booking, Guest } from "@shared/schema";
import heroImage from "@/assets/nana/hero.jpg";

export default function EntryPage() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [bookingCode, setBookingCode] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lookup = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/lookup", { bookingCode, lastName, firstName });
      return (await res.json()) as { booking: Booking; guests: Guest[] };
    },
    onSuccess: (data) => {
      navigate(`/checkin/${data.booking.id}`);
    },
    onError: () => {
      setError(t("entry.notFound"));
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    lookup.mutate();
  }

  return (
    <PageShell
      hero={
        <Hero
          eyebrow={t("entry.eyebrow")}
          title={t("entry.title")}
          subtitle={t("entry.subtitle")}
          image={heroImage}
        />
      }
    >
      <Card className="border-card-border shadow-lg rounded-2xl">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-5" data-testid="form-entry">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bookingCode">{t("entry.bookingCode")}</Label>
              <Input
                id="bookingCode"
                data-testid="input-booking-code"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value)}
                placeholder={t("entry.bookingCodePlaceholder")}
                required
                className="uppercase tracking-widest rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName">{t("entry.firstName")}</Label>
                <Input
                  id="firstName"
                  data-testid="input-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("entry.firstNamePlaceholder")}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName">{t("entry.lastName")}</Label>
                <Input
                  id="lastName"
                  data-testid="input-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("entry.lastNamePlaceholder")}
                  required
                  className="rounded-lg"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive" data-testid="text-error">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="rounded-full mt-2"
              disabled={lookup.isPending}
              data-testid="button-submit"
            >
              {lookup.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("entry.submit")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
