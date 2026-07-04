// ============================================================
// Minimal Supabase REST client — no SDK / no build step needed.
// Talks directly to Supabase's auto-generated REST (PostgREST)
// and Auth endpoints using fetch().
// ============================================================

const AUTH_STORAGE_KEY = "woodhub_session";

const SupaLite = {
  session: null,

  init() {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      try {
        this.session = JSON.parse(raw);
      } catch (e) {
        this.session = null;
      }
    }
  },

  isLoggedIn() {
    return !!(this.session && this.session.access_token);
  },

  async login(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.msg || "Login failed");
    }
    this.session = data;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    return data;
  },

  logout() {
    this.session = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  authHeaders() {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${this.session ? this.session.access_token : SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    };
  },

  async request(path, { method = "GET", body, headers = {} } = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: { ...this.authHeaders(), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      this.logout();
      throw new Error("Session expired. Please log in again.");
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed (${res.status}): ${text}`);
    }
    if (res.status === 204) return null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return res.json();
    return null;
  },

  // --- table helpers -------------------------------------------------

  async list(table, { filters = "", order = "" } = {}) {
    let path = `${table}?select=*`;
    if (filters) path += `&${filters}`;
    if (order) path += `&order=${order}`;
    return this.request(path);
  },

  async insert(table, row) {
    return this.request(table, {
      method: "POST",
      body: row,
      headers: { Prefer: "return=representation" },
    });
  },

  async update(table, id, row) {
    return this.request(`${table}?id=eq.${id}`, {
      method: "PATCH",
      body: row,
      headers: { Prefer: "return=representation" },
    });
  },

  async remove(table, id) {
    return this.request(`${table}?id=eq.${id}`, { method: "DELETE" });
  },
};

SupaLite.init();
