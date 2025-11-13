import { NextResponse } from "next/server";
import { createSchedule, listSchedules } from "@/lib/dataService";
import type { CreateSchedulePayload } from "@/lib/types";

export async function GET() {
  const schedules = await listSchedules();
  return NextResponse.json(schedules);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateSchedulePayload;
    const schedule = await createSchedule(payload);
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
