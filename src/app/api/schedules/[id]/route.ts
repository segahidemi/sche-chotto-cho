import { NextResponse } from "next/server";
import { getScheduleById } from "@/lib/dataService";

interface RouteParams {
  params: { id: string };
}

export async function GET(_: Request, { params }: RouteParams) {
  const schedule = await getScheduleById(params.id);
  if (!schedule) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  return NextResponse.json(schedule);
}
