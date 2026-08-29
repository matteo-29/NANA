import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, API_BASE } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAdminAuth } from "@/lib/admin-auth";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Download, LogOut, Pencil } from "lucide-react";
import type { Booking, Guest, HotelBooking } from "@shared/schema";
import { GENDER_OPTIONS, MEAL_OPTIONS, SPECIAL_ASSISTANCE_OPTIONS } from "@shared/schema";
import { COUNTRIES } from "@shared/countries";

type BookingWithGuests = Booking & { guests: Guest[]; hotelBooking?: HotelBooking | null };
type EditableGuest = {
  id?: string;
  firstName: string;
  lastName: string;
  afterpartyOptin: boolean | null;
  nationality: string;
  passportNumber: string;
  birthDate: string;
  email: string;
  phone: string;
  furiganaLastName: string;
  furiganaFirstName: string;
  kanjiLastName: string;
  kanjiFirstName: string;
  gender: string;
  country: string;
  postalCode: string;
  address: string;
  mealChoice: string;
  allergies: string;
  specialAssistance: string[];
  specialAssistanceOther: string;
};

function emptyGuest(): EditableGuest {
  return {
    firstName: "",
    lastName: "",
    afterpartyOptin: null,
    nationality: "",
    passportNumber: "",
    birthDate: "",
    email: "",
    phone: "",
    furiganaLastName: "",
    furiganaFirstName: "",
    kanjiLastName: "",
    kanjiFirstName: "",
    gender: "",
    country: "",
    postalCode: "",
    address: "",
    mealChoice: "",
    allergies: "",
    specialAssistance: [],
    specialAssistanceOther: "",
  };
}

function guestFromRecord(g: Guest): EditableGuest {
  return {
    id: g.id,
    firstName: g.first_name,
    lastName: g.last_name,
    afterpartyOptin: g.afterparty_optin,
    nationality: g.nationality ?? "",
    passportNumber: g.passport_number ?? "",
    birthDate: g.birth_date ?? "",
    email: g.email ?? "",
    phone: g.phone ?? "",
    furiganaLastName: g.furigana_last_name ?? "",
    furiganaFirstName: g.furigana_first_name ?? "",
    kanjiLastName: g.kanji_last_name ?? "",
    kanjiFirstName: g.kanji_first_name ?? "",
    gender: g.gender ?? "",
    country: g.country ?? "",
    postalCode: g.postal_code ?? "",
    address: g.address ?? "",
    mealChoice: g.meal_choice ?? "",
    allergies: g.allergies ?? "",
    specialAssistance: g.special_assistance ?? [],
    specialAssistanceOther: g.special_assistance_other ?? "",
  };
}

