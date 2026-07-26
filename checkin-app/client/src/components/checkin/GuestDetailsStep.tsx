import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
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

function buildDetailsFormSchema(emailInvalidMessage: string) {
  return z.object({
    nationality: z.string().optional(),
    passportNumber: z.string().optional(),
    birthDate: z.string().optional(),
    email: z.string().email({ message: emailInvalidMessage }),
    phone: z.string().optional(),
    furigana: z.string().optional(),
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
  onBack,
  isSubmitting,
}: {
  guest: Guest;
  guestIndex: number;
  guestTotal: number;
  onSubmit: (values: DetailsFormValues) => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const { t, lang } = useI18n();
  const detailsFormSchema = buildDetailsFormSchema(t("details.emailInvalid"));
  const countryNames = useCountryNames(lang);
  const [postalStatus, setPostalStatus] = useState<"idle" | "loading" | "not_found">("idle");
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: {
      nationality: guest.nationality ?? "",
      passportNumber: guest.passport_number ?? "",
      birthDate: guest.birth_date ?? "",
      email: guest.email ?? "",
      phone: guest.phone ?? "",
      furigana: guest.furigana ?? "",
      gender: guest.gender ?? "",
      country: guest.country ?? "",
      postalCode: guest.postal_code ?? "",
      address: guest.address ?? "",
    },
  });

  const country = form.watch("country");

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
        total={4}
        labels={[t("step.selection"), t("step.details"), t("step.meal"), t("step.afterparty")]}
      />
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
          {t("details.eyebrow")}
        </p>
        <h1 className="text-xl font-bold text-foreground mb-1">{t("details.title")}</h1>
        <p className="text-sm text-muted-foreground mb-1">{t("details.subtitle")}</p>
        <p
          className="text-sm font-medium text-primary"
          data-testid="text-current-guest"
        >
          {guest.first_name} {guest.last_name} · {t("common.guestOf", { current: guestIndex + 1, total: guestTotal })}
        </p>
      </div>

      <Card className="border-card-border">
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
              data-testid="form-guest-details"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="furigana"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("details.furigana")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("details.furiganaPlaceholder")}
                          data-testid="input-furigana"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>

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
              <FormField
                control={form.control}
                name="passportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("details.passport")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("details.passportPlaceholder")}
                        data-testid="input-passport"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.next")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
