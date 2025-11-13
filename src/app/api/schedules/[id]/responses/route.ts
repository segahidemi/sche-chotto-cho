import { NextResponse } from "next/server";
import { upsertResponse } from "@/lib/dataService";
import type { ResponsePayload } from "@/lib/types";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const payload = (await request.json()) as ResponsePayload;
    const { id } = await params;
    const schedule = await upsertResponse(id, payload);
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Schedule not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
