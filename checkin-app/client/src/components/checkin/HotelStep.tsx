import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StepBar } from "@/components/layout";
import { DateRangeCalendar } from "@/components/checkin/DateRangeCalendar";
import { apiRequest } from "@/lib/queryClient";
import {
  ROOM_TYPES,
  MEAL_PLANS,
  HOTEL_DATE_OPTIONS,
  type HotelRoom,
  type HotelBooking,
} from "@shared/schema";
import {
  Loader2,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
  Info,
  BedDouble,
  Waves,
} from "lucide-react";

const ROOM_LINKS: Record<string, Record<"twin" | "family", string>> = {
  en: {
    twin: "https://www.princehotels.com/hiroshima/guest-rooms/superior-floor-twin-room/",
    family:
      "https://www.princehotels.com/hiroshima/guest-rooms/superior-floor-luxury-family-room-with-view-bath/",
  },
  de: {
    twin: "https://www.princehotels.com/hiroshima/guest-rooms/superior-floor-twin-room/",
    family:
      "https://www.princehotels.com/hiroshima/guest-rooms/superior-floor-luxury-family-room-with-view-bath/",
  },
  ja: {
    twin: "https://www.princehotels.co.jp/hiroshima/room/room13.html",
    family: "https://www.princehotels.co.jp/hiroshima/room/room15.html",
  },
};

const ONSEN_LINKS: Record<string, string> = {
  en: "https://www.princehotels.com/hiroshima/facilities/open-air-baths-hiroshima-hot-springs-seto-no-yu/",
  de: "https://www.princehotels.com/hiroshima/facilities/open-air-baths-hiroshima-hot-springs-seto-no-yu/",
  ja: "https://www.princehotels.co.jp/hiroshima/facility/onsen/",
};

interface PriceResult {
  totalJpy: number;
  nights: Array<{ date: string; jpy: number }>;
  unresolvedNights: string[];
}

function emptyRoom(): HotelRoom {
  return { roomType: "twin", adults: 2, children: 0, childrenUnder6: 0, mealPlan: "breakfast" };
}

