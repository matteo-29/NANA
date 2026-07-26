import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useAdminAuth } from "@/lib/admin-auth";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { Booking, Guest } from "@shared/schema";

type BookingWithGuests = Booking & { guests: Guest[] };
type EditableGuest = { id?: string; firstName: string; lastName: string };

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const { password, setPassword } = useAdminAuth();
  const [, navigate] = useLocation();

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

  function exportCsv() {
    fetch(`/api/admin/export.csv`, { headers: { "x-admin-password": password ?? "" } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "gaeste.csv";
        a.click();
        URL.revokeObjectURL(url);
      });
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
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {b.first_name} {b.last_name}
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
                      {g.first_name} {g.last_name}
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
  const { t } = useI18n();
  const [bookingCode, setBookingCode] = useState(initial?.booking_code ?? "");
  const [lastName, setLastName] = useState(initial?.last_name ?? "");
  const [firstName, setFirstName] = useState(initial?.first_name ?? "");
  const [guests, setGuests] = useState<EditableGuest[]>(
    initial?.guests.map((g) => ({ id: g.id, firstName: g.first_name, lastName: g.last_name })) ?? [
      { firstName: initial?.first_name ?? "", lastName: initial?.last_name ?? "" },
    ]
  );
  const [error, setError] = useState<string | null>(null);

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
      setError(err.message.includes("409") ? "Buchungscode existiert bereits." : t("common.genericError"));
    },
  });

  function updateGuest(idx: number, patch: Partial<EditableGuest>) {
    setGuests((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }

  function addGuest() {
    setGuests((prev) => [...prev, { firstName: "", lastName: "" }]);
  }

  function removeGuest(idx: number) {
    setGuests((prev) => prev.filter((_, i) => i !== idx));
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
              <Label>{t("admin.primaryFirstName")}</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="input-edit-primary-first-name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("admin.primaryLastName")}</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                data-testid="input-edit-primary-last-name"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("admin.guestsHeading")}</Label>
            {guests.map((g, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={g.firstName}
                  onChange={(e) => updateGuest(idx, { firstName: e.target.value })}
                  placeholder={t("entry.firstName")}
                  data-testid={`input-guest-first-${idx}`}
                />
                <Input
                  value={g.lastName}
                  onChange={(e) => updateGuest(idx, { lastName: e.target.value })}
                  placeholder={t("entry.lastName")}
                  data-testid={`input-guest-last-${idx}`}
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
            ))}
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
