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
  afterpartyLeaveNote: string;

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

  // ---- Hotel voucher (Phase 2) ----
  hotelVoucherTitle: string;
  hotelVoucherSubtitle: string;
  hotelName: string;
  hotelAddress: string;
  voucherNumber: string;
  checkIn: string;
  checkOut: string;
  nights: string;
  roomSegment: string;
  roomTypeLabel: string;
  occupancyLabel: string;
  mealPlanLabel: string;
  ratePerNight: string;
  totalPrice: string;
  roomTypeLabels: Record<string, string>;
  mealPlanLabels: Record<string, string>;
  adultsShort: string;
  childrenShort: string;
  hotelVoucherNote: string;

  // ---- Bus ticket (Phase 2) ----
  busTicketTitle: string;
  busTicketSubtitle: string;
  busSegment: string;
  boardingPoint: string;
  destinationPoint: string;
  boardingTime: string;
  departureTime: string;
  arrivalTime: string;
  busTicketNote: string;
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
  gate: "GATE",
  status: "STATUS",
  statusConfirmed: "OK — BESTÄTIGT",
  classLabel: "KLASSE",
  classValue: "FIRST FLEX",
  seat: "SITZPLATZ",
  seatValue: "Freie Platzwahl",
  afterpartyLeaveNote: "Fühlt euch nicht verpflichtet, bis zum Ende zu bleiben — geht ganz nach eurem eigenen Gefühl.",

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
    child: "Kindermenü",
  },
  assistanceLabels: {
    wheelchair: "Rollstuhl",
    visual: "Sehbehinderung",
    hearing: "Hörbehinderung",
    walking: "Gehhilfe",
    other: "Sonstiges",
  },

  hotelVoucherTitle: "Hotel-Voucher",
  hotelVoucherSubtitle: "宿泊確認書",
  hotelName: "Grand Prince Hotel Hiroshima",
  hotelAddress: "23-1 Motoujina-cho, Naka-ku, Hiroshima, 734-8543 Japan",
  voucherNumber: "VOUCHER-NR.",
  checkIn: "ANREISE",
  checkOut: "ABREISE",
  nights: "NÄCHTE",
  roomSegment: "ZIMMER",
  roomTypeLabel: "Zimmertyp",
  occupancyLabel: "Belegung",
  mealPlanLabel: "Verpflegung",
  ratePerNight: "Ø PREIS/NACHT",
  totalPrice: "GESAMTPREIS",
  roomTypeLabels: {
    twin: "Twin Room",
    family: "Luxury Family Room",
  },
  mealPlanLabels: {
    room_only: "Nur Zimmer",
    breakfast: "Mit Frühstück",
    breakfast_onsen: "Frühstück + Onsen",
  },
  adultsShort: "Erw.",
  childrenShort: "Kinder",
  hotelVoucherNote:
    "Dieser Voucher bestätigt Ihre Zimmerreservierung im Rahmen des Hochzeitsblocks von Nana & Matteo. Bitte legen Sie ihn (digital oder ausgedruckt) beim Check-in im Grand Prince Hotel Hiroshima vor. Bei Fragen wenden Sie sich direkt an Nana oder Matteo.",

  busTicketTitle: "Bus-Ticket — Shuttle",
  busTicketSubtitle: "シャトルバス乗車券",
  busSegment: "SHUTTLE-TRANSFER",
  boardingPoint: "EINSTIEG",
  destinationPoint: "ZIEL",
  boardingTime: "BOARDING",
  departureTime: "ABFAHRT",
  arrivalTime: "ANKUNFT",
  busTicketNote:
    "Dieses Ticket berechtigt zur Fahrt mit dem Hochzeits-Shuttlebus zwischen Hiroshima Station und dem Grand Prince Hotel. Bitte seien Sie pünktlich am Einstiegspunkt. Ein Rückshuttle steht am Abend ebenfalls zur Verfügung.",
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
  gate: "GATE",
  status: "STATUS",
  statusConfirmed: "OK — CONFIRMED",
  classLabel: "CLASS",
  classValue: "FIRST FLEX",
  seat: "SEAT",
  seatValue: "Open seating",
  afterpartyLeaveNote: "Feel free to leave anytime, whenever feels right for you.",

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
    child: "Children's meal",
  },
  assistanceLabels: {
    wheelchair: "Wheelchair",
    visual: "Visual impairment",
    hearing: "Hearing impairment",
    walking: "Walking assistance",
    other: "Other",
  },

  hotelVoucherTitle: "Hotel Voucher",
  hotelVoucherSubtitle: "宿泊確認書",
  hotelName: "Grand Prince Hotel Hiroshima",
  hotelAddress: "23-1 Motoujina-cho, Naka-ku, Hiroshima, 734-8543 Japan",
  voucherNumber: "VOUCHER NO.",
  checkIn: "CHECK-IN",
  checkOut: "CHECK-OUT",
  nights: "NIGHTS",
  roomSegment: "ROOM",
  roomTypeLabel: "Room type",
  occupancyLabel: "Occupancy",
  mealPlanLabel: "Meal plan",
  ratePerNight: "AVG. RATE/NIGHT",
  totalPrice: "TOTAL PRICE",
  roomTypeLabels: {
    twin: "Twin Room",
    family: "Luxury Family Room",
  },
  mealPlanLabels: {
    room_only: "Room only",
    breakfast: "With breakfast",
    breakfast_onsen: "Breakfast + onsen",
  },
  adultsShort: "Adults",
  childrenShort: "Children",
  hotelVoucherNote:
    "This voucher confirms your room reservation within the wedding block of Nana & Matteo. Please present it (digital or printed) at check-in at the Grand Prince Hotel Hiroshima. For any questions, please contact Nana or Matteo directly.",

  busTicketTitle: "Bus Ticket — Shuttle",
  busTicketSubtitle: "シャトルバス乗車券",
  busSegment: "SHUTTLE TRANSFER",
  boardingPoint: "BOARDING",
  destinationPoint: "DESTINATION",
  boardingTime: "BOARDING",
  departureTime: "DEPARTURE",
  arrivalTime: "ARRIVAL",
  busTicketNote:
    "This ticket entitles you to travel on the wedding shuttle bus between Hiroshima Station and the Grand Prince Hotel. Please arrive at the boarding point on time. A return shuttle is also available in the evening.",
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
  gate: "ゲート",
  status: "ステータス",
  statusConfirmed: "OK — 確定済み",
  classLabel: "クラス",
  classValue: "ファーストフレックス",
  seat: "席",
  seatValue: "自由席",
  afterpartyLeaveNote: "無理をせず、ご自身のタイミングでご退席いただいて構いません。",

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
    child: "キッズメニュー",
  },
  assistanceLabels: {
    wheelchair: "車椅子",
    visual: "視覚障がい",
    hearing: "聴覚障がい",
    walking: "歩行補助",
    other: "その他",
  },

  hotelVoucherTitle: "宿泊確認書",
  hotelVoucherSubtitle: "Hotel Voucher",
  hotelName: "グランドプリンスホテル広島",
  hotelAddress: "日本、〒734-8543 広島市中区元宇品町23-1",
  voucherNumber: "バウチャー番号",
  checkIn: "チェックイン",
  checkOut: "チェックアウト",
  nights: "宿泊数",
  roomSegment: "ルーム",
  roomTypeLabel: "部屋タイプ",
  occupancyLabel: "定員",
  mealPlanLabel: "食事プラン",
  ratePerNight: "1泊あたり平均価格",
  totalPrice: "合計金額",
  roomTypeLabels: {
    twin: "ツインルーム",
    family: "ラグジュアリーファミリールーム",
  },
  mealPlanLabels: {
    room_only: "食事なし",
    breakfast: "朝食付き",
    breakfast_onsen: "朝食+温泉付き",
  },
  adultsShort: "大人",
  childrenShort: "小人",
  hotelVoucherNote:
    "このバウチャーは、ナナ＆マテオの結婚式ブロックでご予約いただいた部屋を確認するものです。グランドプリンスホテル広島のチェックイン時に、デジタルまたは印刷してご提示ください。ご質問はナナまたはマテオへ直接お問い合わせください。",

  busTicketTitle: "バス乗車券 ～ シャトルバス",
  busTicketSubtitle: "Bus Ticket — Shuttle",
  busSegment: "シャトルバス送迎",
  boardingPoint: "乗車地点",
  destinationPoint: "行き先",
  boardingTime: "ボーディング",
  departureTime: "発時刻",
  arrivalTime: "到着時刻",
  busTicketNote:
    "このチケットで、広島駅とグランドプリンスホテル広島を結ぶ結婚式シャトルバスにご乗車いただけます。乗車地点には時間に余裕をもってお集まりください。夜間の帰りのシャトルバスもご用意しております。",
};

export const ticketI18n: Record<TicketLang, TicketDict> = { de, en, ja };

export function getTicketDict(lang: string): TicketDict {
  return ticketI18n[(lang as TicketLang) in ticketI18n ? (lang as TicketLang) : "en"];
}
