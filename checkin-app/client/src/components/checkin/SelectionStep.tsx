import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(guests.map((g) => g.id)));
  }

  function handleSubmit() {
    if (selected.size === 0) {
      setError(t("selection.error"));
      return;
    }
    setError(null);
    onSubmit(Array.from(selected));
  }

  return (
    <div>
      <StepBar
        step={0}
        total={4}
        labels={[t("step.selection"), t("step.afterparty"), t("step.details"), t("step.meal")]}
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
          {guests.map((g) => (
            <Label
              key={g.id}
              htmlFor={`guest-${g.id}`}
              className="flex items-center gap-3 py-3 px-2 rounded-md hover-elevate cursor-pointer border-b border-border last:border-b-0"
              data-testid={`row-guest-${g.id}`}
            >
              <Checkbox
                id={`guest-${g.id}`}
                checked={selected.has(g.id)}
                onCheckedChange={() => toggle(g.id)}
                data-testid={`checkbox-guest-${g.id}`}
              />
              <span className="text-sm font-medium">
                {g.first_name} {g.last_name}
              </span>
            </Label>
          ))}
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive mt-3" data-testid="text-selection-error">
          {error}
        </p>
      )}

      <Button
        size="lg"
        className="rounded-full mt-6 w-full sm:w-auto"
        onClick={handleSubmit}
        disabled={isSubmitting}
        data-testid="button-next"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.next")}
      </Button>
    </div>
  );
}
