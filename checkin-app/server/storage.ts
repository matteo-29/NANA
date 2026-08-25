import supabase from "./supabase";
import type { Booking, Guest, AdminBookingUpsertInput, HotelBooking, HotelRoom } from "@shared/schema";

type AdminGuestInput = AdminBookingUpsertInput["guests"][number];

// Maps the camelCase admin guest payload to the snake_case DB columns.
// Only fields the admin actually sent (i.e. not `undefined`) are included,
// so partial edits never clobber existing guest data with nulls.
function mapAdminGuestFields(g: AdminGuestInput): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (g.afterpartyOptin !== undefined) row.afterparty_optin = g.afterpartyOptin;
  if (g.nationality !== undefined) row.nationality = g.nationality;
  if (g.passportNumber !== undefined) row.passport_number = g.passportNumber;
  if (g.birthDate !== undefined) row.birth_date = g.birthDate || null;
  if (g.email !== undefined) row.email = g.email;
  if (g.phone !== undefined) row.phone = g.phone;
  if (g.furiganaLastName !== undefined) row.furigana_last_name = g.furiganaLastName;
  if (g.furiganaFirstName !== undefined) row.furigana_first_name = g.furiganaFirstName;
  if (g.kanjiLastName !== undefined) row.kanji_last_name = g.kanjiLastName;
  if (g.kanjiFirstName !== undefined) row.kanji_first_name = g.kanjiFirstName;
  if (g.gender !== undefined) row.gender = g.gender;
  if (g.country !== undefined) row.country = g.country;
  if (g.postalCode !== undefined) row.postal_code = g.postalCode;
  if (g.address !== undefined) row.address = g.address;
  if (g.mealChoice !== undefined) row.meal_choice = g.mealChoice;
  if (g.allergies !== undefined) row.allergies = g.allergies;
  if (g.specialAssistance !== undefined) row.special_assistance = g.specialAssistance;
  if (g.specialAssistanceOther !== undefined) row.special_assistance_other = g.specialAssistanceOther;
  if (g.busOptin !== undefined) row.bus_optin = g.busOptin;
  return row;
}

export interface IStorage {
  findBookingByCode(bookingCode: string): Promise<Booking | undefined>;
  getGuestsByBooking(bookingId: string): Promise<Guest[]>;
  getBooking(bookingId: string): Promise<Booking | undefined>;
  getGuest(guestId: string): Promise<Guest | undefined>;
  setSelection(bookingId: string, selectedGuestIds: string[]): Promise<void>;
  updateGuest(guestId: string, patch: Partial<Guest>): Promise<Guest>;

  listBookingsWithGuests(): Promise<(Booking & { guests: Guest[]; hotelBooking: HotelBooking | null })[]>;
  createBooking(
    bookingCode: string,
    lastName: string,
    firstName: string,
    guests: AdminGuestInput[]
  ): Promise<Booking & { guests: Guest[] }>;
  updateBooking(
    bookingId: string,
    bookingCode: string,
    lastName: string,
    firstName: string,
    guests: AdminGuestInput[]
  ): Promise<Booking & { guests: Guest[] }>;
  deleteBooking(bookingId: string): Promise<void>;
  deleteGuest(guestId: string): Promise<void>;

  getHotelBooking(bookingId: string): Promise<HotelBooking | undefined>;
  upsertHotelBooking(
    bookingId: string,
    patch: { wantsHotel: boolean; checkIn?: string; checkOut?: string; rooms?: HotelRoom[]; totalPriceJpy?: number }
  ): Promise<HotelBooking>;
}

