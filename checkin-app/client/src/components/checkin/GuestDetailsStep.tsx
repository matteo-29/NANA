import { useMemo, useRef, useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Guest } from "@shared/schema";
import { GENDER_OPTIONS } from "@shared/schema";
import { COUNTRIES } from "@shared/countries";
import { StepBar } from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

function buildDetailsFormSchema(
  emailInvalidMessage: string,
  requiredMessage: string,
  isJa: boolean,
) {
  const requiredJaString = () =>
    isJa ? z.string().min(1, { message: requiredMessage }) : z.string().optional();
  return z.object({
    nationality: z.string().optional(),
    birthDate: z.string().optional(),
    email: z.string().min(1, { message: requiredMessage }).email({ message: emailInvalidMessage }),
    phone: z.string().optional(),
    furiganaLastName: requiredJaString(),
    furiganaFirstName: requiredJaString(),
    kanjiLastName: requiredJaString(),
    kanjiFirstName: requiredJaString(),
    gender: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    address: z.string().optional(),
  });
}

export type DetailsFormValues = z.infer<ReturnType<typeof buildDetailsFormSchema>>;

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

export function GuestDetailsStep({
  guest,
  guestIndex,
  guestTotal,
  onSubmit,
  onSkip,
  onBack,
  isSubmitting,
}: {
  guest: Guest;
  guestIndex: number;
  guestTotal: number;
  onSubmit: (values: DetailsFormValues) => void;
  onSkip: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const { t, lang } = useI18n();
  const detailsFormSchema = buildDetailsFormSchema(
    t("details.emailInvalid"),
    t("common.required"),
    lang === "ja",
  );
  const countryNames = useCountryNames(lang);
  const [postalStatus, setPostalStatus] = useState<"idle" | "loading" | "not_found">("idle");
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: {
      nationality: guest.nationality ?? "",
      birthDate: guest.birth_date ?? "",
      email: guest.email ?? "",
      phone: guest.phone ?? "",
      furiganaLastName: guest.furigana_last_name ?? "",
      furiganaFirstName: guest.furigana_first_name ?? "",
      kanjiLastName: guest.kanji_last_name ?? "",
      kanjiFirstName: guest.kanji_first_name ?? "",
      gender: guest.gender ?? "",
      country: guest.country ?? "",
      postalCode: guest.postal_code ?? "",
      address: guest.address ?? "",
    },
  });

  const country = form.watch("country");
  // react-hook-form only computes/tracks `isDirty` for fields that are read
  // during render (its formState is a lazily-subscribed proxy) — reading
  // `form.formState.isDirty` only inside the submit callback silently always
  // returns false. `useFormState` here subscribes properly so the value
  // below reflects real edits.
  const { isDirty } = useFormState({ control: form.control });

  // If the guest didn't change any field, there is nothing new to persist —
  // skip the network round-trip entirely and move straight to the next
  // step. This is what makes "Weiter" feel instant when nothing changed,
  // per the request to not wait on unmodified steps.
  function handleSubmit(values: DetailsFormValues) {
    if (!isDirty) {
      onSkip();
      return;
    }
    onSubmit(values);
  }

  function handlePostalCodeChange(value: string) {
    form.setValue("postalCode", value);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (country !== "JP") return;
    const digits = value.replace(/[^0-9]/g, "");
    if (digits.length !== 7) {
      setPostalStatus("idle");
      return;
    }
    lookupTimer.current = setTimeout(async () => {
      setPostalStatus("loading");
      try {
        const res = await apiRequest("GET", `/api/postal-lookup/jp/${digits}`);
        const data = await res.json();
        if (data.found) {
          if (!form.getValues("address")) {
            form.setValue("address", data.address, { shouldValidate: true });
          }
          setPostalStatus("idle");
        } else {
          setPostalStatus("not_found");
        }
      } catch {
        setPostalStatus("not_found");
      }
    }, 500);
  }

  return (
    <div>
      <StepBar
        step={1}
        total={6}
        labels={[t("step.selection"), t("step.details"), t("step.meal"), t("step.afterparty"), t("step.hotel"), t("step.bus")]}
      />
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
          {t("details.eyebrow")}
        </p>
        <h1
          className="text-xl font-bold text-foreground mb-1"
          data-testid="text-current-guest"
        >
          {t("details.title")} — {guest.last_name} {guest.first_name}
        </h1>
        <p className="text-sm text-muted-foreground mb-1">
          {t("common.guestOf", { current: guestIndex + 1, total: guestTotal })}
        </p>
        <p className="text-sm text-muted-foreground">{t("details.subtitle")}</p>
      </div>

      <Card className="border-card-border">
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col gap-5"
              data-testid="form-guest-details"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="furiganaLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("details.furiganaLastName")}
                        {lang === "ja" && <span className="text-destructive"> *</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("details.furiganaLastNamePlaceholder")}
                          data-testid="input-furigana-last"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="furiganaFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("details.furiganaFirstName")}
                        {lang === "ja" && <span className="text-destructive"> *</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("details.furiganaFirstNamePlaceholder")}
                          data-testid="input-furigana-first"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="kanjiLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("details.kanjiLastName")}{" "}
                        {lang === "ja" ? (
                          <span className="text-destructive">*</span>
                        ) : (
                          <span className="text-muted-foreground font-normal">
                            ({t("common.optional")})
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("details.kanjiLastNamePlaceholder")}
                          data-testid="input-kanji-last"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kanjiFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("details.kanjiFirstName")}{" "}
                        {lang === "ja" ? (
                          <span className="text-destructive">*</span>
                        ) : (
                          <span className="text-muted-foreground font-normal">
                            ({t("common.optional")})
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("details.kanjiFirstNamePlaceholder")}
                          data-testid="input-kanji-first"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("details.gender")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gender">
                          <SelectValue placeholder={t("details.genderPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt} data-testid={`option-gender-${opt}`}>
                            {t(`details.gender.${opt}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("details.email")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t("details.emailPlaceholder")}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("details.phone")}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({t("common.optional")})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("details.phonePlaceholder")} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t border-border pt-5 flex flex-col gap-5">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("details.country")}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          setPostalStatus("idle");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-country">
                            <SelectValue placeholder={t("details.countryPlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-72">
                          {countryNames.map(({ code, name }) => (
                            <SelectItem key={code} value={code} data-testid={`option-country-${code}`}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("details.postalCode")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => handlePostalCodeChange(e.target.value)}
                            placeholder={t("details.postalCodePlaceholder")}
                            data-testid="input-postal-code"
                          />
                        </FormControl>
                        {country === "JP" && postalStatus === "loading" && (
                          <p className="text-xs text-muted-foreground" data-testid="text-postal-loading">
                            {t("details.postalLooking")}
                          </p>
                        )}
                        {country === "JP" && postalStatus === "not_found" && (
                          <p className="text-xs text-muted-foreground" data-testid="text-postal-not-found">
                            {t("details.postalNotFound")}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("details.address")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("details.addressPlaceholder")}
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("details.nationality")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("details.nationalityPlaceholder")}
                          data-testid="input-nationality"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("details.birthDate")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-birth-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="rounded-full"
                  onClick={onBack}
                  data-testid="button-back"
                >
                  {t("common.back")}
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-full flex-1 sm:flex-none"
                  disabled={isSubmitting}
                  data-testid="button-next"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("common.saving")}
                    </span>
                  ) : (
                    t("common.next")
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
