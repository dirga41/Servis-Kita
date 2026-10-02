import "server-only";

import { randomInt } from "node:crypto";

import { BOOKING_CODE_ALPHABET, BOOKING_CODE_LENGTH } from "@/lib/constants";

/** Kode booking acak dari CSPRNG (crypto.randomInt), tidak berurutan dan tidak bisa ditebak. */
export function generateBookingCode(): string {
  let code = "";
  for (let index = 0; index < BOOKING_CODE_LENGTH; index += 1) {
    code += BOOKING_CODE_ALPHABET.charAt(randomInt(BOOKING_CODE_ALPHABET.length));
  }
  return code;
}

/** Merapikan kode dari URL: huruf besar, tanpa spasi atau tanda hubung. */
export function normalizeBookingCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isBookingCodeFormat(code: string): boolean {
  if (code.length !== BOOKING_CODE_LENGTH) return false;
  for (const char of code) {
    if (!BOOKING_CODE_ALPHABET.includes(char)) return false;
  }
  return true;
}
