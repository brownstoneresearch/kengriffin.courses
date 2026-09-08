const INSIGHTS = "kcga.insights.v1";

function loadInsights() {
  try { return JSON.parse(localStorage.getItem(INSIGHTS) || "[]"); }
  catch { return []; }
}
function saveInsights(rows) {
  localStorage.setItem(INSIGHTS, JSON.stringify(rows));
}
function publishInsight({ title, layer, body, author }) {
  const titleC = String(title || "").trim();
  const bodyC = String(body || "").trim();
  if (!titleC || !bodyC) throw new Error("Title and body are required.");
  const row = {
    id: "in_" + Date.now().toString(36),
    title: titleC,
    layer: String(layer || "The market"),
    body: bodyC,
    author: author || "Desk",
    at: new Date().toISOString()
  };
  const all = loadInsights();
  all.unshift(row);
  saveInsights(all.slice(0, 80));
  return row;
}
function removeInsight(id) {
  saveInsights(loadInsights().filter(x => x.id !== id));
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
