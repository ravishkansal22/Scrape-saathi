import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  api,
  API,
  ApiError,
  drafts,
  saveDraft,
  removeDraft,
  syncDraft,
  startCognito,
  finishCognito,
} from "./workflow";
import type { Snapshot, RecordData, Draft } from "./workflow";
import { Form, Panel, Badge, Reveal } from "./WorkflowForms";
import { num, text, select } from "./workflowFields";
import "./workflow.css";
const cash = (n: number) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const time = (s: string) => new Date(s).toLocaleString();
const samples = [
  "electric_motor",
  "copper_cable",
  "swollen_laptop",
  "unknown_rusty_compressor",
  "organic_kitchen_waste",
];
const fileData = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (file.size > 3750000) {
      reject(new Error("Resize the photo to at most 3.75 MB"));
      return;
    }
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read image"));
    r.readAsDataURL(file);
  });
export function App() {
  const [cfg, setCfg] = useState<RecordData>(() =>
    JSON.parse(localStorage.getItem("scrapsetu_config") || "{}"),
  );
  const [data, setData] = useState<Snapshot | null>(null),
    [tab, setTab] = useState("Collect"),
    [lang, setLang] = useState(
      localStorage.getItem("scrapsetu_language") || "en",
    );
  const [online, setOnline] = useState(navigator.onLine),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [queue, setQueue] = useState<Draft[]>([]),
    [photo, setPhoto] = useState(""),
    [analysis, setAnalysis] = useState<RecordData | null>(null),
    [hazards, setHazards] = useState<RecordData>({});
  const [lot, setLot] = useState<RecordData | null>(null),
    [trace, setTrace] = useState<RecordData | null>(null),
    [impact, setImpact] = useState<RecordData | null>(null),
    [route, setRoute] = useState<RecordData | null>(null),
    [matches, setMatches] = useState<RecordData[] | null>(null);
  const [token, setToken] = useState(""),
    [qr, setQr] = useState(""),
    [receiveToken, setReceiveToken] = useState(""),
    [outcomePhoto, setOutcomePhoto] = useState("");
  const syncing = useRef(false),
    started = useRef(false);
  const user = data?.user;
  async function refresh() {
    const s: Snapshot = await api("/state");
    setData(s);
    localStorage.setItem("scrapsetu_snapshot", JSON.stringify(s));
    setQueue(await drafts(s.user.id));
    setLot((l) => (l ? s.lots.find((v) => v.id === l.id) || null : null));
    return s;
  }
  async function run(fn: () => Promise<unknown>, msg = "Saved") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      await refresh();
      setNotice(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  async function sync(owner: string) {
    if (syncing.current || !navigator.onLine) return;
    syncing.current = true;
    try {
      for (const d of await drafts(owner)) {
        if (d.error) continue;
        try {
          await syncDraft(d);
        } catch (e) {
          if (
            e instanceof ApiError &&
            e.status >= 400 &&
            e.status < 500 &&
            e.status !== 401
          )
            await saveDraft({ ...d, error: e.message });
          else {
            setError(e instanceof Error ? e.message : "Sync interrupted");
            break;
          }
        }
      }
      await refresh();
    } finally {
      syncing.current = false;
    }
  }
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const c = await api("/config");
        setCfg(c);
        localStorage.setItem("scrapsetu_config", JSON.stringify(c));
        await finishCognito(c);
        if (localStorage.getItem("scrapsetu_token")) {
          const s = await refresh();
          setTab(s.user.role === "collector" ? "Collect" : "Lots");
          await sync(s.user.id);
        }
      } catch (e) {
        const cached = localStorage.getItem("scrapsetu_snapshot");
        if (
          !navigator.onLine &&
          cached &&
          localStorage.getItem("scrapsetu_token")
        ) {
          const s = JSON.parse(cached);
          setData(s);
          setQueue(await drafts(s.user.id));
        } else setError(e instanceof Error ? e.message : "Backend unavailable");
      }
    })();
    if (import.meta.env.PROD && "serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => setNotice("Offline install unavailable in this browser."));
  }, []);
  useEffect(() => {
    const on = () => {
      setOnline(true);
      if (user) void sync(user.id).catch((e) => setError(String(e)));
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [user]);
  useEffect(() => {
    let cancelled = false;
    if (token)
      QRCode.toDataURL(token, { width: 260, margin: 2 }).then((value) => {
        if (!cancelled) setQr(value);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);
  async function speak(key: string) {
    const content = cfg.guidance?.[lang]?.[key];
    if (!content) return;
    try {
      const url = `${API}/v2/guidance/${lang}/${key}`,
        cache = await caches.open("scrapsetu-guidance-v1");
      let response = await cache.match(url);
      if (!response && online && cfg.polly) {
        const r = await fetch(url);
        if (r.ok) {
          await cache.put(url, r.clone());
          response = r;
        }
      }
      if (response) {
        const u = URL.createObjectURL(await response.blob()),
          a = new Audio(u);
        a.onended = () => URL.revokeObjectURL(u);
        await a.play();
        return;
      }
      if (!("speechSynthesis" in window))
        throw new Error("Audio unavailable; read the guidance below.");
      const speech = new SpeechSynthesisUtterance(content);
      speech.lang = lang === "hi" ? "hi-IN" : "en-IN";
      speechSynthesis.cancel();
      speechSynthesis.speak(speech);
      setNotice(
        "Using device speech; installed voices determine offline language availability.",
      );
    } catch (e) {
      setError(String(e));
    }
  }
  function logout() {
    localStorage.removeItem("scrapsetu_token");
    localStorage.removeItem("scrapsetu_snapshot");
    setData(null);
    setLot(null);
    setTrace(null);
    setAnalysis(null);
    setPhoto("");
    setQueue([]);
    setToken("");
  }
  const mutate = (
    path: string,
    payload: RecordData,
    method = "POST",
    msg = "Saved",
  ) => run(() => api(path, payload, method), msg);
  async function show(l: RecordData) {
    setLot(l);
    setTrace(null);
    try {
      setTrace(await api(`/lots/${l.id}/trace`));
    } catch (e) {
      setError(String(e));
    }
  }
  async function receipt(id: string) {
    await run(async () => {
      const r = await api(`/transactions/${id}/receipt`);
      const u = URL.createObjectURL(
        new Blob([JSON.stringify(r, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = u;
      a.download = id + "-receipt.json";
      a.click();
      URL.revokeObjectURL(u);
    }, "Receipt downloaded");
  }
  async function scan(file: File) {
    const D = (
      window as unknown as {
        BarcodeDetector?: new (v: RecordData) => {
          detect: (b: ImageBitmap) => Promise<{ rawValue: string }[]>;
        };
      }
    ).BarcodeDetector;
    if (!D) {
      setError(
        "QR scanning is unavailable in this browser. Paste the sender token instead.",
      );
      return;
    }
    const image = await createImageBitmap(file);
    try {
      const codes = await new D({ formats: ["qr_code"] }).detect(image);
      if (!codes[0]) throw new Error("No QR found");
      setReceiveToken(codes[0].rawValue);
    } catch (e) {
      setError(String(e));
    } finally {
      image.close();
    }
  }
  const materials =
    data?.materials.map((m) => ({ value: m.id, label: m.name })) || [];
  const materialField = select("material_id", "Material", materials);
  const available =
    data?.lots.filter(
      (l) => l.custodian_id === user?.id && l.status === "AVAILABLE",
    ) || [];
  return (
    <div className="workflow">
      <header className="wf-header">
        <a className="wf-brand" href="/">
          ♻{" "}
          <span>
            ScrapSetu<small>Every handover counts.</small>
          </span>
        </a>
        <div className="wf-actions">
          <Badge>
            {online ? "Connected" : "Offline · drafts stay on device"}
          </Badge>
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => {
              setLang(e.target.value);
              localStorage.setItem("scrapsetu_language", e.target.value);
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
          {user && (
            <button className="quiet" onClick={logout}>
              Sign out
            </button>
          )}
        </div>
      </header>
      <main className="wf-main">
        {error && (
          <div className="wf-error" role="alert">
            {error}
            <button onClick={() => setError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
        {notice && (
          <div className="wf-notice" role="status">
            ✓ {notice}
          </div>
        )}
        {!user ? (
          <div className="wf-login">
            <div>
              <span className="wf-eyebrow">Waste → resources</span>
              <h1>
                Fairer prices.
                <br />
                Safer handovers.
                <br />
                <em>Records that stay.</em>
              </h1>
              <p>
                Collect, compare, hand over and follow your material to
                recovery. Built for collectors and the people who buy from them.
              </p>
              <Badge>Measured weights</Badge>
              <Badge>Offline drafts</Badge>
              <Badge>Two-party confirmation</Badge>
            </div>
            <Panel title="Welcome back">
              {cfg.auth_mode === "cognito" ? (
                <>
                  <p>Use your assigned cloud account.</p>
                  <button onClick={() => startCognito(cfg)}>
                    Sign in securely
                  </button>
                </>
              ) : (
                <>
                  <p>Local testing · a separate account for each role.</p>
                  <Form
                    fields={[
                      select(
                        "user",
                        "Account",
                        ["collector", "vendor", "recycler", "admin"].map(
                          (r) => ({ value: r + "_demo", label: r + "_demo" }),
                        ),
                      ),
                      {
                        name: "password",
                        label: "Password",
                        type: "password",
                        value: "scrapsetu-local",
                      },
                    ]}
                    submit="Sign in locally"
                    disabled={busy}
                    onSubmit={(v) =>
                      run(async () => {
                        const s = await api("/login", v, "POST");
                        localStorage.setItem("scrapsetu_token", s.access_token);
                        const d = await refresh();
                        setTab(
                          d.user.role === "collector" ? "Collect" : "Lots",
                        );
                      }, "Signed in")
                    }
                  />
                  <small>
                    Default local password: scrapsetu-local. Production uses
                    Cognito, not these demo accounts.
                  </small>
                </>
              )}
            </Panel>
          </div>
        ) : (
          <>
            <div className="wf-greeting">
              <div>
                <span className="wf-eyebrow">{user.role} workspace</span>
                <h1>
                  {lang === "hi" ? "नमस्ते" : "Hello"},{" "}
                  {user.name.split(" ")[0]}.
                </h1>
                <p>
                  {lang === "hi"
                    ? "सामग्री का रिकॉर्ड रखें। हर लेन-देन साफ रखें।"
                    : "Keep your material moving—and your records clear."}
                </p>
              </div>
              <button
                className="quiet"
                disabled={busy || !online}
                onClick={() => run(refresh, "Updated")}
              >
                ↻ Refresh
              </button>
            </div>
            <div className="wf-metrics">
              {[
                ["Payments received", cash(data!.earnings.received_inr)],
                ["Pending payment", cash(data!.earnings.pending_inr)],
                ["Your lots", data!.lots.length],
                ["On-device drafts", queue.length],
              ].map(([label, value]) => (
                <article key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>
            <nav className="wf-tabs">
              {[
                "Collect",
                "Lots",
                "Handovers",
                "Partners",
                "Pickups",
                "Impact",
                "Admin",
              ]
                .filter((t) => t !== "Admin" || user.role === "admin")
                .filter(
                  (t) =>
                    t !== "Collect" ||
                    ["collector", "vendor"].includes(user.role),
                )
                .map((t) => (
                  <button
                    key={t}
                    className={tab === t ? "active" : ""}
                    onClick={() => {
                      setTab(t);
                      if (t === "Impact")
                        void run(
                          async () => setImpact(await api("/impact")),
                          "Impact loaded",
                        );
                    }}
                  >
                    {t}
                  </button>
                ))}
            </nav>
            {tab === "Collect" && (
              <div className="wf-columns">
                <Panel title="1. Identify your material">
                  <p>{cfg.guidance?.[lang]?.welcome}</p>
                  <button className="quiet" onClick={() => speak("welcome")}>
                    🔊 Hear guidance
                  </button>
                  <label className="wf-upload">
                    📷 Take or upload a photo
                    <input
                      aria-label="Material photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      capture="environment"
                      disabled={busy}
                      onChange={async (e) => {
                        setAnalysis(null);
                        setPhoto("");
                        if (e.target.files?.[0])
                          try {
                            setPhoto(await fileData(e.target.files[0]));
                          } catch (err) {
                            setError(String(err));
                          }
                      }}
                    />
                  </label>
                  {photo && (
                    <img
                      className="wf-photo"
                      src={photo}
                      alt="Selected material"
                    />
                  )}
                  <fieldset>
                    <legend>Any hazards you noticed?</legend>
                    {[
                      ["battery_damage", "Damaged battery"],
                      ["chemical_leak", "Chemical leak"],
                      ["pressurized_canister", "Pressurized container"],
                      ["exposed_wiring", "Exposed wiring"],
                      ["sharp_edges", "Sharp edges"],
                    ].map(([key, label]) => (
                      <label className="check" key={key}>
                        <input
                          type="checkbox"
                          disabled={busy}
                          checked={!!hazards[key]}
                          onChange={(e) => {
                            setHazards({ ...hazards, [key]: e.target.checked });
                            setAnalysis(null);
                          }}
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                  <button
                    disabled={busy || !online || !photo}
                    onClick={() =>
                      run(async () => {
                        setAnalysis(null);
                        setAnalysis(
                          await api(
                            "/analyze",
                            { image_base64: photo, reported_hazards: hazards },
                            "POST",
                          ),
                        );
                      }, "Identification saved; confirm the material and weight")
                    }
                  >
                    Identify uploaded photo
                  </button>
                  <Reveal title="Try a labeled demo sample">
                    <div className="wf-actions wrap">
                      {samples.map((s) => (
                        <button
                          key={s}
                          className="quiet"
                          disabled={busy || !online}
                          onClick={() =>
                            run(async () => {
                              setPhoto("");
                              setAnalysis(null);
                              setAnalysis(
                                await api(
                                  "/analyze",
                                  {
                                    sample_item_id: s,
                                    reported_hazards: hazards,
                                  },
                                  "POST",
                                ),
                              );
                            }, "Demo result—not live AI")
                          }
                        >
                          {s.replaceAll("_", " ")}
                        </button>
                      ))}
                    </div>
                  </Reveal>
                  {analysis && (
                    <div className="wf-result">
                      <Badge>
                        {analysis.result.analysis_source === "demo"
                          ? "DEMO · not live AI"
                          : analysis.result.model_id}
                      </Badge>
                      <h3>{analysis.result.item_title}</h3>
                      <p>
                        {analysis.result.category} ·{" "}
                        {Math.round(analysis.result.overall_confidence * 100)}%
                        model/demo score—not measured accuracy
                      </p>
                      <p>{analysis.result.safe_handling_guidance}</p>
                      {analysis.result.requires_manual_inspection && (
                        <strong>Qualified review required before sale.</strong>
                      )}
                    </div>
                  )}
                </Panel>
                <Panel title="2. Save a measured lot">
                  <p>
                    Select the actual material. An image cannot certify alloy
                    purity. Manual and offline entries await qualified review.
                  </p>
                  <Form
                    fields={[
                      text("title", "Lot description"),
                      materialField,
                      num("weight_kg", "Actual scale weight (kg)", 10, 0.001),
                      text("location", "Collection location", "Delhi"),
                      { ...text("notes", "Notes"), optional: true },
                    ]}
                    submit={online ? "Save lot" : "Save offline draft"}
                    disabled={busy}
                    onSubmit={async (v) => {
                      setBusy(true);
                      setError("");
                      try {
                        const d: Draft = {
                          id: crypto.randomUUID(),
                          owner: user.id,
                          payload: {
                            ...v,
                            analysis_id: analysis?.id || null,
                            reported_hazards: hazards,
                          },
                          image: photo || undefined,
                          created_at: new Date().toISOString(),
                        };
                        await saveDraft(d);
                        setQueue(await drafts(user.id));
                        setNotice("Draft saved on this device.");
                        if (online) await sync(user.id);
                      } catch (e) {
                        setError(String(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                  <button className="quiet" onClick={() => speak("safety")}>
                    🔊 Hear safety guidance
                  </button>
                  <p>{cfg.guidance?.[lang]?.safety}</p>
                  <h3>Saved drafts</h3>
                  {queue.map((d) => (
                    <article className="wf-row" key={d.id}>
                      <div>
                        <strong>{d.payload.title}</strong>
                        <small>{time(d.created_at)}</small>
                        {d.error && <p role="alert">{d.error}</p>}
                        <div className="wf-actions">
                          <button
                            className="quiet"
                            disabled={!online || busy}
                            onClick={() =>
                              run(async () => {
                                await saveDraft({ ...d, error: undefined });
                                await sync(user.id);
                              }, "Sync checked")
                            }
                          >
                            Retry sync
                          </button>
                          <button
                            className="quiet"
                            onClick={() =>
                              run(() => removeDraft(d.id), "Draft removed")
                            }
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </Panel>
              </div>
            )}
            {tab === "Lots" && (
              <div className="wf-columns">
                <Panel title="Material lots">
                  <p>
                    Original weights stay recorded. Aggregations retain source
                    allocations.
                  </p>
                  {data!.lots.length === 0 && (
                    <p>
                      No lots yet. Create a collection or wait for an offer.
                    </p>
                  )}
                  {data!.lots.map((l) => (
                    <button
                      className={`wf-row ${lot?.id === l.id ? "selected" : ""}`}
                      key={l.id}
                      onClick={() => show(l)}
                    >
                      <div>
                        <strong>{l.title}</strong>
                        <small>
                          {l.id} · {l.material_id}
                        </small>
                        <Badge>{l.status}</Badge>
                        {l.is_demo && <Badge>Demo</Badge>}
                      </div>
                      <strong>{l.available_kg} kg</strong>
                    </button>
                  ))}
                  {user.role === "vendor" && (
                    <Reveal title="Aggregate available source lots">
                      <Form
                        fields={[
                          text("title", "Bulk lot title"),
                          ...available.map((l) =>
                            num(
                              l.id,
                              `${l.title} · ${l.available_kg} kg available`,
                            ),
                          ),
                        ]}
                        submit="Create bulk lot"
                        disabled={busy}
                        onSubmit={(v) =>
                          mutate("/lots/merge", {
                            title: v.title,
                            allocations: available
                              .filter((l) => v[l.id] > 0)
                              .map((l) => ({
                                lot_id: l.id,
                                version: l.version,
                                weight_kg: v[l.id],
                              })),
                          })
                        }
                      />
                    </Reveal>
                  )}
                </Panel>
                <Panel title={lot?.title || "Lot details"}>
                  {!lot ? (
                    <p>
                      Select a lot to inspect its history or arrange a handover.
                    </p>
                  ) : (
                    <>
                      <p>
                        {lot.original_weight_kg} kg originally recorded ·{" "}
                        {lot.available_kg} kg available
                      </p>
                      <small>
                        {lot.location} · custodian: {lot.custodian_id}
                      </small>
                      {lot.status === "REVIEW_REQUIRED" && (
                        <p className="wf-warning">
                          Documented administrator review is required.
                        </p>
                      )}
                      {lot.evidence_id && (
                        <button
                          className="quiet"
                          onClick={() =>
                            run(async () => {
                              const blob = await api(
                                `/evidence/${lot.evidence_id}`,
                              );
                              const url = URL.createObjectURL(blob);
                              window.open(url, "_blank", "noopener");
                              setTimeout(() => URL.revokeObjectURL(url), 60000);
                            }, "Evidence opened")
                          }
                        >
                          View evidence
                        </button>
                      )}
                      {lot.custodian_id === user.id &&
                        lot.status === "AVAILABLE" &&
                        ["collector", "vendor"].includes(user.role) && (
                          <>
                            <h3>Offer to an eligible buyer</h3>
                            <Form
                              fields={[
                                select(
                                  "receiver_id",
                                  "Buyer",
                                  data!.facilities
                                    .filter(
                                      (f) =>
                                        f.id !== user.id &&
                                        f.eligible_now &&
                                        f.accepted_materials.includes(
                                          lot.material_id,
                                        ),
                                    )
                                    .map((f) => ({
                                      value: f.id,
                                      label:
                                        f.name + (f.is_demo ? " (demo)" : ""),
                                    })),
                                ),
                                num("rate", "Offer (₹/kg)", 100, 0.01),
                                num("fee", "Disclosed total fee (₹)"),
                              ]}
                              submit="Create handover offer"
                              disabled={busy}
                              onSubmit={(v) =>
                                run(async () => {
                                  const tx = await api(
                                    `/lots/${lot.id}/offer`,
                                    { ...v, version: lot.version },
                                    "POST",
                                  );
                                  setToken(tx.qr_token);
                                  setTab("Handovers");
                                }, "Offer created; receiver measures, then you approve")
                              }
                            />
                          </>
                        )}
                      {user.role === "recycler" &&
                        lot.custodian_id === user.id &&
                        lot.status === "AVAILABLE" && (
                          <>
                            <h3>Record recovery with evidence</h3>
                            <label>
                              Recovery evidence photo
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  setOutcomePhoto("");
                                  if (e.target.files?.[0])
                                    try {
                                      setOutcomePhoto(
                                        await fileData(e.target.files[0]),
                                      );
                                    } catch (err) {
                                      setError(String(err));
                                    }
                                }}
                              />
                            </label>
                            <Form
                              fields={[
                                num(
                                  "recovered_kg",
                                  "Recovered output kg",
                                  lot.available_kg,
                                  0.001,
                                ),
                                num("residue_kg", "Residue / process loss kg"),
                                text("method", "Treatment method"),
                              ]}
                              submit="Record recovery"
                              disabled={busy || !outcomePhoto}
                              onSubmit={(v) =>
                                run(async () => {
                                  const evidence = await api(
                                    "/evidence",
                                    { image_base64: outcomePhoto },
                                    "POST",
                                  );
                                  await api(
                                    `/lots/${lot.id}/outcome`,
                                    {
                                      ...v,
                                      version: lot.version,
                                      evidence_id: evidence.id,
                                    },
                                    "POST",
                                  );
                                  setOutcomePhoto("");
                                }, "Recovery recorded")
                              }
                            />
                          </>
                        )}
                      <h3>Recorded history</h3>
                      <ol className="wf-timeline">
                        {trace?.events.map((e: RecordData) => (
                          <li key={e.id}>
                            <strong>{e.action.replaceAll("_", " ")}</strong>
                            <small>
                              {time(e.timestamp)} · {e.actor_id}
                            </small>
                            <p>
                              {e.details.weight_kg !== undefined
                                ? `${e.details.weight_kg} kg`
                                : e.details.notes ||
                                  e.details.reason ||
                                  e.details.method ||
                                  ""}
                            </p>
                          </li>
                        ))}
                      </ol>
                      {trace && trace.source_lots.length > 1 && (
                        <small>
                          Sources:{" "}
                          {trace.source_lots
                            .map((l: RecordData) => l.id)
                            .join(", ")}
                        </small>
                      )}
                    </>
                  )}
                </Panel>
              </div>
            )}
            {tab === "Handovers" && (
              <>
                <div className="wf-columns">
                  <Panel title="Receive a handover">
                    <p>
                      Scan a QR image or paste the token. Only the named
                      receiver can redeem it.
                    </p>
                    <input
                      aria-label="Scan QR image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) void scan(e.target.files[0]);
                      }}
                    />
                    <label>
                      Handover token
                      <textarea
                        value={receiveToken}
                        onChange={(e) => setReceiveToken(e.target.value)}
                      />
                    </label>
                    <Form
                      fields={[
                        num(
                          "measured_weight_kg",
                          "Receiver scale weight kg",
                          10,
                          0.001,
                        ),
                        num("deduction_kg", "Contamination deduction kg"),
                        {
                          ...text("notes", "Inspection notes"),
                          optional: true,
                        },
                      ]}
                      submit="Submit measured receipt"
                      disabled={
                        busy ||
                        !["vendor", "recycler"].includes(user.role) ||
                        !receiveToken
                      }
                      onSubmit={(v) =>
                        mutate(
                          "/handover/receive",
                          { ...v, token: receiveToken },
                          "POST",
                          "Measurements proposed; sender must accept",
                        )
                      }
                    />
                  </Panel>
                  <Panel title="Handover QR">
                    {qr && token ? (
                      <>
                        <img src={qr} width={220} alt="Signed handover QR" />
                        <label>
                          Share with the named receiver
                          <textarea readOnly value={token} />
                        </label>
                        <button
                          className="quiet"
                          onClick={() =>
                            navigator.clipboard
                              .writeText(token)
                              .then(() => setNotice("Token copied"))
                              .catch(() =>
                                setNotice(
                                  "Select and copy the token manually.",
                                ),
                              )
                          }
                        >
                          Copy token
                        </button>
                      </>
                    ) : (
                      <p>Choose “Show QR” on a pending offer.</p>
                    )}
                    <button className="quiet" onClick={() => speak("receipt")}>
                      🔊 Hear receipt guidance
                    </button>
                    <p>{cfg.guidance?.[lang]?.receipt}</p>
                  </Panel>
                </div>
                <Panel title="Your transactions">
                  {data!.transactions.length === 0 && <p>No handovers yet.</p>}
                  {data!.transactions.map((tx) => (
                    <article className="wf-transaction" key={tx.id}>
                      <h3>{tx.id}</h3>
                      <small>
                        {tx.sender_id} → {tx.receiver_id} · {tx.lot_id}
                      </small>
                      <Badge>{tx.status}</Badge>
                      <Badge>{tx.payment_status}</Badge>
                      <p>
                        Sender {tx.sender_weight_kg} kg
                        {tx.receiver_weight_kg !== undefined
                          ? ` · Receiver ${tx.receiver_weight_kg} kg − ${tx.deduction_kg} kg deduction`
                          : ""}{" "}
                        · {cash(tx.rate)}/kg − {cash(tx.fee)} fee
                      </p>
                      <strong>
                        {cash(tx.final_amount ?? tx.offer_amount)} payable ·{" "}
                        {cash(tx.paid_amount)} received
                      </strong>
                      {tx.price_warning && (
                        <p className="wf-warning">{tx.price_warning}</p>
                      )}
                      <div className="wf-actions wrap">
                        {tx.status === "OFFERED" &&
                          tx.sender_id === user.id && (
                            <>
                              <button onClick={() => setToken(tx.qr_token)}>
                                Show QR
                              </button>
                              <button
                                className="quiet"
                                disabled={busy}
                                onClick={() =>
                                  run(async () => {
                                    const t = await api(
                                      `/transactions/${tx.id}/reissue`,
                                      { version: tx.version },
                                      "POST",
                                    );
                                    setToken(t.qr_token);
                                  }, "QR reissued; old token invalidated")
                                }
                              >
                                Reissue QR
                              </button>
                            </>
                          )}
                        {tx.status === "RECEIVED" &&
                          tx.sender_id === user.id && (
                            <button
                              disabled={busy}
                              onClick={() =>
                                mutate(
                                  `/transactions/${tx.id}/accept`,
                                  { version: tx.version },
                                  "POST",
                                  "Handover accepted",
                                )
                              }
                            >
                              Accept final weight & {cash(tx.final_amount)}
                            </button>
                          )}
                        {tx.status === "CONFIRMED" &&
                          tx.payment_status === "REPORTED" &&
                          tx.sender_id === user.id && (
                            <button
                              disabled={busy}
                              onClick={() =>
                                mutate(
                                  `/transactions/${tx.id}/confirm-payment`,
                                  { version: tx.version },
                                  "POST",
                                  "Payment acknowledged",
                                )
                              }
                            >
                              I received {cash(tx.payment_report.amount)}
                            </button>
                          )}
                        <button
                          className="quiet"
                          onClick={() => receipt(tx.id)}
                        >
                          Download receipt
                        </button>
                        {["OFFERED", "RECEIVED"].includes(tx.status) && (
                          <button
                            className="quiet"
                            disabled={busy}
                            onClick={() =>
                              mutate(
                                `/transactions/${tx.id}/cancel`,
                                { version: tx.version },
                                "POST",
                                "Offer cancelled",
                              )
                            }
                          >
                            Cancel offer
                          </button>
                        )}
                      </div>
                      {tx.status === "CONFIRMED" &&
                        tx.receiver_id === user.id &&
                        !["REPORTED", "PAID"].includes(tx.payment_status) && (
                          <Reveal title="Report a payment">
                            <Form
                              fields={[
                                num(
                                  "amount",
                                  "Amount ₹",
                                  tx.final_amount - tx.paid_amount,
                                  0.01,
                                ),
                                select(
                                  "method",
                                  "Method",
                                  ["CASH", "UPI", "BANK"].map((v) => ({
                                    value: v,
                                    label: v,
                                  })),
                                ),
                                text(
                                  "reference",
                                  "Payment reference / cash receipt",
                                ),
                              ]}
                              submit="Report payment"
                              disabled={busy}
                              onSubmit={(v) =>
                                mutate(
                                  `/transactions/${tx.id}/report-payment`,
                                  { ...v, version: tx.version },
                                  "POST",
                                  "Payment reported; seller must confirm",
                                )
                              }
                            />
                          </Reveal>
                        )}
                      {!["DISPUTED", "CANCELLED"].includes(tx.status) && (
                        <Reveal title="Raise a dispute">
                          <Form
                            fields={[text("reason", "Explain the discrepancy")]}
                            submit="Record dispute"
                            disabled={busy}
                            onSubmit={(v) =>
                              mutate(
                                `/transactions/${tx.id}/dispute`,
                                { ...v, version: tx.version },
                                "POST",
                                "Dispute recorded; processing paused",
                              )
                            }
                          />
                        </Reveal>
                      )}
                      {tx.dispute_reason && (
                        <p className="wf-warning">
                          Dispute: {tx.dispute_reason}
                        </p>
                      )}
                    </article>
                  ))}
                </Panel>
              </>
            )}
            {tab === "Partners" && (
              <div className="wf-columns">
                <Panel title="Partners & reference prices">
                  <Form
                    fields={[
                      materialField,
                      num("weight_kg", "Lot weight kg", 10),
                      num("latitude", "Your latitude", 28.61, -90),
                      num("longitude", "Your longitude", 77.21, -180),
                    ]}
                    submit="Find eligible nearby buyers"
                    disabled={busy}
                    onSubmit={(v) =>
                      run(
                        async () =>
                          setMatches(
                            await api(
                              "/partners?" +
                                new URLSearchParams(
                                  Object.entries(v).map(([k, x]) => [
                                    k,
                                    String(x),
                                  ]),
                                ),
                            ),
                          ),
                        "Matches use straight-line distance",
                      )
                    }
                  />
                  {matches && (
                    <div>
                      {matches.length === 0 ? (
                        <p>
                          No eligible buyers match this material and quantity.
                        </p>
                      ) : (
                        matches.map((f) => (
                          <p key={f.id}>
                            <strong>{f.name}</strong> · {f.distance_km} km ·{" "}
                            {f.distance_basis}
                            {f.is_demo ? " · Demo" : ""}
                          </p>
                        ))
                      )}
                    </div>
                  )}
                  <p>
                    Match accepted materials, permit validity, minimum lot size,
                    and pickup availability. Demo facilities are not real
                    authorized recyclers.
                  </p>
                  {data!.facilities.map((f) => (
                    <article key={f.id} className="wf-transaction">
                      <h3>{f.name}</h3>
                      <Badge>
                        {f.is_demo
                          ? "DEMO FACILITY"
                          : f.eligible_now
                            ? "Reviewed permit"
                            : "Unverified / expired"}
                      </Badge>
                      <p>
                        {f.accepted_materials.join(", ")} · minimum{" "}
                        {f.minimum_kg} kg ·{" "}
                        {f.pickup_available ? "Pickup available" : "Drop-off"}
                      </p>
                      <small>
                        Permit: {f.permit_number || "Not supplied"} · expires{" "}
                        {time(f.permit_expires)}
                      </small>
                      <small>Source: {f.permit_source}</small>
                      {Object.entries(f.offered_rates || {}).map(([k, v]) => (
                        <p key={k}>
                          {k}: {cash(Number(v))}/kg
                        </p>
                      ))}
                    </article>
                  ))}
                  <h3>Indicative reference board</h3>
                  {data!.materials.map((m) => (
                    <div className="wf-row" key={m.id}>
                      <div>
                        <strong>{m.name}</strong>
                        <small>{m.grade}</small>
                        <small>
                          {m.reference
                            ? `${m.reference.source} · ${time(m.reference.observed_at)}`
                            : "Illustrative demo rate—not live market data"}
                        </small>
                      </div>
                      <strong>
                        {m.reference_rate
                          ? `${cash(m.reference_rate)}/kg`
                          : "Inspection needed"}
                      </strong>
                    </div>
                  ))}
                </Panel>
                <Panel title="Facility details">
                  {["vendor", "recycler"].includes(user.role) ? (
                    <>
                      <Form
                        fields={[
                          text("name", "Facility name"),
                          text(
                            "materials",
                            "Accepted material IDs, comma-separated",
                            "copper,aluminium,pet,steel",
                          ),
                          {
                            ...text(
                              "rates",
                              "Offered rates, e.g. copper:700,pet:30",
                            ),
                            optional: true,
                          },
                          num("minimum_kg", "Minimum lot kg"),
                          num("latitude", "Latitude", 28.62, -90),
                          num("longitude", "Longitude", 77.22, -180),
                          select("pickup", "Pickup available", [
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                          ]),
                          text("permit_number", "Permit number"),
                          text(
                            "permit_source",
                            "Permit evidence source / registry URL",
                          ),
                          {
                            name: "expiry",
                            label: "Permit expires",
                            type: "date",
                          },
                        ]}
                        submit="Submit facility for review"
                        disabled={busy}
                        onSubmit={(v) =>
                          mutate(
                            "/facility",
                            {
                              name: v.name,
                              accepted_materials: v.materials
                                .split(",")
                                .map((s: string) => s.trim()),
                              offered_rates: Object.fromEntries(
                                String(v.rates || "")
                                  .split(",")
                                  .filter(Boolean)
                                  .map((s) => {
                                    const [k, r] = s.split(":");
                                    return [k.trim(), Number(r)];
                                  }),
                              ),
                              minimum_kg: v.minimum_kg,
                              latitude: v.latitude,
                              longitude: v.longitude,
                              pickup_available: v.pickup === "yes",
                              permit_number: v.permit_number,
                              permit_source: v.permit_source,
                              permit_expires: new Date(v.expiry).toISOString(),
                            },
                            "PUT",
                            "Facility submitted; administrator review required",
                          )
                        }
                      />
                      <small>
                        Changing these details invalidates previous
                        verification.
                      </small>
                    </>
                  ) : (
                    <p>
                      Recycler and vendor accounts can maintain their facility
                      here.
                    </p>
                  )}
                </Panel>
              </div>
            )}
            {tab === "Pickups" && (
              <div className="wf-columns">
                <Panel title="Request pickup">
                  <Form
                    fields={[
                      select(
                        "lot_id",
                        "Available lot",
                        available.map((l) => ({ value: l.id, label: l.title })),
                      ),
                      select(
                        "buyer_id",
                        "Buyer",
                        data!.facilities
                          .filter((f) => f.pickup_available && f.eligible_now)
                          .map((f) => ({ value: f.id, label: f.name })),
                      ),
                      text(
                        "requested_window",
                        "Preferred time window",
                        "Tomorrow 10am–12pm",
                      ),
                    ]}
                    submit="Request pickup"
                    disabled={busy}
                    onSubmit={(v) =>
                      mutate("/pickups", v, "POST", "Pickup requested")
                    }
                  />
                </Panel>
                <Panel title="Pickup queue">
                  <p>
                    Compatible loads can be grouped operationally. Each handover
                    still needs confirmation.
                  </p>
                  {data!.pickups.map((p) => (
                    <article className="wf-transaction" key={p.id}>
                      <strong>
                        {p.material_id} · {p.weight_kg} kg
                      </strong>
                      <p>{p.requested_window}</p>
                      <Badge>{p.status}</Badge>
                      <div className="wf-actions">
                        {p.buyer_id === user.id &&
                          ["REQUESTED", "ACCEPTED"].includes(p.status) && (
                            <button
                              disabled={busy}
                              onClick={() =>
                                mutate(`/pickups/${p.id}`, {
                                  status:
                                    p.status === "REQUESTED"
                                      ? "ACCEPTED"
                                      : "COMPLETED",
                                })
                              }
                            >
                              {p.status === "REQUESTED"
                                ? "Accept pickup"
                                : "Mark collected"}
                            </button>
                          )}
                        {["REQUESTED", "ACCEPTED"].includes(p.status) && (
                          <button
                            className="quiet"
                            onClick={() =>
                              mutate(`/pickups/${p.id}`, {
                                status: "CANCELLED",
                              })
                            }
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </Panel>
              </div>
            )}
            {tab === "Impact" && (
              <Panel title="Waste & energy impact">
                <p>{impact?.notice}</p>
                {["recorded", "demo"].map((kind) => (
                  <div key={kind}>
                    <h3>
                      {kind === "demo"
                        ? "Demo material — excluded from recorded totals"
                        : "Recorded material"}
                    </h3>
                    <div className="wf-metrics">
                      {[
                        ["Collected kg", "collected_kg"],
                        ["Recovered kg", "recovered_kg"],
                        ["Residue kg", "residue_kg"],
                        ["Estimated avoided kWh", "estimated_energy_kwh"],
                      ].map(([label, key]) => (
                        <article key={key}>
                          <small>{label}</small>
                          <strong>
                            {impact?.[kind]?.[key] ?? "Not estimated"}
                          </strong>
                        </article>
                      ))}
                    </div>
                    <p>
                      {impact?.[kind]?.outcomes_without_factor || 0} recovery
                      records have no energy factor.
                    </p>
                  </div>
                ))}
                <p>{impact?.method}</p>
                <h3>Configured factor sources</h3>
                {data!.factors.length === 0 ? (
                  <p>No factors entered; energy savings remain unestimated.</p>
                ) : (
                  data!.factors.map((f) => (
                    <article className="wf-transaction" key={f.material_id}>
                      <strong>
                        {f.material_id} · version {f.version}
                      </strong>
                      <p>
                        {f.source} · {f.geography}, {f.year}
                      </p>
                      <p>
                        Boundary: {f.boundary}. Uncertainty: {f.uncertainty}
                      </p>
                    </article>
                  ))
                )}
              </Panel>
            )}
            {tab === "Admin" && user.role === "admin" && (
              <div className="wf-columns">
                <Panel title="Review & reference data">
                  {data!.transactions
                    .filter((t) => t.status === "DISPUTED")
                    .map((t) => (
                      <article key={t.id}>
                        <h3>Dispute {t.id}</h3>
                        <p>{t.dispute_reason}</p>
                        <Form
                          fields={[
                            text(
                              "notes",
                              "Document agreed resolution before resuming",
                            ),
                          ]}
                          submit="Resume previous workflow"
                          disabled={busy}
                          onSubmit={(v) =>
                            mutate(`/transactions/${t.id}/resolve`, {
                              ...v,
                              version: t.version,
                            })
                          }
                        />
                      </article>
                    ))}
                  {data!.lots
                    .filter((l) => l.status === "REVIEW_REQUIRED")
                    .map((l) => (
                      <article className="wf-transaction" key={l.id}>
                        <h3>
                          {l.title} · {l.original_weight_kg} kg
                        </h3>
                        <small>{l.id}</small>
                        <Form
                          fields={[
                            text("notes", "Physical inspection findings"),
                            select("decision", "Decision", [
                              {
                                value: "approve",
                                label: "Approve for appropriate facility",
                              },
                              { value: "reject", label: "Reject" },
                            ]),
                          ]}
                          submit="Record review"
                          disabled={busy}
                          onSubmit={(v) =>
                            mutate(`/lots/${l.id}/review`, {
                              version: l.version,
                              approved: v.decision === "approve",
                              notes: v.notes,
                            })
                          }
                        />
                      </article>
                    ))}
                  <Reveal title="Review facility permits">
                    {data!.facilities.map((f) => (
                      <article key={f.id}>
                        <h3>{f.name}</h3>
                        <small>
                          {f.permit_number} · {f.permit_source}
                        </small>
                        <Form
                          fields={[
                            text("notes", "Evidence checked / review notes"),
                            select("decision", "Decision", [
                              {
                                value: "verify",
                                label: "Verify supplied evidence",
                              },
                              { value: "suspend", label: "Suspend" },
                            ]),
                          ]}
                          submit="Save verification"
                          disabled={busy}
                          onSubmit={(v) =>
                            mutate(`/facilities/${f.id}/verify`, {
                              verified: v.decision === "verify",
                              notes: v.notes,
                            })
                          }
                        />
                      </article>
                    ))}
                  </Reveal>
                  <Reveal title="Update a sourced reference price">
                    <Form
                      fields={[
                        materialField,
                        num("rate", "Reference ₹/kg", 100, 0.01),
                        text("source", "Source / evidence"),
                        {
                          name: "observed_at",
                          label: "Observed at",
                          type: "datetime-local",
                        },
                      ]}
                      submit="Save price"
                      disabled={busy}
                      onSubmit={(v) =>
                        mutate(
                          `/prices/${v.material_id}`,
                          {
                            rate: v.rate,
                            source: v.source,
                            observed_at: new Date(v.observed_at).toISOString(),
                          },
                          "PUT",
                        )
                      }
                    />
                  </Reveal>
                  <Reveal title="Add a documented energy factor">
                    <Form
                      fields={[
                        materialField,
                        num("virgin_kwh_per_kg", "Virgin production kWh/kg"),
                        num(
                          "secondary_kwh_per_kg",
                          "Secondary production kWh/kg",
                        ),
                        text("source", "Published source URL / citation"),
                        text("geography", "Applicable geography"),
                        num("year", "Publication year", 2026, 1990),
                        text(
                          "boundary",
                          "Lifecycle boundary, including transport assumptions",
                        ),
                        text("uncertainty", "Uncertainty / limitations"),
                      ]}
                      submit="Save factor version"
                      disabled={busy}
                      onSubmit={(v) => mutate("/impact/factors", v, "PUT")}
                    />
                  </Reveal>
                </Panel>
                <Panel title="Fleet extension">
                  <p>
                    Simulated readings remain labeled. With IoT configured they
                    pass through AWS before appearing here.
                  </p>
                  <Form
                    fields={[
                      text("bin_id", "Bin ID", "DEMO-BIN-1"),
                      materialField,
                      num("latitude", "Latitude", 28.63, -90),
                      num("longitude", "Longitude", 77.23, -180),
                      num("capacity_kg", "Bin capacity kg", 100, 1),
                      num("weight_kg", "Measured kg", 85),
                      num("fill_pct", "Fill percentage", 85),
                    ]}
                    submit="Publish simulated reading"
                    disabled={busy}
                    onSubmit={(v) =>
                      mutate("/fleet/simulate", {
                        ...v,
                        timestamp: new Date().toISOString(),
                        simulated: true,
                      })
                    }
                  />
                  <h3>Recent bins</h3>
                  {data!.bins.map((b) => (
                    <p key={b.bin_id}>
                      {b.bin_id} · {b.weight_kg} kg · {b.fill_pct}% ·{" "}
                      {b.simulated ? "Simulated" : "Device reported"}
                    </p>
                  ))}
                  <Form
                    fields={[
                      materialField,
                      num("capacity_kg", "Vehicle capacity kg", 350, 1),
                      num(
                        "vehicle_kwh_per_km",
                        "Vehicle energy assumption kWh/km",
                        0.2,
                        0.001,
                      ),
                    ]}
                    submit="Plan collection trips"
                    disabled={busy}
                    onSubmit={(v) =>
                      run(
                        async () =>
                          setRoute(await api("/fleet/route", v, "POST")),
                        "Route calculated",
                      )
                    }
                  />
                  {route && (
                    <div className="wf-result">
                      <Badge>{route.mode}</Badge>
                      <p>
                        {route.baseline_km} km baseline → {route.planned_km} km
                        planned
                      </p>
                      <p>
                        {route.estimated_energy_avoided_kwh} kWh estimated
                        avoided
                      </p>
                      {route.trips.map((t: RecordData, i: number) => (
                        <p key={i}>
                          Trip {i + 1}: depot → {t.bin_ids.join(" → ")} → depot
                          · {t.load_kg} kg
                        </p>
                      ))}
                      <small>{route.notice}</small>
                    </div>
                  )}
                </Panel>
              </div>
            )}
          </>
        )}
        <footer className="wf-footer">
          <span>ScrapSetu · Waste and Energy</span>
          <span>
            {cfg.store === "dynamodb"
              ? "AWS data storage"
              : "Persistent local storage"}{" "}
            · Party-acknowledged payments · No official EPR certificates
          </span>
        </footer>
      </main>
      {busy && (
        <div className="wf-working" role="status">
          Working…
        </div>
      )}
    </div>
  );
}
export default App;
