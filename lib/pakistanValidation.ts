/**
 * Pakistan Identity & Contact Number Validation Utility
 *
 * Rules:
 * - CNIC: 13 digits (Format: XXXXX-XXXXXXX-X, Example: 35202-1234567-1)
 * - Mobile Phone (Local): 11 digits including leading zero (Format: 03XX-XXXXXXX, Example: 0300-1234567)
 * - Mobile Phone (International): 12 digits including country code 92
 *   - Without +: 12 digits (Example: 923001234567 or 92 300 1234567)
 *   - With +: Format +92 3XX XXXXXXX (Example: +92 300 1234567)
 */

export const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;
export const CNIC_RAW_REGEX = /^\d{13}$/;

// Local mobile: 11 digits (starts with 03)
export const LOCAL_MOBILE_REGEX = /^03\d{2}-?\d{7}$/;

// International mobile: 12 digits without + (starts with 923) or with + (starts with +92 3 or +923)
export const INTL_MOBILE_NO_PLUS_REGEX = /^923\d{2}[-\s]?\d{7}$/;
export const INTL_MOBILE_PLUS_REGEX = /^\+92[-\s]?3\d{2}[-\s]?\d{7}$/;

// Combined Pakistan Phone Regex
export const PAKISTAN_PHONE_REGEX = /^(\+92[-\s]?|92[-\s]?|0)3\d{2}[-\s]?\d{7}$/;

// Standard medical test statuses
export const TEST_RESULT_OPTIONS = ["Positive", "Negative", "Not tested"] as const;
export type TestResultStatus = (typeof TEST_RESULT_OPTIONS)[number];

/**
 * Strips all non-digit characters from a string
 */
export function extractDigits(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value).replace(/\D/g, "");
}

/**
 * Automatically formats a CNIC string into XXXXX-XXXXXXX-X as the user types
 */