function Stepper({
  value,
  min,
  max,
  onChange,
  testId,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  testId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        data-testid={`button-dec-${testId}`}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="w-6 text-center text-sm font-semibold" data-testid={`text-${testId}`}>
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        data-testid={`button-inc-${testId}`}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function HotelStep({
  bookingId,
  initial,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  bookingId: string;
  initial: HotelBooking | null;
  onSubmit: (values: {
    wantsHotel: boolean;
    checkIn?: string;
    checkOut?: string;
    rooms?: HotelRoom[];
  }) => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const { t, lang } = useI18n();
  const [wantsHotel, setWantsHotel] = useState<boolean>(initial?.wants_hotel ?? false);
  const [checkIn, setCheckIn] = useState<string | null>(initial?.check_in ?? "2027-03-29");
  const [checkOut, setCheckOut] = useState<string | null>(initial?.check_out ?? "2027-03-30");
  const [rooms, setRooms] = useState<HotelRoom[]>(
    initial?.rooms && initial.rooms.length > 0 ? initial.rooms : [emptyRoom()]
  );
  const [onsenOpen, setOnsenOpen] = useState(false);

  const [price, setPrice] = useState<PriceResult | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [fx, setFx] = useState<{ rate: number; approx: boolean } | null>(null);

  const datesValid = !!checkIn && !!checkOut && checkIn < checkOut;

  const sortedDates = [...HOTEL_DATE_OPTIONS].sort();
  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];
  const minD = new Date(minDate);
  const maxD = new Date(maxDate);
  const calYear1 = minD.getFullYear();
  const calMonth1 = minD.getMonth();
  const calYear2 = maxD.getFullYear();
  const calMonth2 = maxD.getMonth();

  const nights =
    datesValid
      ? Math.round((new Date(checkOut as string).getTime() - new Date(checkIn as string).getTime()) / 86400000)
      : 0;

  useEffect(() => {
    apiRequest("GET", "/api/fx-rate")
      .then((res) => res.json())
      .then((d) => setFx({ rate: d.rate, approx: !!d.approx }))
      .catch(() => setFx({ rate: 0.0061, approx: true }));
  }, []);

  useEffect(() => {
    if (!wantsHotel || !datesValid || rooms.length === 0) {
      setPrice(null);
      return;
    }
    let cancelled = false;
    setPriceLoading(true);
    const handle = setTimeout(() => {
      apiRequest("POST", "/api/hotel-price", { wantsHotel: true, checkIn: checkIn as string, checkOut: checkOut as string, rooms })
        .then((res) => res.json())
        .then((d) => {
          if (!cancelled) setPrice(d);
        })
        .catch(() => {
          if (!cancelled) setPrice(null);
        })
        .finally(() => {
          if (!cancelled) setPriceLoading(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [wantsHotel, checkIn, checkOut, JSON.stringify(rooms), datesValid]);

  const eurTotal = useMemo(() => {
    if (!price || !fx) return null;
    return (price.totalJpy * fx.rate).toFixed(2);
  }, [price, fx]);

  function updateRoom(idx: number, patch: Partial<HotelRoom>) {
    setRooms((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addRoom() {
    if (rooms.length >= 5) return;
    setRooms((prev) => [...prev, emptyRoom()]);
  }

  function removeRoom(idx: number) {
    setRooms((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleNext() {
    if (!wantsHotel) {
      onSubmit({ wantsHotel: false });
      return;
    }
    if (!checkIn || !checkOut) return;
    onSubmit({ wantsHotel: true, checkIn, checkOut, rooms });
  }

  const maxOccupancy = (roomType: HotelRoom["roomType"]) => (roomType === "twin" ? 2 : 4);

  return (
    <div>
      <StepBar
        step={4}
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
          {t("hotel.eyebrow")}
        </p>
        <h1 className="text-xl font-bold text-foreground mb-1.5">{t("hotel.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("hotel.subtitle")}</p>
      </div>

      <Card className="border-card-border overflow-hidden">
        <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center gap-3">
          <BedDouble className="h-5 w-5" />
          <div className="text-base font-semibold">
            {t("hotel.wantHotelQuestion")}
          </div>
        </div>
        <CardContent className="pt-4 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant={wantsHotel ? "default" : "outline"}
              className="rounded-full flex-1 h-auto py-3 whitespace-normal text-center leading-snug"
              onClick={() => setWantsHotel(true)}
              data-testid="button-hotel-yes"
            >
              {t("hotel.wantYes")}
            </Button>
            <Button
              type="button"
              variant={!wantsHotel ? "default" : "outline"}
              className="rounded-full flex-1 h-auto py-3 whitespace-normal text-center leading-snug"
              onClick={() => setWantsHotel(false)}
              data-testid="button-hotel-no"
            >
              {t("hotel.wantNo")}
            </Button>
          </div>

          {wantsHotel && (
            <>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {t("hotel.checkIn")}
                      </div>
                      <div className="text-sm font-semibold text-foreground" data-testid="text-checkin-value">
                        {checkIn ?? t("hotel.selectDate")}
                      </div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {t("hotel.checkOut")}
                      </div>
                      <div className="text-sm font-semibold text-foreground" data-testid="text-checkout-value">
                        {checkOut ?? t("hotel.selectDate")}
                      </div>
                    </div>
                  </div>
                  {datesValid && (
                    <div
                      className="text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1"
                      data-testid="text-nights-count"
                    >
                      {nights} {nights === 1 ? t("hotel.nightSingular") : t("hotel.nightPlural")}
                    </div>
                  )}
                </div>
                <DateRangeCalendar
                  year1={calYear1}
                  month1={calMonth1}
                  year2={calYear2}
                  month2={calMonth2}
                  minDate={minDate}
                  maxDate={maxDate}
                  checkIn={checkIn ?? undefined}
                  checkOut={checkOut ?? undefined}
                  onSelect={(ci, co) => {
                    setCheckIn(ci ?? null);
                    setCheckOut(co ?? null);
                  }}
                  lang={lang}
                />
              </div>
              {!datesValid && (
                <p className="text-xs text-destructive -mt-2" data-testid="text-dates-error">
                  {checkIn && checkOut ? t("hotel.datesError") : t("hotel.selectDates")}
                </p>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t("hotel.roomsHeading")}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1"
                    disabled={rooms.length >= 5}
                    onClick={addRoom}
                    data-testid="button-add-room"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("hotel.addRoom")}
                  </Button>
                </div>

                {rooms.map((room, idx) => (
                  <Card key={idx} className="border-border bg-muted/30">
                    <CardContent className="pt-4 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {t("hotel.roomN", { n: idx + 1 })}
                        </span>
                        {rooms.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => removeRoom(idx)}
                            data-testid={`button-remove-room-${idx}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label>{t("hotel.roomType")}</Label>
                        <div className="flex items-center gap-2">
                          <Select
                            value={room.roomType}
                            onValueChange={(v) =>
                              updateRoom(idx, {
                                roomType: v as HotelRoom["roomType"],
                                adults: Math.min(room.adults, maxOccupancy(v as HotelRoom["roomType"])),
                              })
                            }
                          >
                            <SelectTrigger className="flex-1" data-testid={`select-roomtype-${idx}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROOM_TYPES.map((rt) => (
                                <SelectItem key={rt} value={rt} data-testid={`option-roomtype-${rt}-${idx}`}>
                                  {t(`hotel.roomType${rt === "twin" ? "Twin" : "Family"}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <a
                            href={ROOM_LINKS[lang]?.[room.roomType] ?? ROOM_LINKS.en[room.roomType]}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 whitespace-nowrap"
                            data-testid={`link-view-room-${idx}`}
                          >
                            {t("hotel.viewRoom")}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          <Label className="text-xs min-h-[2rem] flex items-center">{t("hotel.adults")}</Label>
                          <Stepper
                            value={room.adults}
                            min={1}
                            max={maxOccupancy(room.roomType)}
                            onChange={(v) => updateRoom(idx, { adults: v })}
                            testId={`adults-${idx}`}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 items-start">
                          <Label className="text-xs min-h-[2rem] flex items-center">{t("hotel.childrenUnder6")}</Label>
                          <Stepper
                            value={room.childrenUnder6}
                            min={0}
                            max={3}
                            onChange={(v) => updateRoom(idx, { childrenUnder6: v })}
                            testId={`children-under6-${idx}`}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label>{t("hotel.mealPlan")}</Label>
                        <div className="flex flex-col gap-1">
                          {MEAL_PLANS.map((mp) => (
                            <Label
                              key={mp}
                              className="flex items-center gap-2 py-1.5 px-2 rounded-md hover-elevate cursor-pointer"
                              data-testid={`row-mealplan-${mp}-${idx}`}
                            >
                              <input
                                type="radio"
                                name={`mealplan-${idx}`}
                                checked={room.mealPlan === mp}
                                onChange={() => updateRoom(idx, { mealPlan: mp })}
                                className="h-4 w-4 accent-primary"
                                data-testid={`radio-mealplan-${mp}-${idx}`}
                              />
                              <span className="text-sm flex-1">
                                {t(
                                  `hotel.meal${
                                    mp === "room_only" ? "RoomOnly" : mp === "breakfast" ? "Breakfast" : "BreakfastOnsen"
                                  }`
                                )}
                              </span>
                              {mp === "breakfast_onsen" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setOnsenOpen(true);
                                  }}
                                  className="text-muted-foreground hover:text-primary"
                                  data-testid="button-onsen-info"
                                >
                                  <Info className="h-4 w-4" />
                                </button>
                              )}
                            </Label>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">{t("hotel.discountNote")}</p>

              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t("hotel.priceTotal")}</span>
                {priceLoading ? (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("hotel.priceLoading")}
                  </span>
                ) : price ? (
                  <div className="text-right">
                    <div className="text-base font-bold text-foreground" data-testid="text-price-jpy">
                      ¥{price.totalJpy.toLocaleString()}
                    </div>
                    {lang !== "ja" && eurTotal && (
                      <div className="text-xs text-muted-foreground" data-testid="text-price-eur">
                        ≈ €{eurTotal}*
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
              {lang !== "ja" && price && (
                <p className="text-[11px] text-muted-foreground -mt-3">{t("hotel.priceApprox")}</p>
              )}
              <p className="text-xs text-muted-foreground">{t("hotel.vatNote")}</p>
            </>
          )}
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
          onClick={handleNext}
          disabled={isSubmitting || (wantsHotel && !datesValid)}
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

      <Dialog open={onsenOpen} onOpenChange={setOnsenOpen}>
        <DialogContent data-testid="dialog-onsen">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-primary" />
              {t("hotel.onsenInfoTitle")}
            </DialogTitle>
            <DialogDescription>{t("hotel.onsenInfoText")}</DialogDescription>
          </DialogHeader>
          <a
            href={ONSEN_LINKS[lang] ?? ONSEN_LINKS.en}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2"
            data-testid="link-onsen-learn-more"
          >
            {t("hotel.onsenLearnMore")}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </DialogContent>
      </Dialog>
    </div>
  );
}
