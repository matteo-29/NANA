import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Booking, Guest } from "@shared/schema";
import { getTicketDict, type TicketLang } from "@shared/ticket-i18n";

// Resolve this module's directory in a way that works both in dev (tsx runs
// this as true ESM, so `import.meta.url` is defined and there is no native
// `__dirname`) and in the production build (esbuild bundles the server to a
// single CJS file, where `import.meta` is stripped to an empty object but the
// native CJS `__dirname` is available). Referencing the bare `__dirname`
// identifier only evaluates inside the catch branch, so it never throws a
// ReferenceError under ESM.
function resolveModuleDir(): string {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return __dirname;
  }
}
const moduleDir = resolveModuleDir();

let fontsRegistered = false;
function registerFonts() {
  if (fontsRegistered) return;
  // Disable automatic hyphenation: the default engine inserts stray
  // hyphens inside unbroken CJK runs (no spaces), which looks broken.
  Font.registerHyphenationCallback((word) => [word]);
  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: path.join(moduleDir, "fonts/NotoSansJP-Regular.ttf"), fontWeight: 400 },
      { src: path.join(moduleDir, "fonts/NotoSansJP-Bold.ttf"), fontWeight: 700 },
    ],
  });
  fontsRegistered = true;
}

const NAVY = "#1E3A78";
const NAVY_DARK = "#132754";
const CRIMSON = "#B5182A";
const CREAM = "#F7F4EC";
const HAIRLINE = "#D8D3C4";
const MUTED = "#6B6558";
const INK = "#221F1A";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    color: INK,
    backgroundColor: "#FFFFFF",
    paddingTop: 0,
    paddingBottom: 32,
  },
  headerBar: {
    backgroundColor: NAVY,
    paddingHorizontal: 36,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  allianceTag: {
    fontSize: 7,
    color: "#C9D3EA",
    letterSpacing: 1,
    marginTop: 2,
  },
  docTitleBlock: { alignItems: "flex-end" },
  docTitle: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  docSubtitle: {
    fontSize: 8,
    color: "#C9D3EA",
    marginTop: 2,
  },
  crimsonStrip: {
    height: 4,
    backgroundColor: CRIMSON,
  },
  body: {
    paddingHorizontal: 36,
    paddingTop: 20,
  },
  infoGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 4,
  },
  infoCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: HAIRLINE,
  },
  infoCellLast: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  infoLabel: {
    fontSize: 6.5,
    color: MUTED,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 10.5,
    fontWeight: 700,
    color: INK,
  },
  infoValueSmall: {
    fontSize: 8.5,
    fontWeight: 700,
    color: INK,
  },
  sectionHeading: {
    fontSize: 8.5,
    fontWeight: 700,
    color: NAVY,
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 8,
  },
  segmentCard: {
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  segmentHeader: {
    backgroundColor: CREAM,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  segmentHeaderText: {
    fontSize: 7.5,
    fontWeight: 700,
    color: NAVY_DARK,
    letterSpacing: 0.8,
  },
  segmentFlight: {
    fontSize: 7.5,
    fontWeight: 700,
    color: CRIMSON,
    letterSpacing: 0.5,
  },
  segmentBody: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  segmentCol: { flex: 1 },
  segmentColRight: { flex: 1, alignItems: "flex-end" },
  segmentCityLabel: {
    fontSize: 6.5,
    color: MUTED,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  segmentCity: {
    fontSize: 13,
    fontWeight: 700,
    color: INK,
  },
  segmentVenue: {
    fontSize: 8,
    color: MUTED,
    marginTop: 1,
  },
  segmentTime: {
    fontSize: 8.5,
    color: NAVY_DARK,
    fontWeight: 700,
    marginTop: 4,
  },
  planeCol: {
    width: 60,
    alignItems: "center",
  },
  planeLine: {
    width: "100%",
    height: 1,
    backgroundColor: HAIRLINE,
    marginTop: 4,
  },
  segmentFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: "#FBFAF6",
  },
  segmentFooterItem: { flex: 1 },
  segmentFooterLabel: {
    fontSize: 6,
    color: MUTED,
    letterSpacing: 0.5,
  },
  segmentFooterValue: {
    fontSize: 8,
    fontWeight: 700,
    color: INK,
    marginTop: 1,
  },
  ssrBox: {
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 4,
    padding: 12,
    marginTop: 4,
    backgroundColor: CREAM,
  },
  ssrTitle: {
    fontSize: 7.5,
    fontWeight: 700,
    color: NAVY_DARK,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  ssrRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  ssrLabel: {
    width: 90,
    fontSize: 8,
    color: MUTED,
  },
  ssrValue: {
    flex: 1,
    fontSize: 8,
    color: INK,
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderTopColor: NAVY,
    paddingHorizontal: 36,
    paddingTop: 8,
    paddingBottom: 10,
  },
  footerNotice: {
    fontSize: 6.5,
    color: MUTED,
    lineHeight: 1.4,
  },
  footerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  footerMetaText: {
    fontSize: 6,
    color: MUTED,
  },
});

// Split into sentences and render each on its own line. This sidesteps a
// @react-pdf/renderer line-wrapping quirk where a spaceless CJK sentence
// that needs to wrap can get a stray Latin-style hyphen inserted at the
// break point. Splitting on sentence boundaries keeps each fragment short
// enough to fit on one line, so no automatic wrap (and no hyphen) happens.
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。.!?])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ticketNumberFor(guestId: string): string {
  // Deterministic 13-digit pseudo ticket number in the classic
  // airline-ticket style, derived from the guest UUID.
  const digits = guestId.replace(/[^0-9]/g, "") || "0";
  const seed = (digits + "1717202700329").slice(0, 13).padEnd(13, "0");
  return `${seed.slice(0, 3)}-${seed.slice(3, 13)}`;
}

