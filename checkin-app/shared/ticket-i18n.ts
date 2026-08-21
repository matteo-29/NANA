// Shared copy for the PDF e-ticket and the delivery e-mail. Used only on the
// server (ticket-pdf.tsx, ticket-email.ts) but lives in shared/ so it can be
// unit-tested / imported the same way as schema.ts.

export type TicketLang = "de" | "en" | "ja";

export interface TicketDict {
  // ---- Brand ----
  brand: string; // "NANA"
  allianceTag: string; // "A KRATZ ALLIANCE MEMBER"
  documentTitle: string; // "E-Ticket Itinerary/Receipt"
  documentSubtitle: string; // small JP-style caption, flavor only

  // ---- Passenger / booking block ----
  passengerName: string;
  reservationCode: string;
  ticketNumber: string;
  dateOfIssue: string;
  issuingOffice: string;
  issuingOfficeValue: string;

  // ---- Itinerary ----
  itinerary: string;
  ceremonySegment: string;
  afterpartySegment: string;
  departure: string;
  arrival: string;
  flightNo: string;
  date: string;
  gate: string;
  status: string;
  statusConfirmed: string;
  classLabel: string;
  classValue: string;
  seat: string;
  seatValue: string;

  // ---- Special service request ----
  ssrTitle: string;
  meal: string;
  allergies: string;
  assistance: string;
  none: string;

  // ---- Footer ----
  footerNotice: string;
  printedOn: string;

  // ---- Email ----
  emailSubject: string;
  emailPreheader: string;
  emailGreeting: (name: string) => string;
  emailIntro: string;
  emailBookingLabel: string;
  emailItineraryHeading: string;
  emailAttachmentNote: string;
  emailWhatsNextHeading: string;
  emailWhatsNextSteps: string[];
  emailClosing: string;
  emailSignature: string;
  emailFooterNote: string;

  // ---- SSR value labels (map raw codes stored in the DB to display text) ----
  mealLabels: Record<string, string>;
  assistanceLabels: Record<string, string>;
}

const de: TicketDict = {
  brand: "NANA",
  allianceTag: "EIN KRATZ ALLIANCE MITGLIED",
  documentTitle: "E-Ticket – Reisebeleg",
  documentSubtitle: "eチケットお客様控",

  passengerName: "NAME DES GASTES",
  reservationCode: "BUCHUNGSCODE",
  ticketNumber: "TICKETNUMMER",
  dateOfIssue: "AUSSTELLUNGSDATUM",
  issuingOffice: "AUSSTELLENDES BÜRO",
  issuingOfficeValue: "NANA & MATTEO WEDDING — KRATZ ALLIANCE",

  itinerary: "REISEVERLAUF",
  ceremonySegment: "TRAUZEREMONIE",
  afterpartySegment: "AFTERPARTY",
  departure: "ABFLUG",
  arrival: "ANKUNFT",
  flightNo: "FLUG NR.",
  date: "DATUM",
  gate: "GATE ÖFFNET",
  status: "STATUS",
  statusConfirmed: "OK — BESTÄTIGT",
  classLabel: "KLASSE",
  classValue: "FIRST FLEX",
  seat: "SITZPLATZ",
  seatValue: "Freie Platzwahl",

  ssrTitle: "BESONDERE WÜNSCHE (SSR)",
  meal: "Menü",
  allergies: "Allergien",
  assistance: "Assistenz",
  none: "—",

  footerNotice:
    "Dieses E-Ticket ist Ihre persönliche Einlassbestätigung für die Hochzeit von Nana & Matteo am 29. März 2027 in Hiroshima. Bitte halten Sie es (digital oder ausgedruckt) am Tag der Feier bereit. Bei Fragen wenden Sie sich direkt an Nana oder Matteo.",
  printedOn: "Erstellt am",

  emailSubject: "Euer Ticket zur Hochzeit von Nana & Matteo — Buchung {code}",
  emailPreheader: "Alle Details zu eurem Check-in und euer Ticket im Anhang.",
  emailGreeting: (name: string) => `Liebe/r ${name},`,
  emailIntro:
    "vielen Dank für euren Online-Check-in zur Hochzeit von Nana & Matteo. Im Anhang findet ihr euer persönliches E-Ticket als PDF — bitte bringt es am Hochzeitstag mit, digital auf dem Handy oder ausgedruckt.",
  emailBookingLabel: "Buchungscode",
  emailItineraryHeading: "Euer Reiseverlauf",
  emailAttachmentNote: "Das vollständige Ticket findet ihr als PDF im Anhang dieser E-Mail.",
  emailWhatsNextHeading: "Wie geht es weiter?",
  emailWhatsNextSteps: [
    "Check-in abgeschlossen — eure Angaben sind gespeichert.",
    "Ticket herunterladen oder ausdrucken und am 29. März 2027 mitbringen.",
    "Bei Änderungen einfach erneut mit eurem Buchungscode einloggen.",
    "Am Hochzeitstag: Gate öffnet 12:00 Uhr in Hiroshima — wir freuen uns auf euch!",
  ],
  emailClosing: "Wir freuen uns riesig, diesen Tag mit euch zu feiern!",
  emailSignature: "Von Herzen, Nana & Matteo",
  emailFooterNote:
    "Diese E-Mail wurde automatisch vom Check-in-System der Hochzeit von Nana & Matteo versendet.",

  mealLabels: {
    standard: "Standard",
    vegetarian: "Vegetarisch",
    vegan: "Vegan",
    halal: "Halal",
    kosher: "Koscher",
    gluten_free: "Glutenfrei",
    child: "Kindermenü",
    none: "Keine Angabe",
  },
  assistanceLabels: {
    wheelchair: "Rollstuhl",
    visual: "Sehbehinderung",
    hearing: "Hörbehinderung",
    walking: "Gehhilfe",
    other: "Sonstiges",
  },
};

