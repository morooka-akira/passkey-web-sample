import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { RegistrationResponseJSON } from "@simplewebauthn/typescript-types";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const response: RegistrationResponseJSON = await request.json();
    const challenge = request.headers.get("Challenge");
    if (!challenge) {
      throw new Error("Challenge が見つかりません");
    }
    const origin = new URL(request.url).origin;

    // 認証情報の検証
    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      // PRID(ドメイン)
      expectedRPID: "localhost",
      // requireUserVerification: ユーザー検証が必要かどうかを指定する
      // falseの場合、認証器はユーザーの存在を確認するだけで、特定のユーザーが認証器を操作していることを検証しない
      requireUserVerification: false,
    });

    if (!verified || !registrationInfo) {
      throw new Error("認証情報の検証に失敗しました");
    }
    const { credentialPublicKey, credentialID } = registrationInfo;

    // 公開鍵のID,公開鍵をBase64URL形式に変換
    const base64CredentialID = isoBase64URL.fromBuffer(credentialID);
    const base64PublicKey = isoBase64URL.fromBuffer(credentialPublicKey);

    // 実際の実装では、ユーザーのIDもセッションに含めユーザーを識別する必要がある
    const userId = "12345";
    const userData = {
      userId,
      id: base64CredentialID,
      publicKey: base64PublicKey,
    };
    const jsonUserData = JSON.stringify({ [base64CredentialID]: userData });
    const dirPath = path.join(process.cwd(), "db");
    const filePath = path.join(dirPath, "user.json");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, jsonUserData);

    // 検証結果をJSONとして返します
    return NextResponse.json({ success: verified });
  } catch (e) {
    console.error("パスキーの登録に失敗しました", e);
    return new NextResponse("error", {
      status: 400,
    });
  }
}
