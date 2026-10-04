import type { Metadata } from "next";
import HousekeepingBoard from "./board";

export const metadata: Metadata = {
  title: "Limpieza — HotelSync Admin",
  description: "Tareas de limpieza: mis tareas y cola del hotel.",
};

export default function HousekeepingPage({
  searchParams,
}: {
  searchParams: Promise<{ hotel_id?: string }>;
}) {
  return <HousekeepingBoard params={searchParams} />;
}
