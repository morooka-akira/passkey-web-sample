"use client";
import { AuthenticationResponseJSON } from "@simplewebauthn/typescript-types";
import { useEffect } from "react";
import { base64url } from "src/utls/base64url";

async function authentication() {
  // 条件付きUIがサポートされているかの確認
  if (!(await PublicKeyCredential.isConditionalMediationAvailable())) {
    return;
  }
  const res = await fetch("/api/signin-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const options = await res.json();
  options.challenge = base64url.decode(options.challenge);

  options.allowCredentials = [];
  // パスキーの公開鍵認証情報を取得
  const credential = await navigator.credentials.get({
    publicKey: options,
    mediation: "conditional",
  });

  const publicKeyCredential = credential as PublicKeyCredential;
  const authenticatorAssertionResponse =
    publicKeyCredential.response as AuthenticatorAssertionResponse;

  // simplewebauthnで用意されている認証用の型に変換
  const responseJSON: AuthenticationResponseJSON = {
    id: publicKeyCredential.id,
    rawId: publicKeyCredential.id,
    type: publicKeyCredential.type as PublicKeyCredentialType,
    response: {
      authenticatorData: base64url.encode(
        authenticatorAssertionResponse.authenticatorData
      ),
      clientDataJSON: base64url.encode(
        publicKeyCredential.response.clientDataJSON
      ),
      signature: base64url.encode(authenticatorAssertionResponse.signature),
      userHandle: base64url.encode(authenticatorAssertionResponse.userHandle!),
    },
    clientExtensionResults: publicKeyCredential.getClientExtensionResults(),
  };

  // サーバーにレスポンスボディを送信
  const result = await fetch("/api/signin-response", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // サーバーで生成したチャレンジをヘッダーに含める
      Challenge: base64url.encode(options.challenge),
    },
    body: JSON.stringify(responseJSON),
  });

  alert(`認証に${(await result.json()).success ? "成功" : "失敗"}しました`);
}

export default function Page() {
  useEffect(() => {
    if (window.PublicKeyCredential) {
      authentication();
    }
  }, []);

  return (
    <div className="flex flex-col space-y-4">
      <form id="form" method="POST" action="/auth/username" className="center">
        <label
          className="block text-sm font-medium text-gray-700"
          id="username-label"
        >
          username
        </label>
        <input
          type="text"
          id="username"
          className="px-3 py-2 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300"
          aria-labelledby="username-label"
          name="username"
          autoComplete="username webauthn"
          autoFocus
        />
        <label
          className="block text-sm font-medium text-gray-700"
          id="password-label"
        >
          password
        </label>
        <input
          type="password"
          className="px-3 py-2 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300"
          aria-labelledby="password-label"
          name="password"
          autoComplete="current-password"
        />
      </form>
    </div>
  );
}
