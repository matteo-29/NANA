import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageShell } from "@/components/layout";
import { SelectionStep } from "@/components/checkin/SelectionStep";
import { AfterpartyStep } from "@/components/checkin/AfterpartyStep";
import { GuestDetailsStep } from "@/components/checkin/GuestDetailsStep";
import { GuestMealStep } from "@/components/checkin/GuestMealStep";
import { HotelStep } from "@/components/checkin/HotelStep";
import { BusStep } from "@/components/checkin/BusStep";
import { ConfirmationStep } from "@/components/checkin/ConfirmationStep";
import { DeclinedStep } from "@/components/checkin/DeclinedStep";
import type { Booking, Guest, HotelBooking, HotelRoom } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

type WizardStep =
  | "selection"
  | "afterparty"
  | "guest-details"
  | "guest-meal"
  | "hotel"
  | "bus"
  | "confirmation"
  | "declined";

export default function CheckinPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { t } = useI18n();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/booking", bookingId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/booking/${bookingId}`);
      return (await res.json()) as { booking: Booking; guests: Guest[]; hotelBooking: HotelBooking | null };
    },
  });

  const [step, setStep] = useState<WizardStep>("selection");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guestIndex, setGuestIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data && !initialized) {
      const guests = data.guests;
      const anySelected = guests.some((g) => g.selected);
      if (anySelected) {
        const preselected = guests.filter((g) => g.selected).map((g) => g.id);
        setSelectedIds(preselected);
        const allDone = guests.filter((g) => g.selected).every((g) => g.checkin_completed);
        setStep(allDone ? "confirmation" : "selection");
      } else if (data.booking.responded) {
        // The guest already submitted a selection before and explicitly
        // declined for everyone — don't silently re-select all guests just
        // because "selected=false" also happens to be the untouched-booking
        // default. Show the decline screen again; "change my mind" is an
        // explicit action from there.
        setSelectedIds([]);
        setStep("declined");
      } else {
        // Genuinely untouched booking — pre-check everyone as before.
        setSelectedIds(guests.map((g) => g.id));
        setStep("selection");
      }
      setInitialized(true);
    }
  }, [data, initialized]);

  const selectedGuests = useMemo(
    () => (data ? data.guests.filter((g) => selectedIds.includes(g.id)) : []),
    [data, selectedIds]
  );

  // Patches specific guests directly in the cached booking data instead of
  // re-fetching the whole booking from the server after every step. This
  // removes an entire network round-trip (POST + GET) per "Weiter" click,
  // which was the main cause of the slow/unclear loading behavior — and, as
  // a side effect, it also avoids re-deriving guest order from a fresh
  // server response on every step (the array position of unrelated guests
  // never changes mid-flow).
  function patchGuests(updater: (guests: Guest[]) => Guest[]) {
    queryClient.setQueryData<
      { booking: Booking; guests: Guest[]; hotelBooking: HotelBooking | null } | undefined
    >(["/api/booking", bookingId], (old) => (old ? { ...old, guests: updater(old.guests) } : old));
  }

  function patchHotelBooking(hotelBooking: HotelBooking | null) {
    queryClient.setQueryData<
      { booking: Booking; guests: Guest[]; hotelBooking: HotelBooking | null } | undefined
    >(["/api/booking", bookingId], (old) => (old ? { ...old, hotelBooking } : old));
  }

  function advanceAfterMeal() {
    if (guestIndex + 1 < selectedGuests.length) {
      setGuestIndex(guestIndex + 1);
      setStep("guest-details");
    } else {
      setStep("afterparty");
    }
  }

  const selectionMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("POST", "/api/selection", { bookingId, selectedGuestIds: ids });
      return (await res.json()) as { guests: Guest[] };
    },
    onSuccess: (result, ids) => {
      setSelectedIds(ids);
      patchGuests(() => result.guests);
      if (ids.length === 0) {
        setStep("declined");
      } else {
        setGuestIndex(0);
        setStep("guest-details");
      }
    },
  });

  const afterpartyMutation = useMutation({
    mutationFn: async (
      optins: Record<string, { afterpartyOptin: boolean; favoriteSong?: string }>
    ) => {
      const results = await Promise.all(
        Object.entries(optins).map(async ([guestId, { afterpartyOptin, favoriteSong }]) => {
          const res = await apiRequest("POST", "/api/afterparty", {
            guestId,
            afterpartyOptin,
            favoriteSong,
          });
          return (await res.json()) as { guest: Guest };
        })
      );
      return results.map((r) => r.guest);
    },
    onSuccess: (updatedGuests) => {
      patchGuests((guests) => guests.map((g) => updatedGuests.find((u) => u.id === g.id) ?? g));
      setStep("hotel");
    },
  });

  const hotelMutation = useMutation({
    mutationFn: async (values: {
      wantsHotel: boolean;
      checkIn?: string;
      checkOut?: string;
      rooms?: HotelRoom[];
    }) => {
      const res = await apiRequest("POST", "/api/hotel-booking", { bookingId, ...values });
      return (await res.json()) as { hotelBooking: HotelBooking };
    },
    onSuccess: ({ hotelBooking }) => {
      patchHotelBooking(hotelBooking);
      setStep("bus");
    },
  });

  const busMutation = useMutation({
    mutationFn: async (optins: Record<string, boolean>) => {
      const results = await Promise.all(
        Object.entries(optins).map(async ([guestId, busOptin]) => {
          const res = await apiRequest("POST", "/api/bus", { guestId, busOptin });
          return (await res.json()) as { guest: Guest };
        })
      );
      return results.map((r) => r.guest);
    },
    onSuccess: (updatedGuests) => {
      patchGuests((guests) => guests.map((g) => updatedGuests.find((u) => u.id === g.id) ?? g));
      setStep("confirmation");
    },
  });

  const detailsMutation = useMutation({
    mutationFn: async (values: {
      guestId: string;
      nationality?: string;
      birthDate?: string;
      email: string;
      phone?: string;
      furiganaLastName?: string;
      furiganaFirstName?: string;
      kanjiLastName?: string;
      kanjiFirstName?: string;
      gender?: string;
      country?: string;
      postalCode?: string;
      address?: string;
    }) => {
      const res = await apiRequest("POST", "/api/personal-details", values);
      return (await res.json()) as { guest: Guest };
    },
    onSuccess: ({ guest }) => {
      patchGuests((guests) => guests.map((g) => (g.id === guest.id ? guest : g)));
      setStep("guest-meal");
    },
  });

  const mealMutation = useMutation({
    mutationFn: async (values: {
      guestId: string;
      mealChoice?: string;
      allergies?: string;
      specialAssistance?: string[];
      specialAssistanceOther?: string;
    }) => {
      const res = await apiRequest("POST", "/api/meal-details", values);
      return (await res.json()) as { guest: Guest };
    },
    onSuccess: ({ guest }) => {
      patchGuests((guests) => guests.map((g) => (g.id === guest.id ? guest : g)));
      advanceAfterMeal();
    },
  });

  if (isLoading || !initialized) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("common.loading")}
        </div>
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell>
        <p className="text-center text-destructive py-24">{t("common.genericError")}</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {step === "selection" && (
        <SelectionStep
          guests={data.guests}
          initialSelected={selectedIds}
          onSubmit={(ids) => selectionMutation.mutate(ids)}
          isSubmitting={selectionMutation.isPending}
        />
      )}

      {step === "afterparty" && (
        <AfterpartyStep
          guests={data.guests}
          onSubmit={(entries) => afterpartyMutation.mutate(entries)}
          onBack={() => {
            setGuestIndex(selectedGuests.length - 1);
            setStep("guest-meal");
          }}
          isSubmitting={afterpartyMutation.isPending}
        />
      )}

      {step === "hotel" && (
        <HotelStep
          bookingId={bookingId!}
          initial={data.hotelBooking}
          onSubmit={(values) => hotelMutation.mutate(values)}
          onBack={() => setStep("afterparty")}
          isSubmitting={hotelMutation.isPending}
        />
      )}

      {step === "bus" && (
        <BusStep
          guests={data.guests}
          onSubmit={(optins) => busMutation.mutate(optins)}
          onBack={() => setStep("hotel")}
          isSubmitting={busMutation.isPending}
        />
      )}

      {step === "guest-details" && selectedGuests[guestIndex] && (
        <GuestDetailsStep
          guest={selectedGuests[guestIndex]}
          guestIndex={guestIndex}
          guestTotal={selectedGuests.length}
          onSubmit={(values) =>
            detailsMutation.mutate({ guestId: selectedGuests[guestIndex].id, ...values })
          }
          onSkip={() => setStep("guest-meal")}
          onBack={() => {
            if (guestIndex === 0) {
              setStep("selection");
            } else {
              setGuestIndex(guestIndex - 1);
              setStep("guest-meal");
            }
          }}
          isSubmitting={detailsMutation.isPending}
        />
      )}

      {step === "guest-meal" && selectedGuests[guestIndex] && (
        <GuestMealStep
          guest={selectedGuests[guestIndex]}
          guestIndex={guestIndex}
          guestTotal={selectedGuests.length}
          isLast={guestIndex + 1 === selectedGuests.length}
          onSubmit={(values) =>
            mealMutation.mutate({ guestId: selectedGuests[guestIndex].id, ...values })
          }
          onSkip={advanceAfterMeal}
          onBack={() => setStep("guest-details")}
          isSubmitting={mealMutation.isPending}
        />
      )}

      {step === "confirmation" && (
        <ConfirmationStep
          booking={data.booking}
          guests={data.guests}
          hotelBooking={data.hotelBooking}
          onEditSelection={() => setStep("selection")}
          onEditAfterparty={() => setStep("afterparty")}
          onEditHotel={() => setStep("hotel")}
          onEditBus={() => setStep("bus")}
          onEditGuest={(idx) => {
            setGuestIndex(idx);
            setStep("guest-details");
          }}
        />
      )}

      {step === "declined" && (
        <DeclinedStep onEditSelection={() => setStep("selection")} />
      )}
    </PageShell>
  );
}
