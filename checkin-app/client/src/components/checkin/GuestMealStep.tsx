import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEAL_OPTIONS, SPECIAL_ASSISTANCE_OPTIONS, type Guest } from "@shared/schema";
import { StepBar } from "@/components/layout";
import { Loader2 } from "lucide-react";

export function GuestMealStep({
  guest,
  guestIndex,
  guestTotal,
  isLast,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  guest: Guest;
  guestIndex: number;
  guestTotal: number;
  isLast: boolean;
  onSubmit: (values: {
    mealChoice: string;
    allergies: string;
    specialAssistance: string[];
    specialAssistanceOther: string;
  }) => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const { t } = useI18n();
  const [mealChoice, setMealChoice] = useState(guest.meal_choice ?? "standard");
  const [allergies, setAllergies] = useState(guest.allergies ?? "");
  const [assistance, setAssistance] = useState<Set<string>>(
    new Set(guest.special_assistance ?? [])
  );
  const [assistanceOther, setAssistanceOther] = useState(guest.special_assistance_other ?? "");

  function toggleAssist(id: string) {
    setAssistance((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <StepBar
        step={2}
        total={4}
        labels={[t("step.selection"), t("step.details"), t("step.meal"), t("step.afterparty")]}
      />
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
          {t("meal.eyebrow")}
        </p>
        <h1 className="text-xl font-bold text-foreground mb-1">{t("meal.title")}</h1>
        <p className="text-sm text-muted-foreground mb-1">{t("meal.subtitle")}</p>
        <p className="text-sm font-medium text-primary" data-testid="text-current-guest">
          {guest.first_name} {guest.last_name} ·{" "}
          {t("common.guestOf", { current: guestIndex + 1, total: guestTotal })}
        </p>
      </div>

      <Card className="border-card-border">
        <CardContent className="pt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label>{t("meal.mealChoice")}</Label>
            <Select value={mealChoice} onValueChange={setMealChoice}>
              <SelectTrigger data-testid="select-meal-choice">
                <SelectValue placeholder={t("meal.mealPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {MEAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} data-testid={`option-meal-${opt}`}>
                    {t(`meal.option.${opt}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="allergies">{t("meal.allergies")}</Label>
            <Textarea
              id="allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder={t("meal.allergiesPlaceholder")}
              rows={3}
              data-testid="input-allergies"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="mb-1">{t("meal.assistance")}</Label>
            {SPECIAL_ASSISTANCE_OPTIONS.map((opt) => (
              <Label
                key={opt}
                htmlFor={`assist-${opt}`}
                className="flex items-center gap-3 py-2 px-2 rounded-md hover-elevate cursor-pointer"
                data-testid={`row-assist-${opt}`}
              >
                <Checkbox
                  id={`assist-${opt}`}
                  checked={assistance.has(opt)}
                  onCheckedChange={() => toggleAssist(opt)}
                  data-testid={`checkbox-assist-${opt}`}
                />
                <span className="text-sm">{t(`assist.${opt}`)}</span>
              </Label>
            ))}
            {assistance.has("other") && (
              <div className="pl-2 pt-1">
                <Textarea
                  value={assistanceOther}
                  onChange={(e) => setAssistanceOther(e.target.value)}
                  placeholder={t("assist.otherPlaceholder")}
                  rows={2}
                  data-testid="input-assist-other"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              type="button"
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
              disabled={isSubmitting}
              onClick={() =>
                onSubmit({
                  mealChoice,
                  allergies,
                  specialAssistance: Array.from(assistance),
                  specialAssistanceOther: assistanceOther,
                })
              }
              data-testid="button-next"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLast ? (
                t("meal.finish")
              ) : (
                t("common.next")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
