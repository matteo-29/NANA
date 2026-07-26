import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { CheckCircle2, PartyPopper, XCircle } from "lucide-react";
import type { Guest } from "@shared/schema";

export function ConfirmationStep({
  guests,
  onEditSelection,
  onEditAfterparty,
  onEditGuest,
}: {
  guests: Guest[];
  onEditSelection: () => void;
  onEditAfterparty: () => void;
  onEditGuest: (guestIndex: number) => void;
}) {
  const { t } = useI18n();
  const selected = guests.filter((g) => g.selected);

  return (
    <div>
      <div className="flex flex-col items-center text-center mb-8">
        <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
          {t("confirm.eyebrow")}
        </p>
        <h1 className="text-xl font-bold text-foreground mb-2" data-testid="text-page-title">
          {t("confirm.title")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">{t("confirm.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onEditSelection}
          className="text-left"
          data-testid="button-edit-selection"
        >
          <Card className="border-card-border hover-elevate">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {selected.map((g) => `${g.first_name} ${g.last_name}`).join(", ")}
                </div>
                <div className="text-xs text-muted-foreground">{t("selection.title")}</div>
              </div>
              <span className="text-xs text-primary underline underline-offset-2">
                {t("common.edit")}
              </span>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={onEditAfterparty}
          className="text-left"
          data-testid="button-edit-afterparty"
        >
          <Card className="border-card-border hover-elevate">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {t("afterparty.title")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selected.filter((g) => g.afterparty_optin).length} / {selected.length}{" "}
                  {t("afterparty.optinFor")}
                </div>
              </div>
              <span className="text-xs text-primary underline underline-offset-2">
                {t("common.edit")}
              </span>
            </CardContent>
          </Card>
        </button>

        {selected.map((g, idx) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onEditGuest(idx)}
            className="text-left"
            data-testid={`button-edit-guest-${g.id}`}
          >
            <Card className="border-card-border hover-elevate">
              <CardContent className="py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-foreground">
                    {g.first_name} {g.last_name}
                  </div>
                  <span className="text-xs text-primary underline underline-offset-2">
                    {t("common.edit")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      g.afterparty_optin
                        ? "border-gold text-foreground gap-1"
                        : "text-muted-foreground gap-1"
                    }
                  >
                    {g.afterparty_optin ? (
                      <PartyPopper className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {g.afterparty_optin ? t("confirm.afterpartyYes") : t("confirm.afterpartyNo")}
                  </Badge>
                  {g.meal_choice && (
                    <Badge variant="outline">{t(`meal.option.${g.meal_choice}`)}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{g.email}</div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">{t("confirm.editHint")}</p>

      <div className="flex justify-center mt-4">
        <Link href="/">
          <Button variant="outline" size="lg" className="rounded-full" data-testid="button-home">
            {t("confirm.backHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
