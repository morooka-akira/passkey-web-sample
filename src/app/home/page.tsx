"use client";

import { useEffect, useState } from "react";
import { base64url } from "src/utls/base64url";
import {
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from "@simplewebauthn/typescript-types";

async function registerCredential() {
  const res = await fetch("/api/register-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const options = await res.json();

  // base64をデコードしてArrayBufferに変換する必要がある
  options.user.id = base64url.decode(options.user.id);
  options.challenge = base64url.decode(options.challenge);

  try {
    // ユーザーが認証を拒否(キャンセルされたときは、例外がスローされる)
    const credential = await navigator.credentials.create({
      publicKey: options,
    });
    if (!credential) {
      console.error("Credential の作成に失敗しました");
      return;
    }

    // 公開鍵認証情報をサーバーへ送信する
    const publicKeyCredential = credential as PublicKeyCredential;
    const authResponse =
      publicKeyCredential.response as AuthenticatorAttestationResponse;
    // simplewebauthnのRegistrationResponseJSONを作成してサーバーに送信
    const responseJSON: RegistrationResponseJSON = {
      id: publicKeyCredential.id,
      rawId: publicKeyCredential.id,
      type: publicKeyCredential.type as PublicKeyCredentialType,
      clientExtensionResults: publicKeyCredential.getClientExtensionResults(),
      response: {
        // ArrayBuffer型のデータはbase64urlエンコードする
        attestationObject: base64url.encode(authResponse.attestationObject),
        clientDataJSON: base64url.encode(authResponse.clientDataJSON),
        transports:
          authResponse.getTransports() as AuthenticatorTransportFuture[],
      },
    };
    // 認証器のアタッチメントが存在する場合はレスポンスボディに追加
    if (publicKeyCredential.authenticatorAttachment) {
      responseJSON.authenticatorAttachment =
        publicKeyCredential.authenticatorAttachment as AuthenticatorAttachment;
    }
    // サーバーにレスポンスボディを送信
    await fetch("/api/register-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // サーバーで生成したチャレンジをヘッダーに含める
        Challenge: base64url.encode(options.challenge),
      },
      body: JSON.stringify(responseJSON),
    });
  } catch (e) {
    console.error("Credential の作成に失敗しました");
  }
}

/**
 * @returns WebAuthnが有効かどうかを返す
 */
async function isWebAuthnEnabled(): Promise<boolean> {
  if (
    // 1.WebAuthnが有効かどうかを判定する
    window.PublicKeyCredential &&
    // 2.ユーザーがプラットフォーム認証器（例えば、指紋認証や顔認証などのバイオメトリクス、またはPINなど）を利用可能かどうかを判定
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
    // 3.ユーザーが条件付きのユーザー認証を利用可能かどうかを判定
    PublicKeyCredential.isConditionalMediationAvailable
  ) {
    try {
      const results = await Promise.all([
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
        PublicKeyCredential.isConditionalMediationAvailable(),
      ]);
      return results.every((r) => r === true);
    } catch (e) {
      console.error(e);
      return false;
    }
  } else {
    return false;
  }
}

export default function Page() {
  const [isEnable, setIsEnable] = useState(false);
  useEffect(() => {
    (async () => {
      setIsEnable(await isWebAuthnEnabled());
    })();
  }, []);

  return (
    <div className="flex flex-col">
      {isEnable ? (
        <button
          onClick={() => {
            // パスキーの登録処理を開始
            registerCredential();
          }}
          className="max-w-xs bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          パスキーの登録
        </button>
      ) : (
        <div>このデバイスは、パスキーに対応していません</div>
      )}
    </div>
  );
}
