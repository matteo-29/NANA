import { useMemo } from "react";
import { cn } from "@/lib/utils";

const LOCALE_MAP: Record<string, string> = {
  de: "de-DE",
  en: "en-US",
  ja: "ja-JP",
};

// Jan 1, 2023 was a Sunday — used purely as a stable reference to derive
// localized weekday abbreviations (So/Mo/Di... , Sun/Mon..., 日/月...).
const REFERENCE_SUNDAY = new Date(2023, 0, 1);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoOf(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function buildCells(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  return cells;
}

interface DateRangeCalendarProps {
  year1: number;
  month1: number; // 0-indexed
  year2: number;
  month2: number; // 0-indexed
  minDate: string;
  maxDate: string;
  checkIn?: string;
  checkOut?: string;
  onSelect: (checkIn: string | undefined, checkOut: string | undefined) => void;
  lang: string;
}

export function DateRangeCalendar({
  year1,
  month1,
  year2,
  month2,
  minDate,
  maxDate,
  checkIn,
  checkOut,
  onSelect,
  lang,
}: DateRangeCalendarProps) {
  const locale = LOCALE_MAP[lang] ?? "en-US";

  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(REFERENCE_SUNDAY);
      d.setDate(REFERENCE_SUNDAY.getDate() + i);
      return fmt.format(d);
    });
  }, [locale]);

  function monthLabel(year: number, month: number) {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
      new Date(year, month, 1)
    );
  }

  function handleDayClick(iso: string) {
    if (iso < minDate || iso > maxDate) return;
    if (!checkIn || (checkIn && checkOut)) {
      // start a fresh selection
      onSelect(iso, undefined);
      return;
    }
    // checkIn set, checkOut not set yet
    if (iso > checkIn) {
      onSelect(checkIn, iso);
    } else {
      onSelect(iso, undefined);
    }
  }

  function renderMonth(year: number, month: number, key: string) {
    const cells = buildCells(year, month);
    return (
      <div key={key} className="flex-1 min-w-0">
        <div className="text-center text-sm font-semibold text-foreground mb-3" data-testid={`text-calendar-month-${key}`}>
          {monthLabel(year, month)}
        </div>
        <div className="grid grid-cols-7 gap-y-1 mb-1">
          {weekdayLabels.map((wd, i) => (
            <div
              key={i}
              className="text-center text-[11px] font-medium text-muted-foreground uppercase"
            >
              {wd}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} />;
            const iso = isoOf(year, month, day);
            const disabled = iso < minDate || iso > maxDate;
            const isCheckIn = iso === checkIn;
            const isCheckOut = iso === checkOut;
            const isEndpoint = isCheckIn || isCheckOut;
            const inRange = !!checkIn && !!checkOut && iso > checkIn && iso < checkOut;
            const rangeBg =
              inRange || (isCheckIn && !!checkOut) || (isCheckOut && !!checkIn);

            return (
              <div
                key={idx}
                className={cn(
                  "h-9 flex items-center relative",
                  rangeBg && "bg-primary/10",
                  isCheckIn && checkOut && "rounded-l-full",
                  isCheckOut && checkIn && "rounded-r-full"
                )}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDayClick(iso)}
                  data-testid={`button-day-${iso}`}
                  className={cn(
                    "w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                    disabled && "text-muted-foreground/30 cursor-not-allowed",
                    !disabled && !isEndpoint && "hover:bg-accent text-foreground",
                    isEndpoint && "bg-primary text-primary-foreground hover:bg-primary"
                  )}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-4">
      {renderMonth(year1, month1, "m1")}
      {renderMonth(year2, month2, "m2")}
    </div>
  );
}
