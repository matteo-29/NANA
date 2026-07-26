import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageShell } from "@/components/layout";
import { SelectionStep } from "@/components/checkin/SelectionStep";
import { AfterpartyStep } from "@/components/checkin/AfterpartyStep";
import { GuestDetailsStep } from "@/components/checkin/GuestDetailsStep";
import { GuestMealStep } from "@/components/checkin/GuestMealStep";
import { ConfirmationStep } from "@/components/checkin/ConfirmationStep";
import type { Booking, Guest } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

type WizardStep = "selection" | "afterparty" | "guest-details" | "guest-meal" | "confirmation";

export default function CheckinPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { t } = useI18n();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/booking", bookingId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/booking/${bookingId}`);
      return (await res.json()) as { booking: Booking; guests: Guest[] };
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
      const preselected = anySelected
        ? guests.filter((g) => g.selected).map((g) => g.id)
        : guests.map((g) => g.id);
      setSelectedIds(preselected);
      const allDone = anySelected && guests.filter((g) => g.selected).every((g) => g.checkin_completed);
      setStep(allDone ? "confirmation" : "selection");
      setInitialized(true);
    }
  }, [data, initialized]);

  const selectedGuests = useMemo(
    () => (data ? data.guests.filter((g) => selectedIds.includes(g.id)) : []),
    [data, selectedIds]
  );

  async function refetchBooking() {
    await queryClient.invalidateQueries({ queryKey: ["/api/booking", bookingId] });
  }

  const selectionMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest("POST", "/api/selection", { bookingId, selectedGuestIds: ids });
    },
    onSuccess: async (_data, ids) => {
      setSelectedIds(ids);
      await refetchBooking();
      setStep("afterparty");
    },
  });

  const afterpartyMutation = useMutation({
    mutationFn: async (optins: Record<string, boolean>) => {
      await Promise.all(
        Object.entries(optins).map(([guestId, afterpartyOptin]) =>
          apiRequest("POST", "/api/afterparty", { guestId, afterpartyOptin })
        )
      );
    },
    onSuccess: async () => {
      await refetchBooking();
      setGuestIndex(0);
      setStep("guest-details");
    },
  });

  const detailsMutation = useMutation({
    mutationFn: async (values: {
      guestId: string;
      nationality?: string;
      passportNumber?: string;
      birthDate?: string;
      email: string;
      phone?: string;
      furigana?: string;
      gender?: string;
      country?: string;
      postalCode?: string;
      address?: string;
    }) => {
      await apiRequest("POST", "/api/personal-details", values);
    },
    onSuccess: async () => {
      await refetchBooking();
      setStep("guest-meal");
    },
  });

  const mealMutation = useMutation({
    mutationFn: async (values: {
      guestId: string;
      mealChoice?: string;
      allergies?: string;
      specialAssistance?: string[];
    }) => {
      await apiRequest("POST", "/api/meal-details", values);
    },
    onSuccess: async () => {
      await refetchBooking();
      if (guestIndex + 1 < selectedGuests.length) {
        setGuestIndex(guestIndex + 1);
        setStep("guest-details");
      } else {
        setStep("confirmation");
      }
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
          guests={selectedGuests}
          onSubmit={(optins) => afterpartyMutation.mutate(optins)}
          onBack={() => setStep("selection")}
          isSubmitting={afterpartyMutation.isPending}
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
          onBack={() => {
            if (guestIndex === 0) {
              setStep("afterparty");
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
          onBack={() => setStep("guest-details")}
          isSubmitting={mealMutation.isPending}
        />
      )}

      {step === "confirmation" && (
        <ConfirmationStep
          guests={data.guests}
          onEditSelection={() => setStep("selection")}
          onEditAfterparty={() => setStep("afterparty")}
          onEditGuest={(idx) => {
            setGuestIndex(idx);
            setStep("guest-details");
          }}
        />
      )}
    </PageShell>
  );
}