function useCountryNames(lang: string) {
  return useMemo(() => {
    try {
      const dn = new Intl.DisplayNames([lang], { type: "region" });
      const entries = COUNTRIES.map((code) => ({ code, name: dn.of(code) ?? code }));
      entries.sort((a, b) => a.name.localeCompare(b.name, lang));
      return entries;
    } catch {
      return COUNTRIES.map((code) => ({ code, name: code }));
    }
  }, [lang]);
}

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const { password, setPassword } = useAdminAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!password) navigate("/admin");
  }, [password, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/bookings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/bookings", undefined, {
        "x-admin-password": password ?? "",
      });
      return (await res.json()) as { bookings: BookingWithGuests[] };
    },
    enabled: !!password,
  });

  const [editing, setEditing] = useState<BookingWithGuests | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookingWithGuests | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/bookings/${id}`, undefined, {
        "x-admin-password": password ?? "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      setDeleteTarget(null);
    },
  });

  async function exportCsv() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/export.csv`, {
        headers: { "x-admin-password": password ?? "" },
      });
      if (!res.ok) {
        let message = `Fehler ${res.status}`;
        try {
          const body = await res.json();
          message = body?.message || body?.detail || message;
        } catch {
          // response wasn't JSON, keep the generic status message
        }
        toast({ title: "CSV-Export fehlgeschlagen", description: message, variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gaeste.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: "CSV-Export fehlgeschlagen",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  }

  const bookings = data?.bookings ?? [];

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">
          {t("admin.dashboardTitle")}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={exportCsv}
            data-testid="button-export-csv"
          >
            <Download className="h-3.5 w-3.5" />
            {t("admin.exportCsv")}
          </Button>
          <Button
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setEditing("new")}
            data-testid="button-new-booking"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("admin.newBooking")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setPassword(null)}
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("admin.logout")}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("common.loading")}
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-16">{t("admin.noBookings")}</p>
      )}

      <div className="flex flex-col gap-3">
        {bookings.map((b) => {
          const doneCount = b.guests.filter((g) => g.checkin_completed).length;
          const afterpartyCount = b.guests.filter((g) => g.afterparty_optin).length;
          const busCount = b.guests.filter((g) => g.bus_optin).length;
          const hasHotel = !!b.hotelBooking;
          return (
            <Card key={b.id} className="border-card-border" data-testid={`card-booking-${b.id}`}>
              <CardContent className="pt-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary text-sm tracking-widest">
                        {b.booking_code}
                      </span>
                      <Badge variant="outline">
                        {doneCount}/{b.guests.length} {t("admin.selected")}
                      </Badge>
                      <Badge variant="outline">
                        {afterpartyCount} {t("admin.afterparty")}
                      </Badge>
                      <Badge variant={hasHotel ? "default" : "outline"} data-testid={`badge-hotel-${b.id}`}>
                        {hasHotel ? t("admin.hotelYes") : t("admin.hotelNo")}
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-bus-${b.id}`}>
                        {busCount} {t("admin.busShort")}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {b.last_name} {b.first_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(b)}
                      data-testid={`button-edit-booking-${b.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(b)}
                      data-testid={`button-delete-booking-${b.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {b.guests.map((g) => (
                    <Badge
                      key={g.id}
                      variant={g.checkin_completed ? "default" : "outline"}
                      data-testid={`badge-guest-${g.id}`}
                    >
                      {g.last_name} {g.first_name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editing && (
        <BookingEditDialog
          initial={editing === "new" ? null : editing}
          password={password ?? ""}
          onClose={() => setEditing(null)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.booking_code}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              data-testid="button-confirm-delete"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function BookingEditDialog({
  initial,
  password,
  onClose,
}: {
  initial: BookingWithGuests | null;
  password: string;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const countryNames = useCountryNames(lang);
  const [bookingCode, setBookingCode] = useState(initial?.booking_code ?? "");
  const [lastName, setLastName] = useState(initial?.last_name ?? "");
  const [firstName, setFirstName] = useState(initial?.first_name ?? "");
  const [guests, setGuests] = useState<EditableGuest[]>(
    initial?.guests.map(guestFromRecord) ?? [
      { ...emptyGuest(), firstName: initial?.first_name ?? "", lastName: initial?.last_name ?? "" },
    ]
  );
  const [error, setError] = useState<string | null>(null);
  // For a brand-new booking, mirror the primary name into the first guest row
  // until the admin edits that row directly - otherwise the hidden empty guest
  // row fails validation ("Ungueltige Eingabe") even though the top-level
  // "Primary" name fields were filled in.
  const [guestNameTouched, setGuestNameTouched] = useState<boolean>(!!initial);
  useEffect(() => {
    if (initial || guestNameTouched) return;
    setGuests((prev) => {
      if (prev.length === 0) return prev;
      const first = prev[0];
      if (first.lastName === lastName && first.firstName === firstName) return prev;
      const next = [...prev];
      next[0] = { ...first, lastName, firstName };
      return next;
    });
  }, [lastName, firstName, initial, guestNameTouched]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { bookingCode, lastName, firstName, guests };
      if (initial) {
        await apiRequest("PUT", `/api/admin/bookings/${initial.id}`, payload, {
          "x-admin-password": password,
        });
      } else {
        await apiRequest("POST", "/api/admin/bookings", payload, {
          "x-admin-password": password,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      onClose();
    },
    onError: (err: Error) => {
      console.error("Booking save failed:", err);
      const statusMatch = err.message.match(/^(\d{3}):/);
      const status = statusMatch?.[1];
      if (status === "409") {
        setError("Buchungscode existiert bereits.");
      } else if (status) {
        setError(`${t("common.genericError")} (${status}: ${err.message.slice(err.message.indexOf(":") + 1).trim()})`);
      } else {
        setError(`${t("common.genericError")} (${err.message})`);
      }
    },
  });

  function updateGuest(idx: number, patch: Partial<EditableGuest>) {
    setGuests((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }

  function addGuest() {
    setGuests((prev) => [...prev, emptyGuest()]);
  }

  function removeGuest(idx: number) {
    setGuests((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleAssistance(idx: number, option: string, checked: boolean) {
    setGuests((prev) =>
      prev.map((g, i) => {
        if (i !== idx) return g;
        const next = checked
          ? [...g.specialAssistance, option]
          : g.specialAssistance.filter((o) => o !== option);
        return { ...g, specialAssistance: next };
      })
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? initial.booking_code : t("admin.newBooking")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("admin.bookingCode")}</Label>
            <Input
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              data-testid="input-edit-booking-code"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("admin.primaryLastName")}</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                data-testid="input-edit-primary-last-name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("admin.primaryFirstName")}</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="input-edit-primary-first-name"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("admin.guestsHeading")}</Label>
            <p className="text-xs text-muted-foreground -mt-1">{t("admin.prefillNote")}</p>
            <Accordion type="multiple" className="flex flex-col gap-2">
              {guests.map((g, idx) => (
                <AccordionItem
                  key={idx}
                  value={`guest-${idx}`}
                  className="border border-card-border rounded-lg px-3"
                >
                  <div className="flex items-center gap-2 py-2">
                    <Input
                      value={g.lastName}
                      onChange={(e) => {
                        updateGuest(idx, { lastName: e.target.value });
                        if (idx === 0) setGuestNameTouched(true);
                      }}
                      placeholder={t("entry.lastName")}
                      data-testid={`input-guest-last-${idx}`}
                    />
                    <Input
                      value={g.firstName}
                      onChange={(e) => {
                        updateGuest(idx, { firstName: e.target.value });
                        if (idx === 0) setGuestNameTouched(true);
                      }}
                      placeholder={t("entry.firstName")}
                      data-testid={`input-guest-first-${idx}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      disabled={guests.length <= 1}
                      onClick={() => removeGuest(idx)}
                      data-testid={`button-remove-guest-${idx}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <AccordionTrigger
                    className="text-xs text-muted-foreground py-2 hover:no-underline"
                    data-testid={`trigger-advanced-${idx}`}
                  >
                    {t("admin.advancedDetails")}
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-4 pt-1 pb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("details.furiganaLastName")}</Label>
                        <Input
                          value={g.furiganaLastName}
                          onChange={(e) => updateGuest(idx, { furiganaLastName: e.target.value })}
                          placeholder={t("details.furiganaLastNamePlaceholder")}
                          data-testid={`input-guest-furigana-last-${idx}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("details.furiganaFirstName")}</Label>
                        <Input
                          value={g.furiganaFirstName}
                          onChange={(e) => updateGuest(idx, { furiganaFirstName: e.target.value })}
                          placeholder={t("details.furiganaFirstNamePlaceholder")}
                          data-testid={`input-guest-furigana-first-${idx}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("details.kanjiLastName")}</Label>
                        <Input
                          value={g.kanjiLastName}
                          onChange={(e) => updateGuest(idx, { kanjiLastName: e.target.value })}
                          data-testid={`input-guest-kanji-last-${idx}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("details.kanjiFirstName")}</Label>
                        <Input
                          value={g.kanjiFirstName}
                          onChange={(e) => updateGuest(idx, { kanjiFirstName: e.target.value })}
                          data-testid={`input-guest-kanji-first-${idx}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("details.gender")}</Label>
                        <Select
                          value={g.gender}
                          onValueChange={(v) => updateGuest(idx, { gender: v })}
                        >
                          <SelectTrigger data-testid={`select-guest-gender-${idx}`}>
                            <SelectValue placeholder={t("details.genderPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDER_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {t(`details.gender.${opt}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("details.email")}</Label>
                        <Input
                          value={g.email}
                          onChange={(e) => updateGuest(idx, { email: e.target.value })}
                          type="email"
                          data-testid={`input-guest-email-${idx}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("details.phone")}</Label>
                        <Input
                          value={g.phone}
                          onChange={(e) => updateGuest(idx, { phone: e.target.value })}
                          data-testid={`input-guest-phone-${idx}`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label>{t("details.country")}</Label>
                      <Select
                        value={g.country}
                        onValueChange={(v) => updateGuest(idx, { country: v })}
                      >
                        <SelectTrigger data-testid={`select-guest-country-${idx}`}>
                          <SelectValue placeholder={t("details.countryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {countryNames.map(({ code, name }) => (
                            <SelectItem key={code} value={code}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("details.postalCode")}</Label>
                        <Input
                          value={g.postalCode}
                          onChange={(e) => updateGuest(idx, { postalCode: e.target.value })}
                          data-testid={`input-guest-postal-${idx}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("details.nationality")}</Label>
                        <Input
                          value={g.nationality}
                          onChange={(e) => updateGuest(idx, { nationality: e.target.value })}
                          data-testid={`input-guest-nationality-${idx}`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label>{t("details.address")}</Label>
                      <Input
                        value={g.address}
                        onChange={(e) => updateGuest(idx, { address: e.target.value })}
                        data-testid={`input-guest-address-${idx}`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("details.birthDate")}</Label>
                        <Input
                          value={g.birthDate}
                          onChange={(e) => updateGuest(idx, { birthDate: e.target.value })}
                          type="date"
                          data-testid={`input-guest-birthdate-${idx}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("details.passport")}</Label>
                        <Input
                          value={g.passportNumber}
                          onChange={(e) => updateGuest(idx, { passportNumber: e.target.value })}
                          data-testid={`input-guest-passport-${idx}`}
                        />
                      </div>
                    </div>

                    <div className="border-t border-border pt-3 flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("meal.mealChoice")}</Label>
                        <Select
                          value={g.mealChoice}
                          onValueChange={(v) => updateGuest(idx, { mealChoice: v })}
                        >
                          <SelectTrigger data-testid={`select-guest-meal-${idx}`}>
                            <SelectValue placeholder={t("meal.mealPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {MEAL_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {t(`meal.option.${opt}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("meal.allergies")}</Label>
                        <Textarea
                          value={g.allergies}
                          onChange={(e) => updateGuest(idx, { allergies: e.target.value })}
                          data-testid={`textarea-guest-allergies-${idx}`}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>{t("meal.assistance")}</Label>
                        <div className="flex flex-col gap-1.5">
                          {SPECIAL_ASSISTANCE_OPTIONS.map((opt) => (
                            <div key={opt} className="flex items-center gap-2">
                              <Checkbox
                                checked={g.specialAssistance.includes(opt)}
                                onCheckedChange={(checked) =>
                                  toggleAssistance(idx, opt, checked === true)
                                }
                                data-testid={`checkbox-guest-assist-${opt}-${idx}`}
                              />
                              <Label className="font-normal">{t(`assist.${opt}`)}</Label>
                            </div>
                          ))}
                        </div>
                        {g.specialAssistance.includes("other") && (
                          <Input
                            value={g.specialAssistanceOther}
                            onChange={(e) =>
                              updateGuest(idx, { specialAssistanceOther: e.target.value })
                            }
                            placeholder={t("assist.otherPlaceholder")}
                            data-testid={`input-guest-assist-other-${idx}`}
                          />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("admin.afterpartyOptin")}</Label>
                        <Select
                          value={g.afterpartyOptin === true ? "yes" : g.afterpartyOptin === false ? "no" : "unset"}
                          onValueChange={(v) =>
                            updateGuest(idx, {
                              afterpartyOptin: v === "yes" ? true : v === "no" ? false : null,
                            })
                          }
                        >
                          <SelectTrigger data-testid={`select-guest-afterparty-${idx}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">{t("admin.afterpartyYes")}</SelectItem>
                            <SelectItem value="no">{t("admin.afterpartyNo")}</SelectItem>
                            <SelectItem value="unset">{t("admin.afterpartyUnset")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="rounded-full self-start gap-1.5 mt-1"
              onClick={addGuest}
              data-testid="button-add-guest"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("admin.addGuest")}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive" data-testid="text-edit-error">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-edit">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              setError(null);
              saveMutation.mutate();
            }}
            disabled={saveMutation.isPending}
            data-testid="button-save-booking"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("admin.saveBooking")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
