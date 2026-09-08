const INSIGHTS = "kcga.insights.v1";

function mapInsight(row) {
  return {
    id: row.id,
    title: row.title,
    layer: row.layer,
    body: row.body,
    author: row.author,
    at: row.at || row.created_at
  };
}

function cacheInsights(rows) {
  localStorage.setItem(INSIGHTS, JSON.stringify(rows));
}
function cachedInsights() {
  try { return JSON.parse(localStorage.getItem(INSIGHTS) || "[]"); }
  catch { return []; }
}

async function loadInsights() {
  const client = typeof db === "function" ? db() : null;
  if (client) {
    const { data, error } = await client
      .from("insights")
      .select("id,title,layer,body,author,created_at")
      .order("created_at", { ascending: false })
      .limit(80);
    if (!error && data) {
      const rows = data.map(r => mapInsight({ ...r, at: r.created_at }));
      cacheInsights(rows);
      return rows;
    }
  }
  return cachedInsights();
}

async function publishInsight({ title, layer, body, author }) {
  const titleC = String(title || "").trim();
  const bodyC = String(body || "").trim();
  if (!titleC || !bodyC) throw new Error("Title and body are required.");
  const payload = {
    title: titleC,
    layer: String(layer || "The market"),
    body: bodyC,
    author: author || "Desk"
  };
  const client = typeof db === "function" ? db() : null;
  if (client) {
    const { data, error } = await client.from("insights").insert(payload).select().single();
    if (error) throw new Error(error.message);
    const row = mapInsight({ ...data, at: data.created_at });
    cacheInsights([row, ...cachedInsights().filter(x => x.id !== row.id)]);
    return row;
  }
  const row = { id: "in_" + Date.now().toString(36), ...payload, at: new Date().toISOString() };
  cacheInsights([row, ...cachedInsights()].slice(0, 80));
  return row;
}

async function removeInsight(id) {
  const client = typeof db === "function" ? db() : null;
  if (client) {
    const { error } = await client.from("insights").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
  cacheInsights(cachedInsights().filter(x => x.id !== id));
}

const HANDOUTS = [
  { file: "kcga-market-map.pdf", title: "The Market Map", blurb: "The eight layers on one sheet." },
  { file: "kcga-one-page-memo.pdf", title: "The One-Page Memo", blurb: "Five-line decision standard." },
  { file: "kcga-risk-inventory.pdf", title: "Risk Inventory", blurb: "Loss named before thesis." },
  { file: "kcga-liquidity-scorecard.pdf", title: "Liquidity Scorecard", blurb: "Tightness, depth, immediacy, resilience." },
  { file: "kcga-other-side.pdf", title: "The Other Side", blurb: "Edge as a falsifiable claim." },
  { file: "kcga-plumbing.pdf", title: "Plumbing", blurb: "From print to cash." },
  { file: "kcga-foundations-syllabus.pdf", title: "Foundations Syllabus", blurb: "Eight weeks, deliverables." },
  { file: "kcga-conduct.pdf", title: "Conduct of the Desk", blurb: "How the academy is run." }
];
