"use client";

async function registerCredential() {
  const res = await fetch("/api/register-request", {
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log(await res.json());
}

export default function Page() {
  return (
    <div className="flex flex-col">
      <button
        onClick={() => {
          registerCredential();
        }}
        className="max-w-xs bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        request
      </button>
    </div>
  );
}
