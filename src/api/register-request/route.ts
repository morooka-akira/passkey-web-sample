import { NextResponse } from "next/server";

export async function GET(request: Request, { params }) {
  console.log("params", params);

  return NextResponse.json({ ok: true });
}
