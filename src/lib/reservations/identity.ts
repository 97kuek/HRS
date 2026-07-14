import type { ApiErrorDetail } from "@/lib/api/response";
import { validateName, validateReservationNumber } from "@/lib/validation";

export type ReservationIdentity = {
  reservationNumber: string;
  familyName: string;
  givenName: string;
};

export function validateReservationIdentity(input: {
  reservationNumber?: unknown;
  familyName?: unknown;
  givenName?: unknown;
}): { ok: true; value: ReservationIdentity } | { ok: false; errors: ApiErrorDetail[] } {
  const reservationNumber =
    typeof input.reservationNumber === "string" ? input.reservationNumber.trim().toUpperCase() : "";
  const familyName = typeof input.familyName === "string" ? input.familyName.trim() : "";
  const givenName = typeof input.givenName === "string" ? input.givenName.trim() : "";
  const errors: ApiErrorDetail[] = [];

  const reservationNumberError = validateReservationNumber(reservationNumber);
  if (reservationNumberError) {
    errors.push({ field: "reservationNumber", message: reservationNumberError });
  }
  const familyNameError = validateName(familyName, "姓");
  if (familyNameError) errors.push({ field: "familyName", message: familyNameError });
  const givenNameError = validateName(givenName, "名");
  if (givenNameError) errors.push({ field: "givenName", message: givenNameError });

  return errors.length > 0
    ? { ok: false, errors }
    : { ok: true, value: { reservationNumber, familyName, givenName } };
}

export function matchesReservationGuest(
  storedName: string,
  identity: Pick<ReservationIdentity, "familyName" | "givenName">,
) {
  const inputName = `${identity.familyName} ${identity.givenName}`.replace(/\s+/g, " ").trim();
  return storedName.replace(/\s+/g, " ").trim() === inputName;
}
