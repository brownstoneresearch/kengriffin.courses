import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "re_HtWXnSnA_LN2StbiTEg5SEhYGAAaddrA5";
const FROM = Deno.env.get("RESEND_FROM") || "Ken Cordele Griffin Academy <admissions@kengriffin.courses>";
const PORTAL = Deno.env.get("PORTAL_URL") || "https://kengriffin.courses/login.html";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST only" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
  }
  try {
    const { name, email, password, track } = await req.json();
    if (!email || !password) throw new Error("email and password required");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: "Your Ken Cordele Griffin Academy portal profile",
        text: [
          `Hello ${name || ""},`,
          "",
          "An administrator issued your academy portal profile.",
          `Track: ${track || "Foundations of the Market"}`,
          `Sign in: ${PORTAL}`,
          `Email: ${email}`,
          `Temporary password: ${password}`,
          "",
          "Independent educational brand. Not affiliated with Citadel LLC or Citadel Securities. Not investment advice."
        ].join("\n")
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Resend refused the send");
    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err.message || err) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
});
