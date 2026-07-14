"use client";

import { useState } from "react";

import type { IdentityFormValue } from "@/components/identity-verification-form";
import { validateName, validateReservationNumber } from "@/lib/validation";

export function useReservationIdentityForm(initialReservationNumber = "") {
  const [identity, setIdentity] = useState<IdentityFormValue>({
    reservationNumber: initialReservationNumber,
    familyName: "",
    givenName: "",
  });
  const [touched, setTouched] = useState(false);
  const errors = {
    reservationNumber: validateReservationNumber(identity.reservationNumber),
    familyName: validateName(identity.familyName, "姓"),
    givenName: validateName(identity.givenName, "名"),
  };

  return {
    identity,
    setIdentity,
    touched,
    touch: () => setTouched(true),
    errors,
    hasError: Object.values(errors).some(Boolean),
  };
}
