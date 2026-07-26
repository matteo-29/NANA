import { z } from "zod";

// ---- Booking ----
export interface Booking {
  id: string;
  booking_code: string;
  last_name: string;
  first_name: string;
  created_at: string;
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
  gender: string | null;
  country: string | null;
  postal_code: string | null;
  address: string | null;
  meal_choice: string | null;
  allergies: string | null;
  special_assistance: string[];
  special_assistance_other: string | null;
  checkin_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const SPECIAL_ASSISTANCE_OPTIONS = [
  "wheelchair",
  "visual",
  "hearing",
  "walking",
  "other",
] as const;

export const MEAL_OPTIONS = [
  "standard",
  "vegetarian",
  "vegan",
  "halal",
  "kosher",
  "gluten_free",
  "child",
  "none",
] as const;

// ---- Zod schemas for API payloads ----

export const lookupSchema = z.object({
  bookingCode: z.string().min(1),
  lastName: z.string().min(1),
  firstName: z.string().min(1),
});

export const selectionSchema = z.object({
  bookingId: z.string().uuid(),
  selectedGuestIds: z.array(z.string().uuid()).min(1),
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
  furigana: z.string().optional(),
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

export const adminBookingUpsertSchema = z.object({
  bookingCode: z.string().min(1),
  lastName: z.string().min(1),
  firstName: z.string().min(1),
  guests: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      })
    )
    .min(1),
});

export type LookupInput = z.infer<typeof lookupSchema>;
export type SelectionInput = z.infer<typeof selectionSchema>;
export type AfterpartyInput = z.infer<typeof afterpartySchema>;
export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;
export type MealDetailsInput = z.infer<typeof mealDetailsSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminBookingUpsertInput = z.infer<typeof adminBookingUpsertSchema>;
