import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Guest } from "@shared/schema";
import { StepBar } from "@/components/layout";
import { Loader2, Bus, ExternalLink } from "lucide-react";

const SHUTTLE_LINK = "https://www.princehotels.co.jp/hiroshima/informations/shuttlebus/";

export function BusStep({
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
    Object.fromEntries(attendingGuests.map((g) => [g.id, g.bus_optin ?? true]))
  );

  function handleSubmit() {
    onSubmit(optins);
  }

  return (
    <div>
      <StepBar
        step={5}
        total={6}
        labels={[
          t("step.selection"),
          t("step.details"),
          t("step.meal"),
          t("step.afterparty"),
          t("step.hotel"),
          t("step.bus"),
        ]}
      />
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
          {t("bus.eyebrow")}
        </p>
        <h1 className="text-xl font-bold text-foreground mb-1.5">{t("bus.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("bus.subtitle")}</p>
      </div>

      <Card className="border-card-border overflow-hidden">
        <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center gap-3">
          <Bus className="h-5 w-5" />
          <div className="text-base font-semibold">
            {t("bus.departurePlace")} → {t("bus.arrivalPlace")}
          </div>
        </div>
        <CardContent className="pt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold tracking-widest text-muted-foreground">
                {t("bus.departure")}
              </span>
              <span className="text-lg font-bold text-foreground" data-testid="text-departure-time">
                {t("bus.departureTime")}
              </span>
              <span className="text-xs text-muted-foreground">{t("bus.departurePlace")}</span>
            </div>
            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-[11px] font-semibold tracking-widest text-muted-foreground">
                {t("bus.arrival")}
              </span>
              <span className="text-lg font-bold text-foreground" data-testid="text-arrival-time">
                {t("bus.arrivalTime")}
              </span>
              <span className="text-xs text-muted-foreground">{t("bus.arrivalPlace")}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground">
                {t("bus.boarding")}
              </span>
              <span className="text-sm font-semibold text-foreground">{t("bus.boardingTime")}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground">
                {t("bus.gate")}
              </span>
              <span className="text-sm font-semibold text-foreground">{t("bus.gateValue")}</span>
            </div>
            <Badge className="bg-emerald-600 text-white border-none hover:bg-emerald-600">
              {t("bus.classValue")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">{t("bus.boardingNote")}</p>

          <div className="mt-2 pt-3 border-t border-border flex flex-col gap-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {t("bus.optinFor")}
            </div>
            {guests.map((g) => {
              const attending = g.selected;
              return (
                <Label
                  key={g.id}
                  htmlFor={attending ? `bus-optin-${g.id}` : undefined}
                  className={`flex items-center gap-3 py-2.5 px-2 rounded-md ${
                    attending ? "hover-elevate cursor-pointer" : "opacity-40 cursor-not-allowed"
                  }`}
                  data-testid={`row-bus-optin-${g.id}`}
                >
                  <Checkbox
                    id={`bus-optin-${g.id}`}
                    checked={attending ? !!optins[g.id] : false}
                    disabled={!attending}
                    onCheckedChange={(v) =>
                      setOptins((prev) => ({ ...prev, [g.id]: !!v }))
                    }
                    data-testid={`checkbox-bus-optin-${g.id}`}
                  />
                  <span className="text-sm font-medium">
                    {g.last_name} {g.first_name}
                  </span>
                  {!attending && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {t("bus.notAttendingWedding")}
                    </span>
                  )}
                </Label>
              );
            })}
          </div>

          <div className="mt-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">{t("bus.returnHeading")}</span>
            <p className="text-xs text-muted-foreground">{t("bus.returnText")}</p>
            <a
              href={SHUTTLE_LINK}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 mt-0.5"
              data-testid="link-shuttle-schedule"
            >
              {t("bus.returnLink")}
              <ExternalLink className="h-3 w-3" />
            </a>
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
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common.saving")}
            </span>
          ) : (
            t("common.finish")
          )}
        </Button>
      </div>
    </div>
  );
}
