import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Guest } from "@shared/schema";
import { StepBar } from "@/components/layout";
import { Loader2, MapPin, Clock } from "lucide-react";

export function AfterpartyStep({
  guests,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  guests: Guest[];
  onSubmit: (optins: Record<string, boolean>) => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const { t } = useI18n();
  const attendingGuests = guests.filter((g) => g.selected);
  const [optins, setOptins] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(attendingGuests.map((g) => [g.id, g.afterparty_optin ?? true]))
  );

  function handleSubmit() {
    onSubmit(optins);
  }

  return (
    <div>
      <StepBar
        step={3}
        total={4}
        labels={[t("step.selection"), t("step.details"), t("step.meal"), t("step.afterparty")]}
      />
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
          {t("afterparty.eyebrow")}
        </p>
        <h1 className="text-xl font-bold text-foreground mb-1.5">{t("afterparty.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("afterparty.subtitle")}</p>
      </div>

      <Card className="border-card-border overflow-hidden">
        <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">{t("afterparty.venueName")}</div>
            <div className="text-xs text-primary-foreground/75">{t("afterparty.venueSub")}</div>
          </div>
          <Badge className="bg-gold text-gold-foreground border-none">
            {t("afterparty.venueFree")}
          </Badge>
        </div>
        <CardContent className="pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {t("afterparty.venueTime")}
          </div>
          <a
            href="https://www.princehotels.com/hiroshima/restaurants/top-of-hiroshima-lounge/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline underline-offset-2"
            data-testid="link-venue-map"
          >
            <MapPin className="h-4 w-4" />
            {t("afterparty.mapLink")}
          </a>

          <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {t("afterparty.optinFor")}
            </div>
            {guests.map((g) => {
              const attending = g.selected;
              return (
                <Label
                  key={g.id}
                  htmlFor={attending ? `optin-${g.id}` : undefined}
                  className={`flex items-center gap-3 py-2.5 px-2 rounded-md ${
                    attending ? "hover-elevate cursor-pointer" : "opacity-40 cursor-not-allowed"
                  }`}
                  data-testid={`row-optin-${g.id}`}
                >
                  <Checkbox
                    id={`optin-${g.id}`}
                    checked={attending ? !!optins[g.id] : false}
                    disabled={!attending}
                    onCheckedChange={(v) =>
                      setOptins((prev) => ({ ...prev, [g.id]: !!v }))
                    }
                    data-testid={`checkbox-optin-${g.id}`}
                  />
                  <span className="text-sm font-medium">
                    {g.first_name} {g.last_name}
                  </span>
                  {!attending && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {t("afterparty.notAttendingWedding")}
                    </span>
                  )}
                </Label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 mt-6">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full"
          onClick={onBack}
          data-testid="button-back"
        >
          {t("common.back")}
        </Button>
        <Button
          size="lg"
          className="rounded-full flex-1 sm:flex-none"
          onClick={handleSubmit}
          disabled={isSubmitting}
          data-testid="button-next"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.finish")}
        </Button>
      </div>
    </div>
  );
}
