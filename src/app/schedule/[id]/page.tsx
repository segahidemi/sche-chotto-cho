import { notFound } from "next/navigation";
import ScheduleClient from "@/components/ScheduleClient";
import { getScheduleById } from "@/lib/dataService";

interface SchedulePageProps {
  params: { id: string };
}

export const revalidate = 0;

export default async function SchedulePage({ params }: SchedulePageProps) {
  const schedule = await getScheduleById(params.id);

  if (!schedule) {
    notFound();
  }

  return (
    <main className="container">
      <ScheduleClient initialSchedule={schedule} />
    </main>
  );
}
