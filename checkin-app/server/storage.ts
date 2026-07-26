import supabase from "./supabase";
import type { Booking, Guest } from "@shared/schema";

export interface IStorage {
  findBookingByCode(bookingCode: string): Promise<Booking | undefined>;
  getGuestsByBooking(bookingId: string): Promise<Guest[]>;
  getBooking(bookingId: string): Promise<Booking | undefined>;
  getGuest(guestId: string): Promise<Guest | undefined>;
  setSelection(bookingId: string, selectedGuestIds: string[]): Promise<void>;
  updateGuest(guestId: string, patch: Partial<Guest>): Promise<Guest>;

  listBookingsWithGuests(): Promise<(Booking & { guests: Guest[] })[]>;
  createBooking(
    bookingCode: string,
    lastName: string,
    firstName: string,
    guests: { firstName: string; lastName: string }[]
  ): Promise<Booking & { guests: Guest[] }>;
  updateBooking(
    bookingId: string,
    bookingCode: string,
    lastName: string,
    firstName: string,
    guests: { id?: string; firstName: string; lastName: string }[]
  ): Promise<Booking & { guests: Guest[] }>;
  deleteBooking(bookingId: string): Promise<void>;
  deleteGuest(guestId: string): Promise<void>;
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
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });
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

  async listBookingsWithGuests(): Promise<(Booking & { guests: Guest[] })[]> {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const { data: guests, error: gErr } = await supabase.from("guests").select("*");
    if (gErr) throw gErr;
    return (bookings ?? []).map((b) => ({
      ...b,
      guests: (guests ?? []).filter((g) => g.booking_id === b.id),
    }));
  }

  async createBooking(
    bookingCode: string,
    lastName: string,
    firstName: string,
    guests: { firstName: string; lastName: string }[]
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
    guests: { id?: string; firstName: string; lastName: string }[]
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
        .update({ first_name: g.firstName, last_name: g.lastName })
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
}

export const storage = new SupabaseStorage();
