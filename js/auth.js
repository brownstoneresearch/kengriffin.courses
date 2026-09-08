const STORE = "kcga.users.v1";
const SESSION = "kcga.session.v1";
const ADMIN_EMAILS = ["ceo@kengriffin.courses", "admissions@kengriffin.courses"];

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email || "").trim().toLowerCase());
}
function roleForEmail(email, requested) {
  return isAdminEmail(email) ? "admin" : "participant";
}

let sb = null;
function supabaseReady() {
  return !!(window.supabase && window.KCGA && window.KCGA.SUPABASE_ANON_KEY);
}
function db() {
  if (!sb && supabaseReady()) {
    sb = window.supabase.createClient(window.KCGA.SUPABASE_URL, window.KCGA.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
  return sb;
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(STORE) || "[]"); }
  catch { return []; }
}
function saveUsers(users) { localStorage.setItem(STORE, JSON.stringify(users)); }
function session() {
  try { return JSON.parse(localStorage.getItem(SESSION) || "null"); }
  catch { return null; }
}
function setSession(user) {
  const slim = { id: user.id, email: user.email, name: user.name, role: user.role, track: user.track };
  localStorage.setItem(SESSION, JSON.stringify(slim));
  return slim;
}
function clearSession() { localStorage.removeItem(SESSION); }

function uid() {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

async function sha(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function profileFromAuthUser(authUser, extra = {}) {
  const meta = authUser.user_metadata || {};
  return {
    id: authUser.id,
    email: authUser.email,
    name: extra.name || meta.name || authUser.email,
    role: roleForEmail(authUser.email, extra.role || meta.role),
    track: extra.track || meta.track || "Foundations of the Market",
    active: extra.active !== false
  };
}

async function upsertProfile(row) {
  const client = db();
  if (!client) return;
  const { error } = await client.from("profiles").upsert({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    track: row.track,
    active: row.active !== false,
    created_by: row.createdBy || null
  });
  if (error) console.warn("profiles upsert:", error.message);
}

async function createUser({ name, email, password, role, track, createdBy }) {
  email = (email || "").trim().toLowerCase();
  if (!name || !email || !password) throw new Error("Name, email, and password are required.");
  role = roleForEmail(email, role);
  track = track || "Foundations of the Market";

  const client = db();
  if (client) {
    const issuer = window.supabase.createClient(window.KCGA.SUPABASE_URL, window.KCGA.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data, error } = await issuer.auth.signUp({
      email,
      password,
      options: { data: { name, role, track }, emailRedirectTo: undefined }
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Supabase did not return a user. Disable Confirm email in Auth settings.");
    const user = await profileFromAuthUser(data.user, { name, role, track, createdBy });
    await upsertProfile({ ...user, createdBy });
    const local = loadUsers().filter(u => u.email !== email);
    local.push({ ...user, createdAt: new Date().toISOString(), createdBy });
    saveUsers(local);
    return user;
  }

  if (loadUsers().some(u => u.email === email)) throw new Error("A profile with that email already exists.");
  const user = {
    id: uid(), name: name.trim(), email, hash: await sha(password),
    role, track, active: true, createdAt: new Date().toISOString(), createdBy: createdBy || "system"
  };
  const users = loadUsers(); users.push(user); saveUsers(users);
  return user;
}

async function login(email, password) {
  email = (email || "").trim().toLowerCase();
  const client = db();
  if (client) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    let extra = {};
    const { data: prof } = await client.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    if (prof) {
      if (prof.active === false) throw new Error("This profile is inactive.");
      extra = prof;
    }
    const user = await profileFromAuthUser(data.user, extra);
    user.role = roleForEmail(user.email, user.role);
    return setSession(user);
  }
  const user = loadUsers().find(u => u.email === email);
  if (!user || !user.active) throw new Error("No active profile for that email.");
  if (user.hash !== await sha(password)) throw new Error("Password does not match.");
  return setSession(user);
}

async function logoutRemote() {
  try { if (db()) await db().auth.signOut(); } catch {}
  clearSession();
}

function requireAuth(role) {
  const s = session();
  if (!s) { location.href = "/login/"; return null; }
  if (role && s.role !== role) {
    location.href = s.role === "admin" ? "/desk/admin/" : "/desk/";
    return null;
  }
  return s;
}

async function hasAdmin() {
  return true;
}

async function listProfiles() {
  const client = db();
  if (client) {
    const { data, error } = await client.from("profiles").select("*").order("created_at", { ascending: false });
    if (!error && data) return data.map(p => ({
      id: p.id, name: p.name, email: p.email, role: p.role, track: p.track,
      active: p.active !== false, week: p.week, notes: p.admin_notes, created_at: p.created_at
    }));
  }
  return loadUsers();
}

async function setActive(id, active) {
  const client = db();
  if (client) await client.from("profiles").update({ active }).eq("id", id);
  const all = loadUsers();
  const t = all.find(x => x.id === id);
  if (t) { t.active = active; saveUsers(all); }
}

async function updateProfile(id, fields) {
  const client = db();
  const patch = {};
  if (fields.name != null) patch.name = fields.name;
  if (fields.track != null) patch.track = fields.track;
  if (fields.week != null) patch.week = fields.week;
  if (fields.notes != null) patch.admin_notes = fields.notes;
  if (fields.active != null) patch.active = fields.active;
  if (client && Object.keys(patch).length) await client.from("profiles").update(patch).eq("id", id);
  const all = loadUsers();
  const t = all.find(x => x.id === id);
  if (t) { Object.assign(t, fields); saveUsers(all); }
  const s = session();
  if (s && s.id === id) setSession({ ...s, ...fields });
}

async function changePassword(currentPassword, nextPassword) {
  if (!nextPassword || nextPassword.length < 8) throw new Error("New password must be at least 8 characters.");
  const s = session();
  if (!s) throw new Error("Sign in first.");
  const client = db();
  if (client) {
    const { error } = await client.auth.updateUser({ password: nextPassword });
    if (error) throw new Error(error.message);
    return true;
  }
  const all = loadUsers();
  const t = all.find(x => x.email === s.email);
  if (!t) throw new Error("Profile not found.");
  if (t.hash && t.hash !== await sha(currentPassword)) throw new Error("Current password does not match.");
  t.hash = await sha(nextPassword);
  saveUsers(all);
  return true;
}

async function resetLocalPassword(id, nextPassword) {
  const all = loadUsers();
  const t = all.find(x => x.id === id);
  if (t) { t.hash = await sha(nextPassword); saveUsers(all); }
  return nextPassword;
}
