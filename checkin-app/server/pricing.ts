// Hotel pricing engine for the wedding block (Grand Prince Hotel Hiroshima).
// Source: "婚礼ご列席者 宿泊特別料金" special-rate PDF supplied by the user,
// valid officially only 2026-04-01 through 2027-03-31.
//
// [Vermutung] The bookable stay window (25 Mar – 2 Apr 2027) extends one day
// past the table's validity end date. The night of 1→2 Apr 2027 has NO
// official rate. This module assumes period "A" continues for that night.
// This is an explicit, flagged assumption — confirm the real rate with the
// hotel before charging/quoting guests for that specific night.
import type { HotelRoom } from "@shared/schema";

export type Period = "S" | "A" | "B" | "C";

// Date (stay-night start date) -> rate period. Only the dates inside the
// bookable window are modeled; a full 12-month calendar is not needed since
// guests can only book within this fixed window.
export const PERIOD_MAP: Record<string, Period> = {
  "2027-03-25": "A",
  "2027-03-26": "A",
  "2027-03-27": "S",
  "2027-03-28": "A",
  "2027-03-29": "A",
  "2027-03-30": "A",
  "2027-03-31": "A",
  "2027-04-01": "A", // [Vermutung] — outside official table, assumed to continue period A
};

// The night of 29→30 March 2027 (the wedding night) carries an extra 10%
// discount on top of the period rate, confirmed by the user.
export const DISCOUNT_NIGHT = "2027-03-29";
export const DISCOUNT_RATE = 0.1;

type PriceTable = Record<number, Record<string, Record<Period, number>>>;

// Twin Room (23㎡, 1–2 occupancy). Prices are JPY per room per night.
const TWIN_PRICES: PriceTable = {
  1: {
    room_only: { S: 33330, A: 17600, B: 14080, C: 10560 },
    breakfast: { S: 35530, A: 19800, B: 16280, C: 12760 },
    breakfast_onsen: { S: 36850, A: 21120, B: 17600, C: 14080 },
  },
  2: {
    room_only: { S: 33330, A: 17600, B: 14080, C: 10560 },
    breakfast: { S: 37730, A: 22000, B: 18480, C: 14960 },
    breakfast_onsen: { S: 40370, A: 24640, B: 21120, C: 17600 },
  },
};

// Luxury Family Room (53㎡, 2–4 occupancy). Prices are JPY per room per night.
const FAMILY_PRICES: PriceTable = {
  2: {
    room_only: { S: 82720, A: 43560, B: 34870, C: 26180 },
    breakfast: { S: 87120, A: 47960, B: 39270, C: 30580 },
    breakfast_onsen: { S: 89760, A: 50600, B: 41910, C: 33220 },
  },
  3: {
    room_only: { S: 82720, A: 43560, B: 34870, C: 26180 },
    breakfast: { S: 89320, A: 50160, B: 41470, C: 32780 },
    breakfast_onsen: { S: 93280, A: 54120, B: 45430, C: 36740 },
  },
  4: {
    room_only: { S: 82720, A: 43560, B: 34870, C: 26180 },
    breakfast: { S: 91520, A: 52360, B: 43670, C: 34980 },
    breakfast_onsen: { S: 96800, A: 57640, B: 48950, C: 40260 },
  },
};

export function periodFor(dateStr: string): Period | undefined {
  return PERIOD_MAP[dateStr];
}

// Nights are the dates strictly between check-in (inclusive) and check-out
// (exclusive) — the classic hotel-industry "nights stayed" definition.
export function nightsBetween(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  let cur = new Date(checkIn + "T00:00:00Z");
  const end = new Date(checkOut + "T00:00:00Z");
  while (cur < end) {
    nights.push(cur.toISOString().slice(0, 10));
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  return nights;
}

// Children under 6 are free and do not count toward the paying-occupancy
// tier. Children 6+ are billed at the adult rate (per the user's confirmed
// house rule), so they count as full occupants for tier lookup.
function payingOccupancy(room: HotelRoom): number {
  return room.adults + room.children;
}

function nightlyRoomPrice(room: HotelRoom, period: Period): number {
  const table = room.roomType === "twin" ? TWIN_PRICES : FAMILY_PRICES;
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  const occ = payingOccupancy(room);
  // Clamp to the nearest available tier (family rooms have no 1-person
  // tier; twin rooms have no 3/4-person tier) rather than throwing, since
  // the UI already constrains adults+children per room type.
  const tier = keys.reduce((best, k) => (Math.abs(k - occ) < Math.abs(best - occ) ? k : best), keys[0]);
  const byMeal = table[tier];
  return byMeal[room.mealPlan][period];
}

export interface PriceBreakdownNight {
  date: string;
  period: Period;
  discounted: boolean;
  roomTotals: number[];
  nightTotal: number;
}

export interface PriceResult {
  totalJpy: number;
  nights: PriceBreakdownNight[];
  unresolvedNights: string[]; // nights outside PERIOD_MAP — should be empty in practice
}

export function computeHotelPrice(rooms: HotelRoom[], checkIn: string, checkOut: string): PriceResult {
  const nights = nightsBetween(checkIn, checkOut);
  const unresolvedNights: string[] = [];
  let totalJpy = 0;
  const breakdown: PriceBreakdownNight[] = [];

  for (const date of nights) {
    const period = periodFor(date);
    if (!period) {
      unresolvedNights.push(date);
      continue;
    }
    const discounted = date === DISCOUNT_NIGHT;
    const roomTotals = rooms.map((room) => {
      const base = nightlyRoomPrice(room, period);
      return discounted ? Math.round(base * (1 - DISCOUNT_RATE)) : base;
    });
    const nightTotal = roomTotals.reduce((a, b) => a + b, 0);
    totalJpy += nightTotal;
    breakdown.push({ date, period, discounted, roomTotals, nightTotal });
  }

  return { totalJpy, nights: breakdown, unresolvedNights };
}
