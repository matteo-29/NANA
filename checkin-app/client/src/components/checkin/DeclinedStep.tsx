import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { HeartHandshake } from "lucide-react";

export function DeclinedStep({ onEditSelection }: { onEditSelection: () => void }) {
  const { t } = useI18n();

  return (
    <div>
      <div className="flex flex-col items-center text-center mb-8">
        <div className="h-14 w-14 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-4">
          <HeartHandshake className="h-7 w-7" />
        </div>
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
          {t("declined.eyebrow")}
        </p>
        <h1 className="text-xl font-bold text-foreground mb-2" data-testid="text-page-title">
          {t("declined.title")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md" data-testid="text-declined-message">
          {t("declined.message")}
        </p>
      </div>

      <Card className="border-card-border">
        <CardContent className="py-5 text-center text-sm text-muted-foreground">
          {t("declined.hint")}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3 mt-6">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full"
          onClick={onEditSelection}
          data-testid="button-edit-selection"
        >
          {t("declined.changeMind")}
        </Button>
        <Link href="/">
          <Button size="lg" className="rounded-full" data-testid="button-home">
            {t("confirm.backHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
