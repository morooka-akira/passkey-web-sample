import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 認証器の選択基準の定義
    const authenticatorSelection: AuthenticatorSelectionCriteria = {
      // "platform"を指定すると、プラットフォーム（例えばスマートフォンやPC）に内蔵されている認証器を使用する
      // これを指定すると、USBキーなどの外部デバイスを求められることがなくなる
      authenticatorAttachment: "platform",
      // requireResidentKeyをtrueに設定すると、認証器はユーザーの情報を保持する
      requireResidentKey: true,
    };

    // アテステーションタイプを"none"に設定 すると認証器の情報を検証しないことを意味する
    // ※ アテステーションとは、認証器（例えば、セキュリティキーなど）が正当であることを証明するための情報
    const attestationType = "none";

    // サンプルのため、ユーザーIDをランダムに生成
    const userID = "12345";
    const encodedUserID = Buffer.from(userID).toString("base64");
    const userEmail = "user@example.com";
    const userDisplayName = "Akira Morooka";

    const options = await generateRegistrationOptions({
      // Relying Party（信頼できるパーティ）の名前を指定する
      // 通常はサービスの名称を指定する
      rpName: "webauthn-sample",
      // Relying PartyのIDをドメイン形式で指定する
      rpID: "localhost",
      // ユーザーの一意のIDを指定する
      userID: encodedUserID,
      // ユーザーのメールアドレスやユーザー名を指定する。ユーザーに対して一意である必要がある。
      userName: userEmail,
      // ユーザーの表示名を指定。この名前は一意である必要はない。
      userDisplayName: userDisplayName,
      // 上で定義したアテステーションタイプ(none)
      attestationType: attestationType,
      // 除外する認証器のリストを指定します。既に登録済みの認証器(パスキー)を除外する場合は指定する。
      excludeCredentials: [],
      // 上で定義した認証器の選択基準
      authenticatorSelection: authenticatorSelection,
    });
    return NextResponse.json(options);
  } catch (e) {
    return new NextResponse("error", {
      status: 400,
    });
  }
}
