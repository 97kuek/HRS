export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
};

export type ReservationStatus = "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

export type ReservationLookup = {
  reservationNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  guestName: string;
  email: string;
  phone: string | null;
  status: ReservationStatus;
  totalCharge: number;
  roomNumber: string | null;
};

export type CheckInResult = {
  reservationNumber: string;
  roomTypeName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  checkedInAt: string;
};

export type CheckOutQuote = {
  roomNumber: string;
  reservationNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  amount: number;
};

export type CheckOutResult = {
  roomNumber: string;
  reservationNumber: string;
  roomTypeName: string;
  amount: number;
  method: string;
  paidAt: string;
  checkedOutAt: string | null;
};

export type CancellationQuote = {
  reservationNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalCharge: number;
  cancellationFee: number;
  cancellationPolicy: string;
  cancellationPolicyDescription: string;
  status: ReservationStatus;
  cancelable: boolean;
  reason: string | null;
};

export type CancellationResult = Omit<
  CancellationQuote,
  "cancellationPolicyDescription" | "cancelable" | "reason"
>;