function honorific(gender: string | null, lang: TicketLang): string {
  if (lang === "ja") return "";
  if (gender === "male") return " MR";
  if (gender === "female") return " MS";
  return "";
}

function formatDateOfIssue(lang: TicketLang): string {
  const now = new Date();
  if (lang === "ja") {
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  }
  const day = String(now.getDate()).padStart(2, "0");
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  return `${day} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function GuestTicketPage({
  booking,
  guest,
  lang,
}: {
  booking: Booking;
  guest: Guest;
  lang: TicketLang;
}) {
  const d = getTicketDict(lang);
  const name = `${guest.last_name}/${guest.first_name}${honorific(guest.gender, lang)}`;
  const notableMeal = Boolean(guest.meal_choice && guest.meal_choice !== "standard" && guest.meal_choice !== "none");
  const hasSsr = Boolean(notableMeal || guest.allergies || guest.special_assistance?.length);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.brand}>{d.brand}</Text>
          <Text style={styles.allianceTag}>{d.allianceTag}</Text>
        </View>
        <View style={styles.docTitleBlock}>
          <Text style={styles.docTitle}>{d.documentTitle}</Text>
          <Text style={styles.docSubtitle}>{d.documentSubtitle}</Text>
        </View>
      </View>
      <View style={styles.crimsonStrip} />

      <View style={styles.body}>
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>{d.passengerName}</Text>
            <Text style={styles.infoValue}>{name}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>{d.reservationCode}</Text>
            <Text style={styles.infoValue}>{booking.booking_code}</Text>
          </View>
          <View style={styles.infoCellLast}>
            <Text style={styles.infoLabel}>{d.ticketNumber}</Text>
            <Text style={styles.infoValueSmall}>{ticketNumberFor(guest.id)}</Text>
          </View>
        </View>

        <View style={[styles.infoGrid, { marginTop: 6 }]}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>{d.dateOfIssue}</Text>
            <Text style={styles.infoValueSmall}>{formatDateOfIssue(lang)}</Text>
          </View>
          <View style={styles.infoCellLast}>
            <Text style={styles.infoLabel}>{d.issuingOffice}</Text>
            <Text style={styles.infoValueSmall}>{d.issuingOfficeValue}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>{d.itinerary}</Text>

        {/* Ceremony segment */}
        <View style={styles.segmentCard}>
          <View style={styles.segmentHeader}>
            <Text style={styles.segmentHeaderText}>{d.ceremonySegment}</Text>
            <Text style={styles.segmentFlight}>NM 0329</Text>
          </View>
          <View style={styles.segmentBody}>
            <View style={styles.segmentCol}>
              <Text style={styles.segmentCityLabel}>{d.departure}</Text>
              <Text style={styles.segmentCity}>Hiroshima</Text>
              <Text style={styles.segmentVenue}>Grand Prince Hotel</Text>
              <Text style={styles.segmentTime}>13:00</Text>
            </View>
            <View style={styles.planeCol}>
              <Text style={{ fontSize: 10, color: NAVY }}>{"\u2192"}</Text>
              <View style={styles.planeLine} />
            </View>
            <View style={styles.segmentColRight}>
              <Text style={styles.segmentCityLabel}>{d.arrival}</Text>
              <Text style={styles.segmentCity}>Forever Together</Text>
              <Text style={styles.segmentVenue}>Grand Prince Hotel</Text>
              <Text style={styles.segmentTime}>16:30</Text>
            </View>
          </View>
          <View style={styles.segmentFooter}>
            <View style={styles.segmentFooterItem}>
              <Text style={styles.segmentFooterLabel}>{d.date}</Text>
              <Text style={styles.segmentFooterValue}>29 MAR 2027</Text>
            </View>
            <View style={styles.segmentFooterItem}>
              <Text style={styles.segmentFooterLabel}>{d.gate}</Text>
              <Text style={styles.segmentFooterValue}>12:00</Text>
            </View>
            <View style={styles.segmentFooterItem}>
              <Text style={styles.segmentFooterLabel}>{d.classLabel}</Text>
              <Text style={styles.segmentFooterValue}>{d.classValue}</Text>
            </View>
            <View style={styles.segmentFooterItem}>
              <Text style={styles.segmentFooterLabel}>{d.seat}</Text>
              <Text style={styles.segmentFooterValue}>{d.seatValue}</Text>
            </View>
            <View style={styles.segmentFooterItem}>
              <Text style={styles.segmentFooterLabel}>{d.status}</Text>
              <Text style={[styles.segmentFooterValue, { color: CRIMSON }]}>
                {d.statusConfirmed}
              </Text>
            </View>
          </View>
        </View>

        {/* Afterparty segment, only if opted in */}
        {guest.afterparty_optin && (
          <View style={styles.segmentCard}>
            <View style={styles.segmentHeader}>
              <Text style={styles.segmentHeaderText}>{d.afterpartySegment}</Text>
              <Text style={styles.segmentFlight}>NM 0329A</Text>
            </View>
            <View style={styles.segmentBody}>
              <View style={styles.segmentCol}>
                <Text style={styles.segmentCityLabel}>{d.departure}</Text>
                <Text style={styles.segmentCity}>Grand Prince Hotel</Text>
                <Text style={styles.segmentVenue}>Hiroshima</Text>
                <Text style={styles.segmentTime}>18:00</Text>
              </View>
              <View style={styles.planeCol}>
                <Text style={{ fontSize: 10, color: NAVY }}>{"\u2192"}</Text>
                <View style={styles.planeLine} />
              </View>
              <View style={styles.segmentColRight}>
                <Text style={styles.segmentCityLabel}>{d.arrival}</Text>
                <Text style={styles.segmentCity}>Top of Hiroshima Lounge</Text>
                <Text style={styles.segmentVenue}>Grand Prince Hotel Hiroshima</Text>
                <Text style={styles.segmentTime}>20:00</Text>
              </View>
            </View>
            <View style={styles.segmentFooter}>
              <View style={styles.segmentFooterItem}>
                <Text style={styles.segmentFooterLabel}>{d.date}</Text>
                <Text style={styles.segmentFooterValue}>29 MAR 2027</Text>
              </View>
              <View style={styles.segmentFooterItem}>
                <Text style={styles.segmentFooterLabel}>{d.classLabel}</Text>
                <Text style={styles.segmentFooterValue}>{d.classValue}</Text>
              </View>
              <View style={styles.segmentFooterItem}>
                <Text style={styles.segmentFooterLabel}>{d.seat}</Text>
                <Text style={styles.segmentFooterValue}>{d.seatValue}</Text>
              </View>
              <View style={styles.segmentFooterItem} />
              <View style={styles.segmentFooterItem}>
                <Text style={styles.segmentFooterLabel}>{d.status}</Text>
                <Text style={[styles.segmentFooterValue, { color: CRIMSON }]}>
                  {d.statusConfirmed}
                </Text>
              </View>
            </View>
          </View>
        )}

        {hasSsr && (
          <View style={styles.ssrBox}>
            <Text style={styles.ssrTitle}>{d.ssrTitle}</Text>
            {notableMeal && (
              <View style={styles.ssrRow}>
                <Text style={styles.ssrLabel}>{d.meal}</Text>
                <Text style={styles.ssrValue}>
                  {d.mealLabels[guest.meal_choice as string] ?? guest.meal_choice}
                </Text>
              </View>
            )}
            {Boolean(guest.allergies) && (
              <View style={styles.ssrRow}>
                <Text style={styles.ssrLabel}>{d.allergies}</Text>
                <Text style={styles.ssrValue}>{guest.allergies}</Text>
              </View>
            )}
            {guest.special_assistance && guest.special_assistance.length > 0 && (
              <View style={styles.ssrRow}>
                <Text style={styles.ssrLabel}>{d.assistance}</Text>
                <Text style={styles.ssrValue}>
                  {guest.special_assistance
                    .map((a) => d.assistanceLabels[a] ?? a)
                    .join(", ")}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {lang === "ja" ? (
          splitSentences(d.footerNotice).map((sentence, i) => (
            <Text key={i} style={styles.footerNotice}>
              {sentence}
            </Text>
          ))
        ) : (
          <Text style={styles.footerNotice}>{d.footerNotice}</Text>
        )}
        <View style={styles.footerMeta}>
          <Text style={styles.footerMetaText}>{d.issuingOfficeValue}</Text>
          <Text style={styles.footerMetaText}>
            {d.printedOn}: {formatDateOfIssue(lang)}
          </Text>
        </View>
      </View>
    </Page>
  );
}

export async function renderTicketPdf(
  booking: Booking,
  guests: Guest[],
  lang: TicketLang
): Promise<Buffer> {
  registerFonts();
  const attending = guests.filter((g) => g.selected);
  const doc = (
    <Document title={`${booking.booking_code} — ${getTicketDict(lang).brand} E-Ticket`}>
      {attending.map((guest) => (
        <GuestTicketPage key={guest.id} booking={booking} guest={guest} lang={lang} />
      ))}
    </Document>
  );
  return renderToBuffer(doc);
}
