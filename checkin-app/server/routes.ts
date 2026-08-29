import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { storage } from "./storage";
import {
  lookupSchema,
  selectionSchema,
  afterpartySchema,
  personalDetailsSchema,
  mealDetailsSchema,
  adminLoginSchema,
  adminBookingUpsertSchema,
  hotelBookingSchema,
  busOptinSchema,
} from "@shared/schema";
import { renderTicketPdf } from "./ticket-pdf";
import { computeHotelPrice } from "./pricing";
import type { TicketLang } from "@shared/ticket-i18n";

function parseLang(v: unknown): TicketLang {
  return v === "de" || v === "en" || v === "ja" ? v : "en";
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const password = req.header("x-admin-password");
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ---- Guest-facing: lookup a booking by code + last name ----
  app.post("/api/lookup", async (req, res) => {
    const parsed = lookupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültige Eingabe." });
    }
    const { bookingCode, lastName, firstName } = parsed.data;
    try {
      const booking = await storage.findBookingByCode(bookingCode);
      if (!booking) {
        return res.status(404).json({ message: "notfound" });
      }
      const guests = await storage.getGuestsByBooking(booking.id);
      const norm = (s: string) => s.trim().toLowerCase();
      const identities = [
        { last: booking.last_name, first: booking.first_name },
        ...guests.map((g) => ({ last: g.last_name, first: g.first_name })),
      ];
      const nameMatches = identities.some(
        (id) => norm(id.last) === norm(lastName) && norm(id.first) === norm(firstName)
      );
      if (!nameMatches) {
        return res.status(404).json({ message: "notfound" });
      }
      res.json({ booking, guests });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  // ---- Fetch current state of a booking (for resuming / editing) ----
  app.get("/api/booking/:bookingId", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.bookingId);
      if (!booking) return res.status(404).json({ message: "notfound" });
      const guests = await storage.getGuestsByBooking(booking.id);
      const hotelBooking = await storage.getHotelBooking(booking.id);
      res.json({ booking, guests, hotelBooking: hotelBooking ?? null });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  // ---- Live hotel price quote (does not persist anything) ----
  app.post("/api/hotel-price", async (req, res) => {
    const parsed = hotelBookingSchema.safeParse({ ...req.body, bookingId: req.body.bookingId ?? "00000000-0000-0000-0000-000000000000" });
    if (!parsed.success || !parsed.data.wantsHotel || !parsed.data.checkIn || !parsed.data.checkOut || !parsed.data.rooms) {
      return res.status(400).json({ message: "Ungültige Eingabe." });
    }
    try {
      const result = computeHotelPrice(parsed.data.rooms, parsed.data.checkIn, parsed.data.checkOut);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Preis konnte nicht berechnet werden." });
    }
  });

  // ---- Hotel booking (per family/group booking, Phase 2) ----
  app.post("/api/hotel-booking", async (req, res) => {
    const parsed = hotelBookingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe." });
    try {
      const d = parsed.data;
      let totalPriceJpy: number | undefined = undefined;
      if (d.wantsHotel && d.checkIn && d.checkOut && d.rooms) {
        totalPriceJpy = computeHotelPrice(d.rooms, d.checkIn, d.checkOut).totalJpy;
      }
      const hotelBooking = await storage.upsertHotelBooking(d.bookingId, {
        wantsHotel: d.wantsHotel,
        checkIn: d.checkIn,
        checkOut: d.checkOut,
        rooms: d.rooms,
        totalPriceJpy,
      });
      res.json({ hotelBooking });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  // ---- Bus opt-in per guest ----
  app.post("/api/bus", async (req, res) => {
    const parsed = busOptinSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe." });
    try {
      const guest = await storage.updateGuest(parsed.data.guestId, {
        bus_optin: parsed.data.busOptin,
      });
      res.json({ guest });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  // ---- Live JPY -> EUR exchange rate, cached in memory for 1 hour ----
  let fxCache: { rate: number; asOf: string; approx: boolean } | null = null;
  let fxCacheAt = 0;
  app.get("/api/fx-rate", async (_req, res) => {
    const ONE_HOUR = 60 * 60 * 1000;
    if (fxCache && Date.now() - fxCacheAt < ONE_HOUR) {
      return res.json(fxCache);
    }
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/JPY");
      const data = await r.json();
      const rate = data?.rates?.EUR;
      if (typeof rate !== "number") throw new Error("no EUR rate in response");
      fxCache = { rate, asOf: data.time_last_update_utc ?? new Date().toISOString(), approx: false };
      fxCacheAt = Date.now();
      res.json(fxCache);
    } catch (err) {
      console.error("FX rate fetch failed, falling back to approximate rate", err);
      // [Vermutung] Fallback rate if the live FX API is unreachable — a rough
      // approximation, clearly flagged as such via `approx: true` so the UI
      // can show a disclaimer.
      const fallback = { rate: 0.0061, asOf: new Date().toISOString(), approx: true };
      fxCache = fallback;
      fxCacheAt = Date.now();
      res.json(fallback);
    }
  });

  // ---- Selection: which guests in the group are checking in ----
  app.post("/api/selection", async (req, res) => {
    const parsed = selectionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe." });
    try {
      await storage.setSelection(parsed.data.bookingId, parsed.data.selectedGuestIds);
      const guests = await storage.getGuestsByBooking(parsed.data.bookingId);
      res.json({ guests });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  // ---- Afterparty opt-in per guest ----
  app.post("/api/afterparty", async (req, res) => {
    const parsed = afterpartySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe." });
    try {
      const guest = await storage.updateGuest(parsed.data.guestId, {
        afterparty_optin: parsed.data.afterpartyOptin,
        favorite_song: parsed.data.afterpartyOptin
          ? (parsed.data.favoriteSong ?? null)
          : null,
      });
      res.json({ guest });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  // ---- Personal details per guest ----
  app.post("/api/personal-details", async (req, res) => {
    const parsed = personalDetailsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe." });
    try {
      const d = parsed.data;
      const guest = await storage.updateGuest(d.guestId, {
        nationality: d.nationality || null,
        birth_date: d.birthDate || null,
        email: d.email,
        phone: d.phone || null,
        furigana_last_name: d.furiganaLastName || null,
        furigana_first_name: d.furiganaFirstName || null,
        kanji_last_name: d.kanjiLastName || null,
        kanji_first_name: d.kanjiFirstName || null,
        gender: d.gender || null,
        country: d.country || null,
        postal_code: d.postalCode || null,
        address: d.address || null,
      });
      res.json({ guest });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  // ---- Japan postal code -> address lookup (server-side proxy to avoid CORS) ----
  app.get("/api/postal-lookup/jp/:zipcode", async (req, res) => {
    const zipcode = (req.params.zipcode || "").replace(/[^0-9]/g, "");
    if (zipcode.length !== 7) {
      return res.status(400).json({ message: "Postleitzahl muss 7 Ziffern haben." });
    }
    try {
      const r = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`);
      const data = await r.json();
      if (data.status !== 200 || !data.results || data.results.length === 0) {
        return res.json({ found: false });
      }
      const result = data.results[0];
      const address = `${result.address1}${result.address2}${result.address3}`;
      res.json({
        found: true,
        address,
        prefecture: result.address1,
        city: result.address2,
        town: result.address3,
        prefectureKana: result.kana1,
        cityKana: result.kana2,
        townKana: result.kana3,
      });
    } catch (err) {
      console.error(err);
      res.status(502).json({ message: "Postleitzahl-Suche fehlgeschlagen." });
    }
  });

  // ---- Meal / allergy / special assistance per guest (final step) ----
  app.post("/api/meal-details", async (req, res) => {
    const parsed = mealDetailsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe." });
    try {
      const d = parsed.data;
      const guest = await storage.updateGuest(d.guestId, {
        meal_choice: d.mealChoice || null,
        allergies: d.allergies || null,
        special_assistance: d.specialAssistance || [],
        special_assistance_other: d.specialAssistance?.includes("other")
          ? d.specialAssistanceOther || null
          : null,
        checkin_completed: true,
      });
      res.json({ guest });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  // ---- Ticket delivery: download the PDF e-ticket for a booking ----
  app.get("/api/ticket/:bookingId/pdf", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.bookingId);
      if (!booking) return res.status(404).json({ message: "notfound" });
      const guests = await storage.getGuestsByBooking(booking.id);
      const attending = guests.filter((g) => g.selected);
      if (attending.length === 0) {
        return res.status(400).json({ message: "Keine teilnehmenden Gäste in dieser Buchung." });
      }
      const lang = parseLang(req.query.lang);
      const hotelBooking = await storage.getHotelBooking(booking.id);
      const pdf = await renderTicketPdf(booking, guests, lang, hotelBooking ?? null);
      res.setHeader("Content-Type", "application/pdf");
      // The ticket content depends on live, frequently-edited guest/hotel/bus
      // data. Without an explicit no-store directive, browsers may reuse a
      // previously cached response for the same URL and serve stale PDFs
      // after the guest edits their booking.
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=NANA-${booking.booking_code}-ticket.pdf`
      );
      res.send(pdf);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ticket konnte nicht erstellt werden." });
    }
  });

  // ================= Admin =================

  app.post("/api/admin/login", (req, res) => {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe." });
    if (parsed.data.password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Falsches Passwort." });
    }
    res.json({ ok: true, token: process.env.ADMIN_PASSWORD });
  });

  app.get("/api/admin/bookings", requireAdmin, async (_req, res) => {
    try {
      const bookings = await storage.listBookingsWithGuests();
      res.json({ bookings });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  app.post("/api/admin/bookings", requireAdmin, async (req, res) => {
    const parsed = adminBookingUpsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe." });
    try {
      const d = parsed.data;
      const booking = await storage.createBooking(
        d.bookingCode,
        d.lastName,
        d.firstName,
        d.guests
      );
      res.json({ booking });
    } catch (err: any) {
      console.error(err);
      if (err?.code === "23505") {
        return res.status(409).json({ message: "Buchungscode existiert bereits." });
      }
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  app.put("/api/admin/bookings/:id", requireAdmin, async (req, res) => {
    const parsed = adminBookingUpsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Ungültige Eingabe." });
    try {
      const d = parsed.data;
      const booking = await storage.updateBooking(
        req.params.id,
        d.bookingCode,
        d.lastName,
        d.firstName,
        d.guests
      );
      res.json({ booking });
    } catch (err: any) {
      console.error(err);
      if (err?.code === "23505") {
        return res.status(409).json({ message: "Buchungscode existiert bereits." });
      }
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  app.delete("/api/admin/bookings/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteBooking(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  app.delete("/api/admin/guests/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteGuest(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  // NOTE: route path intentionally does NOT end in ".csv". The published
  // site's hosting proxy treats any request path ending in a recognized
  // static-file extension (.csv, .pdf, etc.) as a static asset and forces
  // a public, long-lived Cache-Control header on it — regardless of what
  // this handler sets — which caused admins to keep downloading stale,
  // hours-old guest data. Keeping the path extension-free avoids that,
  // while Content-Disposition below still names the downloaded file
  // "gaeste.csv" for the user.
  app.get("/api/admin/export-csv", requireAdmin, async (_req, res) => {
    try {
      const bookings = await storage.listBookingsWithGuests();
      const roomTypeLabel: Record<string, string> = {
        twin: "Twin",
        family: "Family",
      };
      const mealPlanLabel: Record<string, string> = {
        room_only: "Nur Zimmer",
        breakfast: "Frühstück",
        breakfast_onsen: "Frühstück + Onsen",
      };
      const rows = [
        [
          "Buchungscode",
          "Nachname (Romaji)",
          "Vorname (Romaji)",
          "Nachname (Kanji)",
          "Vorname (Kanji)",
          "Furigana Nachname",
          "Furigana Vorname",
          "Geschlecht",
          "Teilnahme Zeremonie",
          "Check-in abgeschlossen",
          "Teilnahme Afterparty",
          "Lieblingssong",
          "Nationalität",
          "Land",
          "PLZ",
          "Adresse",
          "Reisepassnummer",
          "Geburtsdatum",
          "E-Mail",
          "Telefon",
          "Mahlzeit",
          "Allergien",
          "Assistenz",
          "Assistenz (Sonstiges)",
          "Bus-Teilnahme",
          "Hotel gewünscht",
          "Hotel Check-in",
          "Hotel Check-out",
          "Hotel Nächte",
          "Hotel Zimmer",
          "Hotel Zimmeranzahl",
          "Hotel Erwachsene (gesamt)",
          "Hotel Kinder ab 6 (gesamt)",
          "Hotel Kinder unter 6 (gesamt)",
          "Hotel Verpflegung",
          "Hotel Preis (JPY)",
        ],
      ];
      for (const b of bookings) {
        const hb = b.hotelBooking;
        let nights = "";
        if (hb?.check_in && hb?.check_out) {
          const diffMs = new Date(hb.check_out).getTime() - new Date(hb.check_in).getTime();
          nights = String(Math.round(diffMs / (1000 * 60 * 60 * 24)));
        }
        const rooms = hb?.rooms ?? [];
        const roomsSummary = rooms
          .map(
            (r) =>
              `${roomTypeLabel[r.roomType] ?? r.roomType} (${r.adults}E${r.children ? `+${r.children}K` : ""}${r.childrenUnder6 ? `+${r.childrenUnder6}K<6` : ""}, ${mealPlanLabel[r.mealPlan] ?? r.mealPlan})`
          )
          .join("; ");
        const mealPlansSummary = Array.from(
          new Set(rooms.map((r) => mealPlanLabel[r.mealPlan] ?? r.mealPlan))
        ).join("; ");
        const totalAdults = rooms.reduce((sum, r) => sum + (r.adults ?? 0), 0);
        const totalChildren = rooms.reduce((sum, r) => sum + (r.children ?? 0), 0);
        const totalChildrenUnder6 = rooms.reduce((sum, r) => sum + (r.childrenUnder6 ?? 0), 0);

        for (const g of b.guests) {
          rows.push([
            b.booking_code,
            g.last_name,
            g.first_name,
            g.kanji_last_name ?? "",
            g.kanji_first_name ?? "",
            g.furigana_last_name ?? "",
            g.furigana_first_name ?? "",
            g.gender ?? "",
            g.selected ? "nimmt teil" : "nimmt nicht teil",
            g.checkin_completed ? "ja" : "nein",
            g.afterparty_optin === true
              ? "nimmt teil"
              : g.afterparty_optin === false
                ? "nimmt nicht teil"
                : "noch offen",
            g.favorite_song ?? "",
            g.nationality ?? "",
            g.country ?? "",
            g.postal_code ?? "",
            (g.address ?? "").replace(/\n/g, " "),
            g.passport_number ?? "",
            g.birth_date ?? "",
            g.email ?? "",
            g.phone ?? "",
            g.meal_choice ?? "",
            (g.allergies ?? "").replace(/\n/g, " "),
            (g.special_assistance ?? []).join("; "),
            g.special_assistance_other ?? "",
            g.bus_optin === true
              ? "nimmt teil"
              : g.bus_optin === false
                ? "nimmt nicht teil"
                : "noch offen",
            hb?.wants_hotel ? "ja" : "nein",
            hb?.check_in ?? "",
            hb?.check_out ?? "",
            nights,
            roomsSummary,
            String(rooms.length || ""),
            String(totalAdults || ""),
            String(totalChildren || ""),
            String(totalChildrenUnder6 || ""),
            mealPlansSummary,
            hb?.total_price_jpy != null ? String(hb.total_price_jpy) : "",
          ]);
        }
      }
      const csv = rows
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      // The export reflects live, frequently-edited guest/booking data.
      // Without an explicit no-store directive, the CDN in front of the
      // published site (Cloudflare) was caching this response publicly
      // for hours (cf-cache-status: HIT, max-age=14400), so admins kept
      // downloading a stale snapshot instead of current data — the same
      // class of bug already fixed for the PDF ticket route above.
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Content-Disposition", "attachment; filename=gaeste.csv");
      res.send("\uFEFF" + csv);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Serverfehler" });
    }
  });

  return httpServer;
}
