// ISO 3166-1 alpha-2 country codes. Display names are generated client-side
// via Intl.DisplayNames so they show in the user's active language (de/en/ja).
export const COUNTRY_CODES = [
  "JP", "DE", "US", "GB", "FR", "IT", "ES", "PT", "NL", "BE", "LU", "CH", "AT",
  "IE", "DK", "SE", "NO", "FI", "IS", "PL", "CZ", "SK", "HU", "RO", "BG", "GR",
  "HR", "SI", "EE", "LV", "LT", "MT", "CY", "UA", "MD", "RS", "ME", "MK", "AL",
  "BA", "XK", "RU", "BY", "TR", "IL", "AE", "SA", "QA", "KW", "BH", "OM", "JO",
  "LB", "EG", "MA", "TN", "DZ", "ZA", "NG", "KE", "GH", "ET", "TZ", "UG", "CA",
  "MX", "BR", "AR", "CL", "CO", "PE", "VE", "UY", "PY", "BO", "EC", "CR", "PA",
  "GT", "DO", "CU", "JM", "TT", "CN", "HK", "TW", "MO", "KR", "KP", "MN", "IN",
  "PK", "BD", "LK", "NP", "TH", "VN", "PH", "ID", "MY", "SG", "MM", "KH", "LA",
  "BN", "AU", "NZ", "FJ", "PG", "KZ", "UZ", "TM", "TJ", "KG", "AF", "IQ", "IR",
  "SY", "YE", "GE", "AM", "AZ", "IS", "IE",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

// De-duplicate while preserving order (in case of accidental repeats above).
export const COUNTRIES = Array.from(new Set(COUNTRY_CODES));

// Resolve a country code to its localized display name. Falls back to the
// raw code if Intl.DisplayNames is unavailable or the code is unrecognized.
export function getCountryName(code: string, lang: string): string {
  try {
    const dn = new Intl.DisplayNames([lang], { type: "region" });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}
