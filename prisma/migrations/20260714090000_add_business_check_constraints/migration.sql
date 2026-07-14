ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_stay_dates_check"
  CHECK ("check_in_date" < "check_out_date"),
  ADD CONSTRAINT "reservations_guest_count_check"
  CHECK ("guest_count" > 0);

ALTER TABLE "room_types"
  ADD CONSTRAINT "room_types_capacity_check"
  CHECK ("capacity" > 0),
  ADD CONSTRAINT "room_types_base_rate_check"
  CHECK ("base_rate" >= 0);

ALTER TABLE "lodging_charges"
  ADD CONSTRAINT "lodging_charges_amount_check"
  CHECK ("amount" >= 0);

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_check"
  CHECK ("amount" >= 0);
