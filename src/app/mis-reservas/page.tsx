import type { Metadata } from "next";
import MyBookings from "./my-bookings";

export const metadata: Metadata = {
  title: "Mis reservas — HotelSync",
  description: "Tus reservas asociadas a tu cuenta o tu correo.",
};

export default function MyBookingsPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Mis reservas</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
        Iniciá sesión con la cuenta que usaste al reservar (o el mismo correo)
        para ver tus estadías.
      </p>
      <MyBookings />
    </div>
  );
}
