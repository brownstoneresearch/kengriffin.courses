import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM = Deno.env.get("RESEND_FROM") || "Ken Cordele Griffin Academy <admissions@kengriffin.courses>";
const PORTAL = Deno.env.get("PORTAL_URL") || "https://kengriffin.courses/login/";
const SITE = "https://kengriffin.courses";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function esc(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(inner: string, preheader: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>Ken Cordele Griffin Academy</title>
</head>
<body style="margin:0;padding:0;background:#070e1a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070e1a;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0c1628;border:1px solid rgba(196,163,90,.28);">
          <tr>
            <td style="padding:28px 36px 18px;border-bottom:1px solid rgba(196,163,90,.22);">
              <p style="margin:0;font-family:Georgia,serif;font-size:11px;letter-spacing:.28em;color:#c4a35a;">KEN CORDELE GRIFFIN</p>
              <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:20px;color:#f1ece1;">Academy</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px 12px;font-family:Georgia,serif;color:#f1ece1;font-size:16px;line-height:1.65;">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 28px;">
              <a href="${SITE}/desk/" style="display:inline-block;background:#c4a35a;color:#081018;text-decoration:none;font-family:Georgia,serif;font-size:13px;letter-spacing:.16em;padding:12px 18px;">ENTER THE DESK</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px 28px;border-top:1px solid rgba(196,163,90,.22);font-family:Georgia,serif;font-size:11px;line-height:1.55;color:#8a97a8;">
              Independent educational brand. Not affiliated with, endorsed by, or part of Citadel LLC or Citadel Securities. Nothing in this message is investment, trading, or employment advice.<br />
              <a href="${SITE}" style="color:#c4a35a;text-decoration:none;">kengriffin.courses</a>
              · admissions@kengriffin.courses
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function inviteHtml(p: Record<string, string>) {
  return layout(
    `<p style="margin:0 0 8px;font-size:12px;letter-spacing:.22em;color:#c4a35a;">PORTAL PROFILE ISSUED</p>
     <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;font-weight:normal;">Hello ${esc(p.name || "participant")}.</h1>
     <p style="margin:0 0 16px;color:#d5deea;">An administrator has issued your desk profile. There is no public registration. Sign in with the credentials below. The password is shown once.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#081421;border:1px solid rgba(196,163,90,.22);">
       <tr><td style="padding:14px 16px;font-size:13px;color:#8a97a8;">Track</td><td style="padding:14px 16px;color:#e2c888;">${esc(p.track || "Foundations of the Market")}</td></tr>
       <tr><td style="padding:14px 16px;font-size:13px;color:#8a97a8;border-top:1px solid rgba(196,163,90,.16);">Email</td><td style="padding:14px 16px;color:#f1ece1;border-top:1px solid rgba(196,163,90,.16);">${esc(p.email)}</td></tr>
       <tr><td style="padding:14px 16px;font-size:13px;color:#8a97a8;border-top:1px solid rgba(196,163,90,.16);">Password</td><td style="padding:14px 16px;font-family:ui-monospace,monospace;color:#e2c888;border-top:1px solid rgba(196,163,90,.16);">${esc(p.password)}</td></tr>
     </table>
     <p style="margin:18px 0 0;color:#d5deea;">Sign in at <a href="${esc(p.portal || PORTAL)}" style="color:#e2c888;">${esc(p.portal || PORTAL)}</a></p>`,
    "Your Ken Cordele Griffin Academy desk profile has been issued."
  );
}

function noticeHtml(p: Record<string, string>) {
  return layout(
    `<p style="margin:0 0 8px;font-size:12px;letter-spacing:.22em;color:#c4a35a;">DESK NOTICE</p>
     <h1 style="margin:0 0 16px;font-size:24px;font-weight:normal;">${esc(p.heading || "A note from the desk")}</h1>
     <p style="margin:0;color:#d5deea;white-space:pre-wrap;">${esc(p.message || "")}</p>`,
    p.heading || "A note from Ken Cordele Griffin Academy"
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST only" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    if (!RESEND_API_KEY.startsWith("re_")) throw new Error("RESEND_API_KEY is not set on the function");
    const body = await req.json();
    const email = String(body.email || body.to || "").trim().toLowerCase();
    if (!email || !email.includes("@")) throw new Error("A valid email is required");

    const kind = String(body.template || body.kind || "invite").toLowerCase();
    const name = String(body.name || "");
    const track = String(body.track || "Foundations of the Market");
    const password = String(body.password || "");
    const portal = String(body.portal || PORTAL);

    let subject = String(body.subject || "");
    let html = "";
    let text = "";

    if (kind === "notice") {
      subject = subject || "Desk notice — Ken Cordele Griffin Academy";
      html = noticeHtml({ heading: body.heading, message: body.message, name });
      text = `${body.heading || "Desk notice"}\n\n${body.message || ""}\n\n${SITE}`;
    } else {
      if (!password) throw new Error("password is required for the invite template");
      subject = subject || "Your Ken Cordele Griffin Academy portal profile";
      html = inviteHtml({ name, email, password, track, portal });
      text = [
        `Hello ${name || "participant"},`,
        "",
        "An administrator issued your academy portal profile.",
        `Track: ${track}`,
        `Sign in: ${portal}`,
        `Email: ${email}`,
        `Temporary password: ${password}`,
        "",
        "Independent educational brand. Not affiliated with Citadel LLC or Citadel Securities. Not investment advice.",
      ].join("\n");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject,
        html,
        text,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Resend refused the send");
    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String((err as Error).message || err) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
