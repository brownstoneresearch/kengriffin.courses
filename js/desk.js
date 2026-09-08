const WEEKS = [
  { n:1, key:"structure", title:"What a market is", drill:"One-page map of one market", note:"/notes/structure/" },
  { n:2, key:"participants", title:"Participants", drill:"Other-side memo, 200 words", note:"/the-market/" },
  { n:3, key:"instruments", title:"Instruments", drill:"Instrument card for one contract", note:"/the-market/" },
  { n:4, key:"book", title:"The book", drill:"Annotated book snapshot", note:"/notes/liquidity/" },
  { n:5, key:"liquidity", title:"Liquidity", drill:"Liquidity scorecard", note:"/notes/liquidity/" },
  { n:6, key:"risk", title:"Risk", drill:"Loss sheet in named units", note:"/notes/risk/" },
  { n:7, key:"information", title:"Information", drill:"One-page decision memo", note:"/notes/memo/" },
  { n:8, key:"plumbing", title:"Plumbing", drill:"Settlement path, one name", note:"/notes/plumbing/" }
];

function deskKey(email){ return "kcga.desk." + String(email||"anon").toLowerCase(); }
function loadDesk(email){
  try { return JSON.parse(localStorage.getItem(deskKey(email)) || "null") || seedDesk(); }
  catch { return seedDesk(); }
}
function seedDesk(){
  return { week:1, done:{}, memos:[], five:{}, hours:"", seen:[] };
}
function saveDesk(email, d){ localStorage.setItem(deskKey(email), JSON.stringify(d)); }

function priorityTasks(d){
  const w = WEEKS[(d.week||1)-1] || WEEKS[0];
  const tasks = [];
  if (!d.done[w.key]) tasks.push({ id:"week-"+w.key, pri:1, title:"Complete Week "+w.n+" drill", body:w.drill, href:"#binder" });
  const fiveFilled = Object.values(d.five||{}).filter(Boolean).length;
  if (fiveFilled < 5) tasks.push({ id:"five", pri:1, title:"Finish the five-line bar", body:fiveFilled+"/5 lines written", href:"#five" });
  if (!(d.memos||[]).length) tasks.push({ id:"memo1", pri:2, title:"File first memo in the binder", body:"A decision is not finished until it is saved.", href:"#binder" });
  return tasks.sort((a,b)=>a.pri-b.pri);
}

function notifyComplete(email, taskId, title){
  const d = loadDesk(email);
  d.seen = d.seen || [];
  const id = "done-"+taskId+"-"+Date.now();
  d.seen.unshift({ id, title: title || "Priority task completed", at: new Date().toISOString(), kind:"done" });
  d.seen = d.seen.slice(0, 30);
  saveDesk(email, d);
  return d;
}

function generatePassword(){
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  let s = "KCGA-";
  for (const n of buf) s += alphabet[n % alphabet.length];
  return s;
}
