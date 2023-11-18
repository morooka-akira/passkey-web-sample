import { generateRegistrationOptions } from "@simplewebauthn/server";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authenticatorSelection: AuthenticatorSelectionCriteria = {
      // プラットフォームデバイスに内蔵されている認証器を指定する
      // これを指定することでusbなどの入力が求められない
      authenticatorAttachment: "platform",
      requireResidentKey: true,
    };
    // アテステーションは無効
    const attestationType = "none";
    const options = await generateRegistrationOptions({
      rpName: "localhost",
      // ホストを指定する
      rpID: "localhost",
      // ユーザー一意のIDを指定する
      userID: randomUUID(),
      // メールアドレスやユーザー名を指定する
      userName: "hoge@gmail.com",
      // ユーザーの表示名を指定する
      userDisplayName: "hoge",
      attestationType,
      excludeCredentials: [],
      authenticatorSelection,
    });
    console.log("options", options);

    return NextResponse.json(options);
  } catch (e) {
    return new NextResponse("error", {
      status: 400,
    });
  }
}
