import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const options = await generateAuthenticationOptions({
      rpID: "localhost",
      allowCredentials: [],
    });
    return NextResponse.json(options);
  } catch (e) {
    console.error(e);

    return new NextResponse("error", {
      status: 400,
    });
  }
}