const en: TicketDict = {
  brand: "NANA",
  allianceTag: "A KRATZ ALLIANCE MEMBER",
  documentTitle: "E-Ticket Itinerary / Receipt",
  documentSubtitle: "eチケットお客様控",

  passengerName: "PASSENGER NAME",
  reservationCode: "RESERVATION CODE",
  ticketNumber: "TICKET NUMBER",
  dateOfIssue: "DATE OF ISSUE",
  issuingOffice: "ISSUING OFFICE",
  issuingOfficeValue: "NANA & MATTEO WEDDING — KRATZ ALLIANCE",

  itinerary: "ITINERARY",
  ceremonySegment: "WEDDING CEREMONY",
  afterpartySegment: "AFTERPARTY",
  departure: "DEPARTURE",
  arrival: "ARRIVAL",
  flightNo: "FLIGHT NO.",
  date: "DATE",
  gate: "GATE OPENS",
  status: "STATUS",
  statusConfirmed: "OK — CONFIRMED",
  classLabel: "CLASS",
  classValue: "FIRST FLEX",
  seat: "SEAT",
  seatValue: "Open seating",

  ssrTitle: "SPECIAL SERVICE REQUEST (SSR)",
  meal: "Meal",
  allergies: "Allergies",
  assistance: "Assistance",
  none: "—",

  footerNotice:
    "This e-ticket is your personal admission confirmation for the wedding of Nana & Matteo on 29 March 2027 in Hiroshima. Please keep it available (digital or printed) on the day of the celebration. For any questions, please contact Nana or Matteo directly.",
  printedOn: "Issued on",

  emailSubject: "Your ticket for Nana & Matteo's wedding — Booking {code}",
  emailPreheader: "All the details for your check-in and your ticket attached.",
  emailGreeting: (name: string) => `Dear ${name},`,
  emailIntro:
    "thank you for completing your online check-in for Nana & Matteo's wedding. Attached you'll find your personal e-ticket as a PDF — please bring it with you on the wedding day, either on your phone or printed.",
  emailBookingLabel: "Booking code",
  emailItineraryHeading: "Your itinerary",
  emailAttachmentNote: "Your complete ticket is attached to this e-mail as a PDF.",
  emailWhatsNextHeading: "What's next?",
  emailWhatsNextSteps: [
    "Check-in complete — your details are saved.",
    "Download or print your ticket and bring it on 29 March 2027.",
    "Need to change something? Just log in again with your booking code.",
    "On the day: gates open 12:00 in Hiroshima — we can't wait to see you!",
  ],
  emailClosing: "We can't wait to celebrate this day with you!",
  emailSignature: "With love, Nana & Matteo",
  emailFooterNote:
    "This e-mail was sent automatically by the check-in system for Nana & Matteo's wedding.",

  mealLabels: {
    standard: "Standard",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    halal: "Halal",
    kosher: "Kosher",
    gluten_free: "Gluten-free",
    child: "Children's meal",
    none: "No preference",
  },
  assistanceLabels: {
    wheelchair: "Wheelchair",
    visual: "Visual impairment",
    hearing: "Hearing impairment",
    walking: "Walking assistance",
    other: "Other",
  },
};

