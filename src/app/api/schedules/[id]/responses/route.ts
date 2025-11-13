import { NextResponse } from "next/server";
import { upsertResponse } from "@/lib/dataService";
import type { ResponsePayload } from "@/lib/types";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const payload = (await request.json()) as ResponsePayload;
    const schedule = await upsertResponse(params.id, payload);
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Schedule not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
