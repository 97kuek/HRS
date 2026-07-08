import { FormField, fieldDescribedBy, fieldInputClass } from "@/components/form-field";

export type IdentityFormValue = {
  reservationNumber: string;
  familyName: string;
  givenName: string;
};

export type IdentityFormErrors = {
  reservationNumber: string | null;
  familyName: string | null;
  givenName: string | null;
};

export function IdentityVerificationForm({
  value,
  errors,
  touched,
  onChange,
  onTouched,
  idPrefix,
}: {
  value: IdentityFormValue;
  errors: IdentityFormErrors;
  touched: boolean;
  onChange: (value: IdentityFormValue) => void;
  onTouched: () => void;
  idPrefix: string;
}) {
  const reservationId = `${idPrefix}ReservationNumber`;
  const familyNameId = `${idPrefix}FamilyName`;
  const givenNameId = `${idPrefix}GivenName`;
  const reservationHint =
    "予約完了時に発行された番号です。半角英数字・ハイフンありで入力してください（例: HRS-20260710-0042）。";

  return (
    <>
      <FormField
        id={reservationId}
        label="予約番号"
        hint={reservationHint}
        error={errors.reservationNumber}
        touched={touched}
      >
        <input
          id={reservationId}
          className={fieldInputClass(touched, value.reservationNumber, errors.reservationNumber)}
          type="text"
          value={value.reservationNumber}
          aria-describedby={fieldDescribedBy(
            reservationId,
            reservationHint,
            errors.reservationNumber,
            touched,
          )}
          aria-invalid={touched && Boolean(errors.reservationNumber)}
          onBlur={onTouched}
          onChange={(e) => onChange({ ...value, reservationNumber: e.target.value })}
          placeholder="HRS-YYYYMMDD-NNNN"
        />
      </FormField>
      <div className="form-row">
        <FormField id={familyNameId} label="姓" error={errors.familyName} touched={touched}>
          <input
            id={familyNameId}
            className={fieldInputClass(touched, value.familyName, errors.familyName)}
            type="text"
            value={value.familyName}
            autoComplete="family-name"
            placeholder="山田"
            aria-invalid={touched && Boolean(errors.familyName)}
            onBlur={onTouched}
            onChange={(e) => onChange({ ...value, familyName: e.target.value })}
          />
        </FormField>
        <FormField id={givenNameId} label="名" error={errors.givenName} touched={touched}>
          <input
            id={givenNameId}
            className={fieldInputClass(touched, value.givenName, errors.givenName)}
            type="text"
            value={value.givenName}
            autoComplete="given-name"
            placeholder="太郎"
            aria-invalid={touched && Boolean(errors.givenName)}
            onBlur={onTouched}
            onChange={(e) => onChange({ ...value, givenName: e.target.value })}
          />
        </FormField>
      </div>
    </>
  );
}
