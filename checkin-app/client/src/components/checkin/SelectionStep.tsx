import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Guest } from "@shared/schema";
import { StepBar } from "@/components/layout";
import { Loader2, Users } from "lucide-react";

export function SelectionStep({
  guests,
  initialSelected,
  onSubmit,
  isSubmitting,
}: {
  guests: Guest[];
  initialSelected: string[];
  onSubmit: (selectedIds: string[]) => void;
  isSubmitting: boolean;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  function setAttending(id: string, attending: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (attending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(guests.map((g) => g.id)));
  }

  function handleSubmit() {
    onSubmit(Array.from(selected));
  }

  return (
    <div>
      <StepBar
        step={0}
        total={6}
        labels={[t("step.selection"), t("step.details"), t("step.meal"), t("step.afterparty"), t("step.hotel"), t("step.bus")]}
      />
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
          {t("selection.eyebrow")}
        </p>
        <h1 className="text-xl font-bold text-foreground mb-1.5" data-testid="text-page-title">
          {t("selection.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("selection.subtitle")}</p>
      </div>

      <Card className="border-card-border">
        <CardContent className="pt-6 flex flex-col gap-1">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{guests.length}</span>
            </div>
            <button
              type="button"
              onClick={selectAll}
              className="text-sm text-primary hover:underline underline-offset-2"
              data-testid="button-select-all"
            >
              {t("selection.selectAll")}
            </button>
          </div>
          {guests.map((g) => {
            const attending = selected.has(g.id);
            return (
              <div
                key={g.id}
                className="flex items-center justify-between gap-3 py-3 px-2 border-b border-border last:border-b-0"
                data-testid={`row-guest-${g.id}`}
              >
                <span className="text-sm font-medium">
                  {g.last_name} {g.first_name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAttending(g.id, true)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      attending
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover-elevate"
                    }`}
                    data-testid={`button-attending-${g.id}`}
                  >
                    {t("selection.attending")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttending(g.id, false)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      !attending
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border hover-elevate"
                    }`}
                    data-testid={`button-not-attending-${g.id}`}
                  >
                    {t("selection.notAttending")}
                  </button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {selected.size === 0 && (
        <p className="text-sm text-muted-foreground mt-3" data-testid="text-selection-hint">
          {t("selection.noneSelectedHint")}
        </p>
      )}

      <Button
        size="lg"
        className="rounded-full mt-6 w-full sm:w-auto"
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
          t("common.next")
        )}
      </Button>
    </div>
  );
}