class SupabaseStorage implements IStorage {
  async findBookingByCode(bookingCode: string): Promise<Booking | undefined> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .ilike("booking_code", bookingCode.trim())
      .maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  }

  async getBooking(bookingId: string): Promise<Booking | undefined> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  }

  async getGuestsByBooking(bookingId: string): Promise<Guest[]> {
    // Guests for a booking are bulk-inserted in a single statement, so
    // `created_at` is often identical across rows (Postgres `now()` is
    // stable within one transaction). Without a tiebreaker, ties have no
    // guaranteed order and can flip between queries — which guest ends up
    // at index 0 could change after any refetch. `id` is a stable,
    // per-row tiebreaker that guarantees a deterministic, repeatable order.
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async getGuest(guestId: string): Promise<Guest | undefined> {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("id", guestId)
      .maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  }

  async setSelection(bookingId: string, selectedGuestIds: string[]): Promise<void> {
    const { error: e1 } = await supabase
      .from("guests")
      .update({ selected: false })
      .eq("booking_id", bookingId);
    if (e1) throw e1;
    if (selectedGuestIds.length > 0) {
      const { error: e2 } = await supabase
        .from("guests")
        .update({ selected: true })
        .in("id", selectedGuestIds)
        .eq("booking_id", bookingId);
      if (e2) throw e2;
    }
    // Mark the booking as having received an explicit answer (attending or
    // declining) so a later page reload can tell "never responded yet" apart
    // from "deliberately declined" — otherwise both look identical (no guest
    // has selected=true) and a decline would silently revert to everyone
    // pre-checked on next load.
    const { error: e3 } = await supabase
      .from("bookings")
      .update({ responded: true })
      .eq("id", bookingId);
    if (e3) throw e3;
  }

  async updateGuest(guestId: string, patch: Partial<Guest>): Promise<Guest> {
    const { data, error } = await supabase
      .from("guests")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", guestId)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async listBookingsWithGuests(): Promise<(Booking & { guests: Guest[]; hotelBooking: HotelBooking | null })[]> {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const { data: guests, error: gErr } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (gErr) throw gErr;
    const { data: hotelBookings, error: hErr } = await supabase.from("hotel_bookings").select("*");
    if (hErr) throw hErr;
    return (bookings ?? []).map((b) => ({
      ...b,
      guests: (guests ?? []).filter((g) => g.booking_id === b.id),
      hotelBooking: (hotelBookings ?? []).find((h) => h.booking_id === b.id) ?? null,
    }));
  }

  async createBooking(
    bookingCode: string,
    lastName: string,
    firstName: string,
    guests: AdminGuestInput[]
  ): Promise<Booking & { guests: Guest[] }> {
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({ booking_code: bookingCode.trim(), last_name: lastName, first_name: firstName })
      .select("*")
      .single();
    if (error) throw error;

    const { data: insertedGuests, error: gErr } = await supabase
      .from("guests")
      .insert(
        guests.map((g) => ({
          booking_id: booking.id,
          first_name: g.firstName,
          last_name: g.lastName,
          ...mapAdminGuestFields(g),
        }))
      )
      .select("*");
    if (gErr) throw gErr;

    return { ...booking, guests: insertedGuests ?? [] };
  }

  async updateBooking(
    bookingId: string,
    bookingCode: string,
    lastName: string,
    firstName: string,
    guests: AdminGuestInput[]
  ): Promise<Booking & { guests: Guest[] }> {
    const { data: booking, error } = await supabase
      .from("bookings")
      .update({ booking_code: bookingCode.trim(), last_name: lastName, first_name: firstName })
      .eq("id", bookingId)
      .select("*")
      .single();
    if (error) throw error;

    const existing = await this.getGuestsByBooking(bookingId);
    const keepIds = new Set(guests.filter((g) => g.id).map((g) => g.id));
    const toDelete = existing.filter((g) => !keepIds.has(g.id));
    if (toDelete.length > 0) {
      const { error: dErr } = await supabase
        .from("guests")
        .delete()
        .in("id", toDelete.map((g) => g.id));
      if (dErr) throw dErr;
    }

    const toUpdate = guests.filter((g) => g.id);
    for (const g of toUpdate) {
      const { error: uErr } = await supabase
        .from("guests")
        .update({
          first_name: g.firstName,
          last_name: g.lastName,
          ...mapAdminGuestFields(g),
          updated_at: new Date().toISOString(),
        })
        .eq("id", g.id);
      if (uErr) throw uErr;
    }

    const toInsert = guests.filter((g) => !g.id);
    if (toInsert.length > 0) {
      const { error: iErr } = await supabase.from("guests").insert(
        toInsert.map((g) => ({
          booking_id: bookingId,
          first_name: g.firstName,
          last_name: g.lastName,
          ...mapAdminGuestFields(g),
        }))
      );
      if (iErr) throw iErr;
    }

    const finalGuests = await this.getGuestsByBooking(bookingId);
    return { ...booking, guests: finalGuests };
  }

  async deleteBooking(bookingId: string): Promise<void> {
    const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
    if (error) throw error;
  }

  async deleteGuest(guestId: string): Promise<void> {
    const { error } = await supabase.from("guests").delete().eq("id", guestId);
    if (error) throw error;
  }

  async getHotelBooking(bookingId: string): Promise<HotelBooking | undefined> {
    const { data, error } = await supabase
      .from("hotel_bookings")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  }

  async upsertHotelBooking(
    bookingId: string,
    patch: { wantsHotel: boolean; checkIn?: string; checkOut?: string; rooms?: HotelRoom[]; totalPriceJpy?: number }
  ): Promise<HotelBooking> {
    const row: Record<string, unknown> = {
      wants_hotel: patch.wantsHotel,
      updated_at: new Date().toISOString(),
    };
    if (patch.checkIn !== undefined) row.check_in = patch.checkIn;
    if (patch.checkOut !== undefined) row.check_out = patch.checkOut;
    if (patch.rooms !== undefined) row.rooms = patch.rooms;
    if (patch.totalPriceJpy !== undefined) row.total_price_jpy = patch.totalPriceJpy;

    const existing = await this.getHotelBooking(bookingId);
    if (existing) {
      const { data, error } = await supabase
        .from("hotel_bookings")
        .update(row)
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase
      .from("hotel_bookings")
      .insert({ booking_id: bookingId, ...row })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }
}

export const storage = new SupabaseStorage();
