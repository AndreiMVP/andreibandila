"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

type Collection = "albums" | "films" | "journal" | "settings";

type ContentEntry = {
  id: string;
  collection: Collection;
  slug: string;
  sort_order: number;
  data: unknown;
  updated_at: string;
};

const collections: { id: Collection; label: string }[] = [
  { id: "albums", label: "Albume" },
  { id: "films", label: "Filme" },
  { id: "journal", label: "Jurnal" },
  { id: "settings", label: "Setări" },
];

export default function AdminClient() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collection, setCollection] = useState<Collection>("albums");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [json, setJson] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const selected = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId],
  );

  useEffect(() => {
    try {
      const client = createSupabaseBrowserClient();
      setSupabase(client);
      client.auth.getSession().then(({ data }) => setSession(data.session));
      const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      });
      return () => data.subscription.unsubscribe();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Supabase is not configured");
    }
  }, []);

  useEffect(() => {
    if (session && supabase) void loadEntries();
  }, [session, supabase]);

  useEffect(() => {
    if (!selected) return;
    setCollection(selected.collection);
    setSlug(selected.slug);
    setSortOrder(selected.sort_order);
    setJson(JSON.stringify(selected.data, null, 2));
  }, [selected]);

  async function loadEntries() {
    if (!supabase) { setMessage("Supabase nu este configurat."); return; }
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase
      .from("content_entries")
      .select("id, collection, slug, sort_order, data, updated_at")
      .order("collection")
      .order("sort_order", { ascending: true });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const loaded = data as ContentEntry[];
    setEntries(loaded);
    setSelectedId((current) => current ?? loaded[0]?.id ?? null);
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    if (!supabase) { setMessage("Supabase nu este configurat."); return; }
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMessage(error.message);
  }

  async function saveEntry() {
    if (!supabase) { setMessage("Supabase nu este configurat."); return; }
    setBusy(true);
    setMessage("");

    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      setBusy(false);
      setMessage("JSON invalid. Verifică virgulele, ghilimelele și acoladele.");
      return;
    }

    const payload = {
      collection,
      slug,
      sort_order: sortOrder,
      data: parsed,
      updated_at: new Date().toISOString(),
    };

    const query = selectedId
      ? supabase.from("content_entries").update(payload).eq("id", selectedId).select().single()
      : supabase.from("content_entries").insert(payload).select().single();

    const { data, error } = await query;
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Salvat.");
    await loadEntries();
    setSelectedId((data as ContentEntry).id);
  }

  async function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    if (!supabase) { setMessage("Supabase nu este configurat."); return; }
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setMessage("");

    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    const path = `uploads/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    setUploadedUrl(data.publicUrl);
    setMessage("Imagine încărcată. Copiază URL-ul în JSON.");
  }

  function newEntry(nextCollection: Collection) {
    setSelectedId(null);
    setCollection(nextCollection);
    setSlug("");
    setSortOrder(entries.filter((entry) => entry.collection === nextCollection).length);
    setJson("{}\n");
    setMessage("");
  }

  if (!session) {
    return (
      <main className="admin-shell admin-login">
        <form className="admin-card" onSubmit={login}>
          <p className="admin-eyebrow">CMS</p>
          <h1>Autentificare</h1>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Parolă
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>
          <button disabled={busy}>{busy ? "Se conectează…" : "Intră în admin"}</button>
          {message && <p className="admin-message">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <p className="admin-eyebrow">Andrei Bândilă</p>
          <h1>Content admin</h1>
        </div>
        <nav>
          {collections.map((item) => (
            <button key={item.id} onClick={() => newEntry(item.id)}>
              + {item.label}
            </button>
          ))}
        </nav>
        <button className="admin-secondary" onClick={() => supabase?.auth.signOut()}>Ieși din cont</button>
      </aside>

      <section className="admin-list">
        <div className="admin-list-head">
          <h2>Conținut</h2>
          <button onClick={loadEntries} disabled={busy}>Reîncarcă</button>
        </div>
        {entries.map((entry) => (
          <button
            key={entry.id}
            className={entry.id === selectedId ? "is-active" : ""}
            onClick={() => setSelectedId(entry.id)}
          >
            <span>{entry.collection}</span>
            {entry.slug}
          </button>
        ))}
      </section>

      <section className="admin-editor">
        <div className="admin-toolbar">
          <div>
            <p className="admin-eyebrow">Editor JSON</p>
            <h2>{selected ? selected.slug : "Intrare nouă"}</h2>
          </div>
          <button onClick={saveEntry} disabled={busy || !slug}>{busy ? "Se salvează…" : "Salvează"}</button>
        </div>

        <div className="admin-fields">
          <label>
            Colecție
            <select value={collection} onChange={(event) => setCollection(event.target.value as Collection)}>
              {collections.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            Slug
            <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="timisoara" />
          </label>
          <label>
            Ordine
            <input value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} type="number" />
          </label>
        </div>

        <label className="admin-upload">
          Încarcă fotografie
          <input type="file" accept="image/*" onChange={uploadPhoto} />
        </label>
        {uploadedUrl && (
          <div className="admin-uploaded">
            <input readOnly value={uploadedUrl} onFocus={(event) => event.target.select()} />
          </div>
        )}

        <textarea className="admin-json" value={json} onChange={(event) => setJson(event.target.value)} spellCheck={false} />
        {message && <p className="admin-message">{message}</p>}
      </section>
    </main>
  );
}
