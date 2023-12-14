import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { AuthenticationResponseJSON } from "@simplewebauthn/typescript-types";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const response: AuthenticationResponseJSON = await request.json();
    const challenge = request.headers.get("Challenge");
    if (!challenge) {
      throw new Error("Challenge が見つかりません");
    }
    const origin = new URL(request.url).origin;
    console.log(response);

    const dirPath = path.join(process.cwd(), "db");
    const filePath = path.join(dirPath, "user.json");
    if (!fs.existsSync(filePath)) {
      throw new Error("user.json ファイルが見つかりません");
    }
    const fileContents = fs.readFileSync(filePath, "utf8");
    const users = JSON.parse(fileContents);
    console.log(users);

    // response.id に一致する credential を検索
    const user = users[response.id];

    // user が見つからない場合は認証失敗
    if (!user) {
      console.error("該当する credential が見つかりません");
      return NextResponse.json({ success: false });
    }

    const { verified, authenticationInfo } = await verifyAuthenticationResponse(
      {
        response,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: "localhost",
        requireUserVerification: false,
        authenticator: {
          counter: user.counter,
          credentialPublicKey: isoBase64URL.toBuffer(user.publicKey),
          credentialID: isoBase64URL.toBuffer(user.id),
          transports: user.transports,
        },
      }
    );
    console.log(verified, authenticationInfo);

    return NextResponse.json({ success: verified });
  } catch (e) {
    console.error("パスキーの認証に失敗しました", e);
    return new NextResponse("error", {
      status: 400,
    });
  }
}