const ja: TicketDict = {
  brand: "NANA",
  allianceTag: "クラッツ・アライアンス・メンバー",
  documentTitle: "eチケットお客様控",
  documentSubtitle: "E-Ticket Itinerary/Receipt",

  passengerName: "ご搭乗者名",
  reservationCode: "予約コード",
  ticketNumber: "チケット番号",
  dateOfIssue: "発行日",
  issuingOffice: "発行事務所",
  issuingOfficeValue: "NANA & MATTEO WEDDING — KRATZ ALLIANCE",

  itinerary: "ご旅程",
  ceremonySegment: "結婚式",
  afterpartySegment: "アフターパーティー",
  departure: "出発",
  arrival: "到着",
  flightNo: "フライト番号",
  date: "日付",
  gate: "ゲートオープン",
  status: "ステータス",
  statusConfirmed: "OK — 確定済み",
  classLabel: "クラス",
  classValue: "ファーストフレックス",
  seat: "席",
  seatValue: "自由席",

  ssrTitle: "特別サービスリクエスト（SSR）",
  meal: "メニュー",
  allergies: "アレルギー",
  assistance: "サポート",
  none: "—",

  footerNotice:
    "本eチケットは、2027年3月29日に広島で行われるナナ＆マテオの結婚式へのご入場確認書です。当日はスマートフォンまたは印刷したものをご用意ください。ご質問はナナまたはマテオへ直接お問い合わせください。",
  printedOn: "発行日",

  emailSubject: "ナナ＆マテオ結婚式のチケット — 予約コード {code}",
  emailPreheader: "チェックインの詳細とチケットを添付しております。",
  emailGreeting: (name: string) => `${name} 様`,
  emailIntro:
    "ナナ＆マテオの結婚式へのオンラインチェックインが完了しました。添付のPDFがあなたの個人チケットです。当日はスマートフォンまたは印刷してお持ちください。",
  emailBookingLabel: "予約コード",
  emailItineraryHeading: "ご旅程",
  emailAttachmentNote: "完全なチケットはこのメールにPDFとして添付されています。",
  emailWhatsNextHeading: "今後の流れ",
  emailWhatsNextSteps: [
    "チェックイン完了 — ご入力内容は保存されました。",
    "チケットをダウンロードまたは印刷し、2027年3月29日にお持ちください。",
    "変更がある場合は、予約コードで再度ログインしてください。",
    "当日：広島にてゲートオープンは12:00です。お会いできるのを楽しみにしています！",
  ],
  emailClosing: "皆さまと一緒にこの日をお祝いできることを、心より楽しみにしています。",
  emailSignature: "ナナ＆マテオより、感謝を込めて",
  emailFooterNote: "このメールはナナ＆マテオの結婚式チェックインシステムより自動送信されています。",

  mealLabels: {
    standard: "スタンダード",
    vegetarian: "ベジタリアン",
    vegan: "ヴィーガン",
    halal: "ハラール",
    kosher: "コーシャ",
    gluten_free: "グルテンフリー",
    child: "キッズメニュー",
    none: "指定なし",
  },
  assistanceLabels: {
    wheelchair: "車椅子",
    visual: "視覚障がい",
    hearing: "聴覚障がい",
    walking: "歩行補助",
    other: "その他",
  },
};

export const ticketI18n: Record<TicketLang, TicketDict> = { de, en, ja };

export function getTicketDict(lang: string): TicketDict {
  return ticketI18n[(lang as TicketLang) in ticketI18n ? (lang as TicketLang) : "en"];
}
