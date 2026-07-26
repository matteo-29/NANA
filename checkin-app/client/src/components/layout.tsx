import { type ReactNode } from "react";
import { Link } from "wouter";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";
import nanaLogo from "@/assets/nana/nana_logo.jpg";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
      <SelectTrigger
        className="h-8 w-[6.5rem] rounded-full border-input bg-white text-xs font-semibold text-foreground"
        data-testid="select-language"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGS.map((l) => (
          <SelectItem key={l.code} value={l.code} data-testid={`option-lang-${l.code}`}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NoticeBar() {
  const { t } = useI18n();
  return (
    <div className="bg-notice border-b border-notice-border text-notice-foreground">
      <div className="mx-auto max-w-3xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[12px] sm:text-[13px]">
        <span className="flex items-center gap-2">
          <b className="rounded-full border border-notice-foreground/25 bg-white/70 px-2 py-0.5 text-[10px] font-bold tracking-wide">
            {t("notice.tag")}
          </b>
          <span>{t("notice.text")}</span>
        </span>
        <span className="font-medium tracking-wide whitespace-nowrap">
          {t("app.flight")} · {t("notice.date")}
        </span>
      </div>
    </div>
  );
}

export function Header() {
  const { t } = useI18n();
  return (
    <header className="bg-white border-b border-border sticky top-0 z-20">
      <div className="mx-auto max-w-3xl px-4 h-[64px] flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0" data-testid="link-home">
          <img src={nanaLogo} alt="NANA" className="h-6 sm:h-7 w-auto object-contain" />
          <span className="hidden sm:inline text-xs font-semibold text-foreground/60 tracking-wide">
            {t("app.tagline")}
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/admin"
            className="hidden sm:inline text-xs font-semibold text-foreground/70 hover:text-primary transition-colors"
            data-testid="link-admin-nav"
          >
            {t("nav.admin")}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="mx-auto max-w-3xl px-4 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>{t("entry.footerNote")}</span>
        <Link
          href="/admin"
          className="hover:text-primary underline underline-offset-2"
          data-testid="link-admin"
        >
          {t("nav.admin")}
        </Link>
      </div>
    </footer>
  );
}

export function Hero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <section
      className="bg-cover bg-center text-white px-4 pt-10 pb-24 sm:pt-14 sm:pb-28"
      style={{
        backgroundImage: image
          ? `linear-gradient(100deg, rgba(17,57,146,.93), rgba(51,101,184,.80), rgba(120,155,207,.55)), url(${image})`
          : "linear-gradient(100deg, rgba(17,57,146,.96), rgba(51,101,184,.9))",
      }}
      data-testid="section-hero"
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-white/90">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-md text-sm text-white/90 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </section>
  );
}

export function PageShell({
  children,
  hero,
}: {
  children: ReactNode;
  hero?: ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <NoticeBar />
      <Header />
      <main className="flex-1 flex flex-col">
        {hero}
        <div
          className={
            hero
              ? "mx-auto w-full max-w-3xl px-4 -mt-14 sm:-mt-16 pb-16 flex-1"
              : "mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 flex-1"
          }
        >
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function StepBar({
  step,
  total,
  labels,
}: {
  step: number;
  total: number;
  labels?: string[];
}) {
  return (
    <div
      className="mb-6 rounded-2xl border border-card-border bg-white shadow-sm px-3 py-4 sm:px-6 flex items-center justify-between gap-2"
      data-testid="stepbar"
    >
      {Array.from({ length: total }).map((_, i) => {
        const state = i < step ? "done" : i === step ? "active" : "upcoming";
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={`h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-full grid place-items-center text-[11px] sm:text-xs font-bold border transition-colors ${
                  state === "upcoming"
                    ? "border-[hsl(221,28%,78%)] text-muted-foreground bg-white"
                    : "border-primary bg-primary text-primary-foreground"
                }`}
              >
                {state === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {labels?.[i] && (
                <span
                  className={`hidden sm:inline text-xs font-semibold ${
                    state === "upcoming" ? "text-muted-foreground" : "text-primary"
                  }`}
                >
                  {labels[i]}
                </span>
              )}
            </div>
            {i < total - 1 && (
              <div
                className={`h-px flex-1 mx-2 sm:mx-3 ${
                  i < step ? "bg-primary" : "bg-[hsl(221,28%,86%)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
