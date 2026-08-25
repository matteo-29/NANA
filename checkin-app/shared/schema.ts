import { z } from "zod";

// ---- Booking ----
export interface Booking {
  id: string;
  booking_code: string;
  last_name: string;
  first_name: string;
  created_at: string;
  // True once the guest has submitted a selection (attending or declining)
  // at least once. Distinguishes "never touched this booking yet" from
  // "explicitly declined" — both look identical via guests[].selected=false,
  // but only the former should default back to pre-checking everyone.
  responded: boolean;
}

// ---- Guest ----
export interface Guest {
  id: string;
  booking_id: string;
  last_name: string;
  first_name: string;
  selected: boolean;
  afterparty_optin: boolean | null;
  nationality: string | null;
  passport_number: string | null;
  birth_date: string | null;
  email: string | null;
  phone: string | null;
  furigana: string | null;
  furigana_last_name: string | null;
  furigana_first_name: string | null;
  kanji_last_name: string | null;
  kanji_first_name: string | null;
  gender: string | null;
  country: string | null;
  postal_code: string | null;
  address: string | null;
  meal_choice: string | null;
  allergies: string | null;
  special_assistance: string[];
  special_assistance_other: string | null;
  checkin_completed: boolean;
  bus_optin: boolean | null;
  created_at: string;
  updated_at: string;
}

// ---- Hotel booking (Phase 2) ----
export const ROOM_TYPES = ["twin", "family"] as const;
export const MEAL_PLANS = ["room_only", "breakfast", "breakfast_onsen"] as const;

// The bookable stay window is fixed to the days around the wedding
// (25 Mar – 2 Apr 2027). Check-out has no separate "night" of its own, so the
// last valid check-in is one day before the last valid check-out.
export const HOTEL_DATE_OPTIONS = [
  "2027-03-25",
  "2027-03-26",
  "2027-03-27",
  "2027-03-28",
  "2027-03-29",
  "2027-03-30",
  "2027-03-31",
  "2027-04-01",
  "2027-04-02",
] as const;

export interface HotelRoom {
  roomType: (typeof ROOM_TYPES)[number];
  adults: number;
  children: number; // paying children, age 6+
  childrenUnder6: number; // free, do not affect price/occupancy tier
  mealPlan: (typeof MEAL_PLANS)[number];
}

export interface HotelBooking {
  id: string;
  booking_id: string;
  wants_hotel: boolean;
  check_in: string | null;
  check_out: string | null;
  rooms: HotelRoom[];
  total_price_jpy: number | null;
  created_at: string;
  updated_at: string;
}

export const hotelRoomSchema = z.object({
  roomType: z.enum(ROOM_TYPES),
  adults: z.number().int().min(1).max(4),
  children: z.number().int().min(0).max(3),
  childrenUnder6: z.number().int().min(0).max(3),
  mealPlan: z.enum(MEAL_PLANS),
});

export const hotelBookingSchema = z
  .object({
    bookingId: z.string().uuid(),
    wantsHotel: z.boolean(),
    checkIn: z.enum(HOTEL_DATE_OPTIONS).optional(),
    checkOut: z.enum(HOTEL_DATE_OPTIONS).optional(),
    rooms: z.array(hotelRoomSchema).min(1).max(5).optional(),
  })
  .refine(
    (d) => !d.wantsHotel || (d.checkIn && d.checkOut && d.checkIn < d.checkOut && d.rooms && d.rooms.length > 0),
    { message: "Bei Hotelwunsch sind An-/Abreise und mindestens ein Zimmer erforderlich." }
  );

export const busOptinSchema = z.object({
  guestId: z.string().uuid(),
  busOptin: z.boolean(),
});

export const SPECIAL_ASSISTANCE_OPTIONS = [
  "wheelchair",
  "visual",
  "hearing",
  "walking",
  "other",
] as const;

export const MEAL_OPTIONS = ["standard", "vegetarian", "child"] as const;

// ---- Zod schemas for API payloads ----

export const lookupSchema = z.object({
  bookingCode: z.string().min(1),
  lastName: z.string().min(1),
  firstName: z.string().min(1),
});

export const selectionSchema = z.object({
  bookingId: z.string().uuid(),
  selectedGuestIds: z.array(z.string().uuid()),
});

export const afterpartySchema = z.object({
  guestId: z.string().uuid(),
  afterpartyOptin: z.boolean(),
});

export const GENDER_OPTIONS = [
  "female",
  "male",
  "non_binary",
  "prefer_not_to_say",
] as const;

export const personalDetailsSchema = z.object({
  guestId: z.string().uuid(),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  birthDate: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  furiganaLastName: z.string().optional(),
  furiganaFirstName: z.string().optional(),
  kanjiLastName: z.string().optional(),
  kanjiFirstName: z.string().optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  address: z.string().optional(),
});

export const mealDetailsSchema = z.object({
  guestId: z.string().uuid(),
  mealChoice: z.string().optional(),
  allergies: z.string().optional(),
  specialAssistance: z.array(z.string()).optional(),
  specialAssistanceOther: z.string().optional(),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1),
});

export const adminGuestSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  afterpartyOptin: z.boolean().nullable().optional(),
  nationality: z.string().nullable().optional(),
  passportNumber: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  furiganaLastName: z.string().nullable().optional(),
  furiganaFirstName: z.string().nullable().optional(),
  kanjiLastName: z.string().nullable().optional(),
  kanjiFirstName: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  mealChoice: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  specialAssistance: z.array(z.string()).optional(),
  specialAssistanceOther: z.string().nullable().optional(),
  busOptin: z.boolean().nullable().optional(),
});

export const adminBookingUpsertSchema = z.object({
  bookingCode: z.string().min(1),
  lastName: z.string().min(1),
  firstName: z.string().min(1),
  guests: z.array(adminGuestSchema).min(1),
});

export type LookupInput = z.infer<typeof lookupSchema>;
export type SelectionInput = z.infer<typeof selectionSchema>;
export type AfterpartyInput = z.infer<typeof afterpartySchema>;
export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;
export type MealDetailsInput = z.infer<typeof mealDetailsSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminBookingUpsertInput = z.infer<typeof adminBookingUpsertSchema>;
export type HotelBookingInput = z.infer<typeof hotelBookingSchema>;
export type BusOptinInput = z.infer<typeof busOptinSchema>;