export function formatCNIC(value: string | number | null | undefined): string {
  const digits = extractDigits(value).slice(0, 13);
  if (digits.length <= 5) {
    return digits;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

/**
 * Validates a CNIC string (expects 13 digits)
 */
export function validateCNIC(value: string | null | undefined, required = false): {
  isValid: boolean;
  formatted: string;
  digits: string;
  error?: string;
} {
  const raw = (value ?? "").trim();
  const digits = extractDigits(raw);

  if (!raw) {
    return {
      isValid: !required,
      formatted: "",
      digits: "",
      error: required ? "CNIC is required (13 digits: XXXXX-XXXXXXX-X)" : undefined,
    };
  }

  if (digits.length !== 13) {
    return {
      isValid: false,
      formatted: formatCNIC(raw),
      digits,
      error: `CNIC must contain exactly 13 digits (found ${digits.length}). Format: XXXXX-XXXXXXX-X (e.g. 35202-1234567-1)`,
    };
  }

  const formatted = formatCNIC(digits);
  return {
    isValid: true,
    formatted,
    digits,
  };
}

/**
 * Automatically formats Pakistani mobile numbers
 * - Local (03XX): 0300-1234567 (11 digits)
 * - International with +: +92 300 1234567 (12 digits)
 * - International without +: 92 300 1234567 (12 digits)
 */
export function formatPakistanPhone(value: string | number | null | undefined): string {
  if (!value) return "";
  const raw = String(value).trim();
  const hasPlus = raw.startsWith("+");
  const digits = extractDigits(raw);

  // If starts with +92 or 92 (International format: 12 digits)
  if (hasPlus || digits.startsWith("92")) {
    const intlDigits = digits.startsWith("92") ? digits.slice(0, 12) : ("92" + digits).slice(0, 12);
    const prefix = hasPlus ? "+92 " : "92 ";
    const subscriber = intlDigits.slice(2);
    if (subscriber.length <= 3) {
      return prefix + subscriber;
    }
    return `${prefix}${subscriber.slice(0, 3)} ${subscriber.slice(3, 10)}`;
  }

  // If starts with 03 (Local format: 11 digits)
  if (digits.startsWith("0")) {
    const localDigits = digits.slice(0, 11);
    if (localDigits.length <= 4) {
      return localDigits;
    }
    return `${localDigits.slice(0, 4)}-${localDigits.slice(4, 11)}`;
  }

  // If starts with 3 (without leading 0, 10 digits) -> format as local with leading 0
  if (digits.startsWith("3")) {
    const withZero = "0" + digits.slice(0, 10);
    if (withZero.length <= 4) return withZero;
    return `${withZero.slice(0, 4)}-${withZero.slice(4, 11)}`;
  }

  return raw;
}

/**
 * Validates a Pakistani mobile number
 * - Local: 11 digits starting with 03 (e.g. 0300-1234567)
 * - International without +: 12 digits starting with 923 (e.g. 923001234567)
 * - International with +: 12 digits starting with +92 3 (e.g. +92 300 1234567)
 */
export function validatePakistanPhone(value: string | null | undefined, required = false): {
  isValid: boolean;
  type?: "local" | "international";
  digitsCount: number;
  formatted: string;
  error?: string;
} {
  const raw = (value ?? "").trim();
  if (!raw) {
    return {
      isValid: !required,
      digitsCount: 0,
      formatted: "",
      error: required ? "Mobile phone number is required" : undefined,
    };
  }

  const digits = extractDigits(raw);
  const hasPlus = raw.startsWith("+");

  // 1. International with '+' (+92 3XX XXXXXXX) -> 12 digits (excluding +)
  if (hasPlus) {
    if (digits.startsWith("923") && digits.length === 12) {
      return {
        isValid: true,
        type: "international",
        digitsCount: 12,
        formatted: formatPakistanPhone(raw),
      };
    }
    return {
      isValid: false,
      type: "international",
      digitsCount: digits.length,
      formatted: raw,
      error: `International mobile format with '+' requires 12 digits: +92 3XX XXXXXXX (e.g. +92 300 1234567). Found ${digits.length} digits.`,
    };
  }

  // 2. International without '+' (923001234567) -> exactly 12 digits
  if (digits.startsWith("923")) {
    if (digits.length === 12) {
      return {
        isValid: true,
        type: "international",
        digitsCount: 12,
        formatted: formatPakistanPhone(raw),
      };
    }
    return {
      isValid: false,
      type: "international",
      digitsCount: digits.length,
      formatted: raw,
      error: `International mobile without '+' requires 12 digits starting with 923 (e.g. 923001234567). Found ${digits.length} digits.`,
    };
  }

  // 3. Local format (03XX-XXXXXXX) -> exactly 11 digits
  if (digits.startsWith("03")) {
    if (digits.length === 11) {
      return {
        isValid: true,
        type: "local",
        digitsCount: 11,
        formatted: formatPakistanPhone(raw),
      };
    }
    return {
      isValid: false,
      type: "local",
      digitsCount: digits.length,
      formatted: raw,
      error: `Local mobile number requires 11 digits including the leading zero (03XX-XXXXXXX, e.g. 0300-1234567). Found ${digits.length} digits.`,
    };
  }

  // 4. If user entered 10 digits starting with 3 (e.g. 3001234567)
  if (digits.startsWith("3") && digits.length === 10) {
    return {
      isValid: true,
      type: "local",
      digitsCount: 11,
      formatted: formatPakistanPhone("0" + digits),
    };
  }

  return {
    isValid: false,
    digitsCount: digits.length,
    formatted: raw,
    error: "Invalid Pakistan mobile number. Must be 11 digits local (03XX-XXXXXXX) or 12 digits international (+92 3XX XXXXXXX / 923XXXXXXXXX).",
  };
}

/**
 * Normalizes test results (Positive / Negative / Not tested)
 */
export function normalizeTestResult(value: any): TestResultStatus {
  if (!value) return "Not tested";
  const str = String(value).trim().toLowerCase();
  if (str === "positive" || str === "pos" || str === "yes" || str === "+") {
    return "Positive";
  }
  if (str === "negative" || str === "neg" || str === "no" || str === "-") {
    return "Negative";
  }
  return "Not tested";
}

