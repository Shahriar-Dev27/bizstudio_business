import { NextRequest, NextResponse } from "next/server";
import { getAnonymousSession } from "@/lib/chat/session";
import {
  readJob,
  publicJobSnapshot,
  cancelGenerationJob,
} from "@/lib/chat/jobs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function ownedJob(request: NextRequest, params: Promise<{ id: string }>) {
  const { id } = await params;
  const job = await readJob(id);
  return job && job.owner === getAnonymousSession(request).id ? job : null;
}
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const job = await ownedJob(request, context.params);
    if (!job)
      return NextResponse.json(
        { error: "Plan request not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    return NextResponse.json(publicJobSnapshot(job), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to check this reply. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return NextResponse.json({ error: "Request denied." }, { status: 403 });
  try {
    const job = await ownedJob(request, context.params);
    if (!job)
      return NextResponse.json(
        { error: "Plan request not found." },
        { status: 404 },
      );
    await cancelGenerationJob(job.id);
    return NextResponse.json(
      { stopped: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to stop the reply." },
      { status: 503 },
    );
  }
}
