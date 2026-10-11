export const API = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);
export interface User {
  id: string;
  name: string;
  role: string;
}
export type RecordData = Record<string, any>;
export interface Snapshot {
  user: User;
  lots: RecordData[];
  transactions: RecordData[];
  facilities: RecordData[];
  materials: RecordData[];
  pickups: RecordData[];
  earnings: { received_inr: number; pending_inr: number };
  bins: RecordData[];
  factors: RecordData[];
}
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export async function api(
  path: string,
  body?: unknown,
  method = "GET",
  operationId?: string,
): Promise<any> {
  const token = localStorage.getItem("scrapsetu_token");
  const res = await fetch(`${API}/v2${path}`, {
    method,
    signal: AbortSignal.timeout(80000),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET"
        ? { "Idempotency-Key": operationId || crypto.randomUUID() }
        : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : Array.isArray(data?.detail)
          ? data.detail
              .map((d: RecordData) => `${d.loc?.slice(-1)}: ${d.msg}`)
              .join("; ")
          : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return res.headers.get("Content-Type")?.includes("json")
    ? res.json()
    : res.blob();
}

export interface Draft {
  id: string;
  owner: string;
  payload: RecordData;
  image?: string;
  error?: string;
  created_at: string;
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("scrapsetu-offline-v1", 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("drafts", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function drafts(owner: string): Promise<Draft[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts");
    const req = tx.objectStore("drafts").getAll();
    req.onsuccess = () =>
      resolve((req.result as Draft[]).filter((d) => d.owner === owner));
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
export async function saveDraft(draft: Draft): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite");
    tx.objectStore("drafts").put(draft);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function removeDraft(id: string): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite");
    tx.objectStore("drafts").delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function syncDraft(draft: Draft) {
  let evidenceId = draft.payload.evidence_id;
  if (draft.image && !evidenceId) {
    const evidence = await api(
      "/evidence",
      { image_base64: draft.image },
      "POST",
      draft.id + ":evidence",
    );
    evidenceId = evidence.id;
  }
  await api(
    "/lots",
    { ...draft.payload, evidence_id: evidenceId || null },
    "POST",
    draft.id,
  );
  await removeDraft(draft.id);
}
export async function startCognito(config: RecordData) {
  const verifier =
    crypto.randomUUID().replaceAll("-", "") +
    crypto.randomUUID().replaceAll("-", "");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  const state = crypto.randomUUID();
  sessionStorage.setItem("pkce", JSON.stringify({ verifier, state }));
  const url = new URL("/oauth2/authorize", config.cognito_domain);
  url.search = new URLSearchParams({
    client_id: config.cognito_client_id,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: config.frontend_url + "/",
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  }).toString();
  location.assign(url.toString());
}
export async function finishCognito(config: RecordData) {
  const params = new URLSearchParams(location.search);
  if (!params.has("code")) return;
  const saved = JSON.parse(sessionStorage.getItem("pkce") || "{}");
  if (!saved.state || params.get("state") !== saved.state)
    throw new Error("Invalid login state. Sign in again.");
  const response = await fetch(config.cognito_domain + "/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.cognito_client_id,
      code: params.get("code")!,
      redirect_uri: config.frontend_url + "/",
      code_verifier: saved.verifier,
    }),
  });
  if (!response.ok)
    throw new Error(
      "Cloud sign-in failed. Check the callback URL and client settings.",
    );
  const tokens = await response.json();
  localStorage.setItem("scrapsetu_token", tokens.access_token);
  sessionStorage.removeItem("pkce");
  history.replaceState({}, "", "/");
}
