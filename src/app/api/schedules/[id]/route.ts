import { NextResponse } from "next/server";
import { getScheduleById } from "@/lib/dataService";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params;
  const schedule = await getScheduleById(id);
  if (!schedule) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  return NextResponse.json(schedule);
}
