async function sendInviteMail(payload) {
  const cfg = window.KCGA || {};
  const body = JSON.stringify({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    track: payload.track
  });

  if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY) {
    const r = await fetch(cfg.SUPABASE_URL + "/functions/v1/send-invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY,
        apikey: cfg.SUPABASE_ANON_KEY
      },
      body
    });
    const text = await r.text();
    let j = {};
    try { j = JSON.parse(text); } catch { j = { error: text }; }
    if (r.ok && j.ok) return { ok: true, via: "supabase", id: j.id };
    if (r.status !== 404) return { ok: false, error: j.error || j.message || text || "function error" };
  }

  try {
    const r = await fetch("/api/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    const j = await r.json();
    if (j.ok) return { ok: true, via: "local", id: j.id };
    return { ok: false, error: j.error || "local mail failed" };
  } catch (e) {
    return {
      ok: false,
      error: "Mail function not deployed. In Supabase: Edge Functions → deploy send-invite. Or run: node server/mail.js"
    };
  }
}
