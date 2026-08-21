import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Link } from "wouter";
import type { Booking, Guest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Plane,
  Coffee,
  Film,
  Armchair,
  PartyPopper,
  Gift,
  Wifi,
  Camera,
  PhoneOff,
  Download,
  Send,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import princeHotelImg from "@/assets/nana/prince_hotel.jpg";

function TicketDelivery({ booking }: { booking: Booking }) {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await apiRequest("GET", `/api/ticket/${booking.id}/pdf?lang=${lang}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NANA-${booking.booking_code}-ticket.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ description: t("delivery.error"), variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  async function handleSendEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ description: t("delivery.emailInvalid"), variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await apiRequest("POST", "/api/send-ticket", {
        bookingId: booking.id,
        lang,
        email,
      });
      if (!res.ok) throw new Error("send failed");
      toast({ description: t("delivery.sent", { email }) });
    } catch (err) {
      toast({ description: t("delivery.error"), variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="border-card-border" data-testid="card-ticket-delivery">
      <CardContent className="pt-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-primary" />
          <div>
            <div className="text-sm font-semibold text-foreground">{t("delivery.title")}</div>
            <div className="text-xs text-muted-foreground">{t("delivery.subtitle")}</div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-full gap-2"
          onClick={handleDownload}
          disabled={downloading}
          data-testid="button-download-ticket"
        >
          <Download className="h-4 w-4" />
          {downloading ? t("delivery.downloading") : t("delivery.download")}
        </Button>

        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground" htmlFor="delivery-email">
            {t("delivery.emailLabel")}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="delivery-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("delivery.emailPlaceholder")}
              data-testid="input-delivery-email"
              className="flex-1"
            />
            <Button
              type="button"
              className="rounded-full gap-2 shrink-0"
              onClick={handleSendEmail}
              disabled={sending}
              data-testid="button-send-ticket-email"
            >
              <Send className="h-4 w-4" />
              {sending ? t("delivery.sending") : t("delivery.sendEmail")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceIcon({
  icon: Icon,
  label,
  disabled,
  testId,
}: {
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  testId: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`h-9 w-9 rounded-full flex items-center justify-center border ${
            disabled
              ? "border-border text-muted-foreground/40 opacity-40"
              : "border-primary/30 bg-primary/5 text-primary"
          }`}
          data-testid={testId}
        >
          <Icon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-auto px-3 py-1.5 text-sm"
        data-testid={`${testId}-popover`}
      >
        {label}
      </PopoverContent>
    </Popover>
  );
}

export function ConfirmationStep({
  booking,
  guests,
  onEditSelection,
  onEditAfterparty,
  onEditGuest,
}: {
  booking: Booking;
  guests: Guest[];
  onEditSelection: () => void;
  onEditAfterparty: () => void;
  onEditGuest: (guestIndex: number) => void;
}) {
  const { t } = useI18n();
  const selected = guests.filter((g) => g.selected);
  const notAttending = guests.filter((g) => !g.selected);

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
                  {guests.map((g) => `${g.last_name} ${g.first_name}`).join(", ")}
                </div>
                <div className="text-xs text-muted-foreground">{t("selection.title")}</div>
              </div>
              <span className="text-xs text-primary underline underline-offset-2">
                {t("common.edit")}
              </span>
            </CardContent>
          </Card>
        </button>

        {selected.length > 0 && (
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
        )}

        {selected.map((g, idx) => {
          return (
            <Card key={g.id} className="border-card-border overflow-hidden">
              <div className="bg-primary text-primary-foreground px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-widest uppercase">
                    {t("confirm.ticketed")}
                  </span>
                </div>
                <Badge className="bg-flight-red text-flight-red-foreground border-none">
                  {t("confirm.class")}
                </Badge>
              </div>
              <CardContent className="pt-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-foreground" data-testid={`text-guest-name-${g.id}`}>
                    {g.last_name} {g.first_name}
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditGuest(idx)}
                    className="text-xs text-primary underline underline-offset-2"
                    data-testid={`button-edit-guest-${g.id}`}
                  >
                    {t("common.edit")}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      {t("confirm.departure")}
                    </div>
                    <div className="text-sm font-semibold text-foreground truncate" data-testid={`text-departure-${g.id}`}>
                      {t("confirm.departureCity")}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t("confirm.departureVenue")}
                    </div>
                  </div>
                  <Plane className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0 text-right">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      {t("confirm.arrival")}
                    </div>
                    <div className="text-sm font-semibold text-foreground truncate" data-testid={`text-arrival-${g.id}`}>
                      {t("confirm.arrivalCity")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground border-t border-border pt-2" data-testid={`text-flight-schedule-${g.id}`}>
                  <span className="font-medium text-foreground">{t("confirm.flightDate")}</span>
                  <span>{t("confirm.gateOpensLabel")} 12:00</span>
                  <span>{t("confirm.departureTimeLabel")} 13:00</span>
                  <span>{t("confirm.arrivalTimeLabel")} 16:30</span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <div className="flex items-center gap-2 flex-wrap pt-3">
                    <ServiceIcon icon={Coffee} label={t("confirm.icon.beverages")} testId={`icon-beverages-${g.id}`} />
                    <ServiceIcon icon={Film} label={t("confirm.icon.entertainment")} testId={`icon-entertainment-${g.id}`} />
                    <ServiceIcon icon={Armchair} label={t("confirm.icon.lounge")} testId={`icon-lounge-${g.id}`} />
                    <ServiceIcon
                      icon={PartyPopper}
                      label={g.afterparty_optin ? t("confirm.icon.afterparty") : t("confirm.afterpartyNo")}
                      disabled={!g.afterparty_optin}
                      testId={`icon-afterparty-${g.id}`}
                    />
                    <ServiceIcon icon={Gift} label={t("confirm.icon.amenities")} testId={`icon-amenities-${g.id}`} />
                    <ServiceIcon icon={Wifi} label={t("confirm.icon.wifi")} testId={`icon-wifi-${g.id}`} />
                    <ServiceIcon icon={Camera} label={t("confirm.icon.photos")} testId={`icon-photos-${g.id}`} />
                    <ServiceIcon icon={PhoneOff} label={t("confirm.icon.mobileOff")} testId={`icon-mobileoff-${g.id}`} />
                  </div>
                </div>

                {g.meal_choice && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{t(`meal.option.${g.meal_choice}`)}</Badge>
                    <span className="text-[11px] text-muted-foreground">{t("confirm.mealLabel")}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">{g.email}</div>
              </CardContent>
            </Card>
          );
        })}

        {notAttending.map((g) => (
          <Card key={g.id} className="border-card-border opacity-60">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">
                {g.last_name} {g.first_name}
              </div>
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <XCircle className="h-3 w-3" />
                {t("confirm.notAttendingWedding")}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-foreground mb-1 text-center">
          {t("confirm.accommodationTitle")}
        </p>
        <p className="text-xs text-muted-foreground mb-3 text-center">
          {t("confirm.accommodationSubtitle")}
        </p>
        <a
          href="https://rsv.seibuprince.com/?adult=2&arrive=2027-03-28&chain=31483&child=0&currency=JPY&depart=2027-03-31&dsclid=79920180943130624&hotel=43739&level=hotel&locale=en-US&productcurrency=JPY&rooms=1&utm_campaign=derbysoft&utm_medium=metasearch&utm_source=google-hotelads"
          target="_blank"
          rel="noreferrer"
          className="block"
          data-testid="link-accommodation"
        >
          <Card className="border-card-border overflow-hidden hover-elevate">
            <img
              src={princeHotelImg}
              alt="Grand Prince Hotel Hiroshima"
              className="w-full h-40 object-cover"
              data-testid="img-prince-hotel"
            />
            <CardContent className="py-3 text-center text-sm text-primary font-medium">
              {t("confirm.accommodationCta")}
            </CardContent>
          </Card>
        </a>
      </div>

      {selected.length > 0 && (
        <div className="mt-8">
          <TicketDelivery booking={booking} />
        </div>
      )}

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
