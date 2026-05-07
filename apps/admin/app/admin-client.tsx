"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { LogOut, Plus } from "lucide-react";
import { useSupabaseSession } from "./admin-hooks";
import type {
  AdminAboutPage as About,
  AdminAboutSection as AboutSection,
  AdminAlbum as Album,
  AdminAlbumPhoto as AlbumPhoto,
  AdminFilm as Film,
  AdminJournalEntry as Journal,
} from "@andreibandila/shared";
import {
  AboutEditor,
  AlbumEditor,
  FilmEditor,
  JournalEditor,
  Login,
  SortableList,
  iconForTab,
  labelForTab,
  type LoginValues,
  type Tab,
} from "./admin-components";
import { fetchAdminData } from "./admin-data";
import {
  aboutSchema,
  aboutSectionSchema,
  albumSchema,
  emptyAbout,
  emptyAlbum,
  emptyFilm,
  emptyJournal,
  filmSchema,
  itemIdFromPath,
  journalSchema,
  pathForTab,
  readImageMetadata,
  stable,
  storagePathForFile,
  storagePathFromPublicUrl,
  tabFromPath,
  validationMessage,
} from "./admin-utils";

const adminQueryClient = new QueryClient();

export default function AdminClient({ initialTab, initialItemId, loginPage = false }: { initialTab?: Tab; initialItemId?: string; loginPage?: boolean }) {
  return <QueryClientProvider client={adminQueryClient}><AdminApp initialTab={initialTab} initialItemId={initialItemId} loginPage={loginPage} /><Toaster position="bottom-right" toastOptions={{ classNames: { toast: "admin-toast", title: "admin-toast-title", description: "admin-toast-description", actionButton: "admin-toast-action", cancelButton: "admin-toast-cancel" } }} /></QueryClientProvider>;
}

function AdminApp({ initialTab, initialItemId, loginPage }: { initialTab?: Tab; initialItemId?: string; loginPage: boolean }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTabState] = useState<Tab>(initialTab ?? tabFromPath(pathname));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const pendingUploadedUrls = useRef(new Set<string>());
  const pendingDeleteUrls = useRef(new Set<string>());

  const [albums, setAlbums] = useState<Album[]>([]);
  const [album, setAlbumState] = useState<Album | null>(null);
  const [savedAlbum, setSavedAlbum] = useState<Album | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<AlbumPhoto[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const [films, setFilms] = useState<Film[]>([]);
  const [film, setFilmState] = useState<Film | null>(null);
  const [savedFilm, setSavedFilm] = useState<Film | null>(null);

  const [journalEntries, setJournalEntries] = useState<Journal[]>([]);
  const [journal, setJournalState] = useState<Journal | null>(null);
  const [savedJournal, setSavedJournal] = useState<Journal | null>(null);

  const [about, setAboutState] = useState<About>(emptyAbout);
  const [savedAbout, setSavedAbout] = useState<About>(emptyAbout);
  const [aboutSections, setAboutSections] = useState<AboutSection[]>([]);
  const [savedAboutSections, setSavedAboutSections] = useState<AboutSection[]>([]);

  const dirty = useMemo(() => {
    if (tab === "albums") return Boolean(album) && stable(album) !== stable(savedAlbum);
    if (tab === "films") return Boolean(film) && stable(film) !== stable(savedFilm);
    if (tab === "journal") return Boolean(journal) && stable(journal) !== stable(savedJournal);
    return stable(about) !== stable(savedAbout) || stable(aboutSections) !== stable(savedAboutSections);
  }, [tab, album, savedAlbum, film, savedFilm, journal, savedJournal, about, savedAbout, aboutSections, savedAboutSections]);

  const notify = useCallback((text: string, kind: "success" | "error" | "info" = "info") => {
    setMessage(text);
    toast[kind](text);
  }, []);

  const { supabase, session, loading: sessionLoading } = useSupabaseSession((text) => notify(text, "error"));

  useEffect(() => {
    if (sessionLoading) return;
    if (!session && !loginPage) router.replace("/login");
    if (session && loginPage) router.replace("/albums");
  }, [sessionLoading, session, loginPage, router]);

  function confirmDiscard() {
    if (!dirty) return true;
    const confirmed = window.confirm("Ai modificări nesalvate. Continui fără să salvezi?");
    if (confirmed) discardPendingStorageChanges();
    return confirmed;
  }

  function setTab(next: Tab) {
    if (!confirmDiscard()) return;
    setTabState(next);
    router.push(pathForTab(next));
  }

  useEffect(() => {
    const next = tabFromPath(pathname);
    if (next !== tab && confirmDiscard()) setTabState(next);
  }, [pathname]);

  function setAlbum(next: Album) { setAlbumState(next); }
  function setFilm(next: Film) { setFilmState(next); }
  function setJournal(next: Journal) { setJournalState(next); }
  function setAbout(next: About) { setAboutState(next); }

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const adminQuery = useQuery({
    queryKey: ["admin-data"],
    queryFn: () => fetchAdminData(supabase!),
    enabled: Boolean(session && supabase),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (adminQuery.error) notify(validationMessage(adminQuery.error), "error");
  }, [adminQuery.error]);

  useEffect(() => {
    const data = adminQuery.data;
    if (!data) return;
    setAlbums(data.albums);
    setFilms(data.films);
    setJournalEntries(data.journalEntries);
    if (dirty) return;
    if (data.about) {
      setAboutState(data.about);
      setSavedAbout(data.about);
    } else {
      setAboutState(emptyAbout);
      setSavedAbout(emptyAbout);
    }
    setAboutSections(data.aboutSections);
    setSavedAboutSections(data.aboutSections);
    const selectedId = initialItemId ?? itemIdFromPath(pathname);
    if (selectedId && tab === "albums") {
      const next = data.albums.find((item) => item.id === selectedId);
      if (next) { setAlbumState(next); setSavedAlbum(next); reloadAlbumPhotos(next.id); }
    }
    if (selectedId && tab === "films") {
      const next = data.films.find((item) => item.id === selectedId);
      if (next) { setFilmState(next); setSavedFilm(next); }
    }
    if (selectedId && tab === "journal") {
      const next = data.journalEntries.find((item) => item.id === selectedId);
      if (next) { setJournalState(next); setSavedJournal(next); }
    }
  }, [adminQuery.data]);

  async function invalidateAdminData() {
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
  }

  const saveAlbumMutation = useMutation({ mutationFn: saveAlbumAction });
  const saveFilmMutation = useMutation({ mutationFn: saveFilmAction });
  const saveJournalMutation = useMutation({ mutationFn: saveJournalAction });
  const saveAboutMutation = useMutation({ mutationFn: saveAboutAction });
  const addAlbumPhotosMutation = useMutation({ mutationFn: addAlbumPhotosAction });
  const deleteAlbumMutation = useMutation({ mutationFn: deleteAlbumAction });
  const deleteFilmMutation = useMutation({ mutationFn: deleteFilmAction });
  const deleteJournalMutation = useMutation({ mutationFn: deleteJournalAction });
  const reorderAlbumPhotosMutation = useMutation({ mutationFn: reorderAlbumPhotosAction });

  function saveAlbum(next = album) { saveAlbumMutation.mutate(next ?? undefined); }
  function saveAlbumDraft() { if (album) saveAlbum({ ...album, published: false }); }
  function publishAlbum() { if (album) saveAlbum({ ...album, published: true }); }
  function saveFilm(next = film) { saveFilmMutation.mutate(next ?? undefined); }
  function saveFilmDraft() { if (film) saveFilm({ ...film, published: false }); }
  function publishFilm() { if (film) saveFilm({ ...film, published: true }); }
  function saveJournal(next = journal) { saveJournalMutation.mutate(next ?? undefined); }
  function saveJournalDraft() { if (journal) saveJournal({ ...journal, published: false }); }
  function publishJournal() { if (journal) saveJournal({ ...journal, published: true }); }
  function saveAbout() { saveAboutMutation.mutate(); }
  function addAlbumPhotos(files: File[]) { addAlbumPhotosMutation.mutate(files); }
  function deleteAlbum() { deleteAlbumMutation.mutate(); }
  function deleteFilm() { deleteFilmMutation.mutate(); }
  function deleteJournal() { deleteJournalMutation.mutate(); }
  function reorderAlbumPhotos(next: AlbumPhoto[]) { reorderAlbumPhotosMutation.mutate(next); }

  async function login(values: LoginValues) {
    if (!supabase) return notify("Supabase nu este configurat.", "error");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setBusy(false);
    if (error) notify(error.message, "error");
  }

  async function removeStorageUrl(url: string) {
    if (!supabase || !url) return;
    const path = storagePathFromPublicUrl(url);
    if (path) await supabase.storage.from("photos").remove([path]);
  }

  function trackPendingUpload(url: string) {
    if (storagePathFromPublicUrl(url)) pendingUploadedUrls.current.add(url);
  }

  function scheduleStorageDeletion(url?: string | null) {
    if (url && storagePathFromPublicUrl(url)) pendingDeleteUrls.current.add(url);
  }

  async function removeStorageUrls(urls: string[]) {
    await Promise.all(urls.map((url) => removeStorageUrl(url)));
  }

  function discardPendingStorageChanges() {
    const uploads = [...pendingUploadedUrls.current];
    pendingUploadedUrls.current.clear();
    pendingDeleteUrls.current.clear();
    void removeStorageUrls(uploads);
  }

  async function finalizeStorageChanges(protectedUrls: string[] = []) {
    const protectedSet = new Set(protectedUrls.filter(Boolean));
    for (const url of protectedSet) pendingUploadedUrls.current.delete(url);
    const toDelete = [...pendingDeleteUrls.current].filter((url) => !protectedSet.has(url));
    pendingDeleteUrls.current.clear();
    for (const url of toDelete) pendingUploadedUrls.current.delete(url);
    await removeStorageUrls(toDelete);
  }

  async function upload(file: File, folder: string): Promise<{ url: string; path: string; width: number | null; height: number | null; blur_data_url: string | null }> {
    if (!supabase) throw new Error("Supabase nu este configurat.");
    const metadata = await readImageMetadata(file);
    const storagePath = storagePathForFile(file, folder);
    const { error } = await supabase.storage.from("photos").upload(storagePath, file, { cacheControl: "31536000" });
    if (error) throw error;
    return { url: supabase.storage.from("photos").getPublicUrl(storagePath).data.publicUrl, path: storagePath, ...metadata };
  }

  async function handleUpload(file: File | undefined, folder: string, cb: (url: string) => void, oldUrl = "") {
    if (!file) return;
    try {
      setBusy(true);
      const uploaded = await upload(file, folder);
      trackPendingUpload(uploaded.url);
      cb(uploaded.url);
      if (oldUrl && oldUrl !== uploaded.url) scheduleStorageDeletion(oldUrl);
      notify("Imagine încărcată.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Upload eșuat.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function reloadAlbumPhotos(albumId: string) {
    if (!supabase) return;
    const { data } = await supabase.from("album_photos").select("*").eq("album_id", albumId).order("sort_order");
    setAlbumPhotos((data ?? []) as AlbumPhoto[]);
  }

  async function selectAlbum(id: string) {
    if (!supabase || !confirmDiscard()) return;
    const next = albums.find((x) => x.id === id);
    if (!next) return;
    setAlbumState(next);
    setSavedAlbum(next);
    router.push(pathForTab("albums", id));
    await reloadAlbumPhotos(id);
  }

  function pushEditorUrl(path: string) {
    router.push(path);
  }

  function newAlbum() {
    if (!confirmDiscard()) return;
    const next = { ...emptyAlbum, sort_order: albums.length };
    setAlbumState(next); setSavedAlbum(next); setAlbumPhotos([]); pushEditorUrl(pathForTab("albums"));
  }

  function selectFilm(next: Film) { if (!confirmDiscard()) return; setFilmState(next); setSavedFilm(next); router.push(pathForTab("films", next.id)); }
  function newFilm() { if (!confirmDiscard()) return; const next = { ...emptyFilm, sort_order: films.length }; setFilmState(next); setSavedFilm(next); pushEditorUrl(pathForTab("films")); }
  function selectJournal(next: Journal) { if (!confirmDiscard()) return; setJournalState(next); setSavedJournal(next); router.push(pathForTab("journal", next.id)); }
  function newJournal() { if (!confirmDiscard()) return; const next = { ...emptyJournal, sort_order: journalEntries.length }; setJournalState(next); setSavedJournal(next); pushEditorUrl(pathForTab("journal")); }

  async function saveAlbumAction(nextAlbum?: Album) {
    const target = nextAlbum ?? album;
    if (!supabase || !target) return;
    if (albumPhotos.some((photo) => !photo.caption?.trim())) return notify("Completează legendele fotografiilor înainte de salvare.", "error");
    const parsed = albumSchema.safeParse(target);
    if (!parsed.success) return notify(validationMessage(parsed.error), "error");
    if (!savedAlbum?.id && albums.some((item) => item.id === parsed.data.id)) return notify("Există deja un album cu acest slug.", "error");
    const { error } = await supabase.from("albums").upsert({ ...parsed.data, updated_at: new Date().toISOString() });
    if (error) return notify(error.message, "error");
    setAlbumState(parsed.data);
    setSavedAlbum(parsed.data);
    notify(parsed.data.published ? "Album salvat și publicat." : "Album salvat ca draft.", "success");
    await invalidateAdminData();
  }

  async function addAlbumPhotosAction(files: File[]) {
    if (!supabase || !album?.id || !files.length) return;
    if (!savedAlbum?.id || savedAlbum.id !== album.id) return notify("Salvează albumul înainte de a încărca fotografii.", "error");
    try {
      setBusy(true);
      setUploadingFiles(files.map((file) => file.name));
      const uploaded: Awaited<ReturnType<typeof upload>>[] = [];
      try {
        for (const file of files) uploaded.push(await upload(file, `albums/${album.id}`));
      } catch (error) {
        await supabase.storage.from("photos").remove(uploaded.map((item) => item.path));
        throw error;
      }
      const captionFromName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      const rows = uploaded.map((item, index) => ({ album_id: album.id, src: item.url, caption: captionFromName(files[index].name), sort_order: albumPhotos.length + index, is_cover: albumPhotos.length === 0 && index === 0, width: item.width, height: item.height, blur_data_url: item.blur_data_url }));
      const { error } = await supabase.from("album_photos").insert(rows);
      if (error) {
        await supabase.storage.from("photos").remove(uploaded.map((item) => item.path));
        return notify(error.message, "error");
      }
      notify(files.length === 1 ? "Fotografie încărcată." : "Fotografii încărcate.", "success");
      await reloadAlbumPhotos(album.id);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Upload eșuat.", "error");
    } finally {
      setBusy(false);
      setUploadingFiles([]);
    }
  }

  async function setCover(photoId: string) {
    if (!supabase || !album?.id) return;
    const { error } = await supabase.rpc("set_album_cover", { p_album_id: album.id, p_photo_id: photoId });
    if (error) return notify(error.message, "error");
    await reloadAlbumPhotos(album.id);
  }

  async function updatePhoto(photo: AlbumPhoto) {
    if (!supabase) return;
    const { error } = await supabase.from("album_photos").update(photo).eq("id", photo.id);
    if (error) notify(error.message, "error");
  }

  async function deletePhoto(photoId: string) {
    if (!supabase || !album) return;
    const photo = albumPhotos.find((item) => item.id === photoId);
    const { error } = await supabase.from("album_photos").delete().eq("id", photoId);
    if (error) return notify(error.message, "error");
    await removeStorageUrl(photo?.src ?? "");
    await reloadAlbumPhotos(album.id);
  }

  async function reorderAlbumPhotosAction(next: AlbumPhoto[]) {
    if (!supabase) return;
    const previous = albumPhotos;
    const ordered = next.map((photo, i) => ({ ...photo, sort_order: i }));
    setAlbumPhotos(ordered);
    const { data, error } = await supabase.rpc("reorder_album_photos", { p_photo_ids: ordered.map((photo) => photo.id) });
    if (error) { setAlbumPhotos(previous); notify(error.message, "error"); }
    else {
      setAlbumPhotos(((data ?? ordered) as AlbumPhoto[]).map((photo, i) => ({ ...photo, sort_order: i })));
    }
  }

  async function saveFilmAction(nextFilm?: Film) {
    const target = nextFilm ?? film;
    if (!supabase || !target) return;
    const parsed = filmSchema.safeParse(target);
    if (!parsed.success) return notify(validationMessage(parsed.error), "error");
    if (!savedFilm?.id && films.some((item) => item.id === parsed.data.id)) return notify("Există deja un film cu acest slug.", "error");
    const { error } = await supabase.from("films").upsert({ ...parsed.data, updated_at: new Date().toISOString() });
    if (error) return notify(error.message, "error");
    setFilmState(parsed.data);
    setSavedFilm(parsed.data);
    await finalizeStorageChanges([parsed.data.cover]);
    notify(parsed.data.published ? "Film salvat și publicat." : "Film salvat ca draft.", "success");
    await invalidateAdminData();
  }

  async function saveJournalAction(nextJournal?: Journal) {
    const target = nextJournal ?? journal;
    if (!supabase || !target) return;
    const parsed = journalSchema.safeParse(target);
    if (!parsed.success) return notify(validationMessage(parsed.error), "error");
    if (!savedJournal?.id && journalEntries.some((item) => item.id === parsed.data.id)) return notify("Există deja un articol cu acest slug.", "error");
    const { error } = await supabase.from("journal_entries").upsert({ ...parsed.data, updated_at: new Date().toISOString() });
    if (error) return notify(error.message, "error");
    setJournalState(parsed.data);
    setSavedJournal(parsed.data);
    await finalizeStorageChanges([parsed.data.image]);
    notify(parsed.data.published ? "Articol salvat și publicat." : "Articol salvat ca draft.", "success");
    await invalidateAdminData();
  }

  async function saveAboutAction() {
    if (!supabase) return;
    const parsed = aboutSchema.safeParse(about);
    if (!parsed.success) return notify(validationMessage(parsed.error), "error");
    const { error } = await supabase.from("about_page").upsert({ id: true, ...parsed.data, updated_at: new Date().toISOString() });
    if (error) return notify(error.message, "error");
    setSavedAbout(parsed.data);
    await finalizeStorageChanges([parsed.data.portrait_image]);
    notify("Pagina Despre salvată.", "success");
  }

  function newAboutSection() {
    setAboutSections([...aboutSections, { id: crypto.randomUUID(), title: "", body: "", sort_order: aboutSections.length }]);
  }

  function setAboutSectionsOrdered(next: AboutSection[]) {
    setAboutSections(next.map((section, i) => ({ ...section, sort_order: i })));
  }

  async function saveAboutSections() {
    if (!supabase) return;
    const parsed = aboutSections.map((section, i) => aboutSectionSchema.safeParse({ ...section, sort_order: i }));
    const invalid = parsed.find((result) => !result.success);
    if (invalid && !invalid.success) return notify(validationMessage(invalid.error), "error");
    const rows = parsed.map((result) => result.data!);

    const { data, error } = await supabase.rpc("sync_about_sections", { p_sections: rows });
    if (error) return notify(error.message, "error");

    const savedRows = ((data ?? rows) as AboutSection[]).map((section, i) => ({
      id: section.id,
      title: section.title,
      body: section.body,
      sort_order: section.sort_order ?? i,
    }));
    setAboutSections(savedRows);
    setSavedAboutSections(savedRows);
    notify("Secțiunile Despre au fost salvate.", "success");
  }

  async function deleteAlbumAction() {
    if (!supabase || !album || !window.confirm("Ștergi albumul și fotografiile lui?")) return;
    const { data: photos } = await supabase.from("album_photos").select("src").eq("album_id", album.id);
    const { error } = await supabase.from("albums").delete().eq("id", album.id);
    if (error) return notify(error.message, "error");
    await Promise.all(((photos ?? []) as { src: string }[]).map((photo) => removeStorageUrl(photo.src)));
    setAlbumState(null); setSavedAlbum(null); setAlbumPhotos([]);
    notify("Album șters.", "success");
    await invalidateAdminData();
  }

  async function deleteFilmAction() {
    if (!supabase || !film || !window.confirm("Ștergi filmul?")) return;
    const oldCovers = [...new Set([film.cover, savedFilm?.cover].filter(Boolean) as string[])];
    const { error } = await supabase.from("films").delete().eq("id", film.id);
    if (error) return notify(error.message, "error");
    await removeStorageUrls(oldCovers);
    for (const url of oldCovers) { pendingUploadedUrls.current.delete(url); pendingDeleteUrls.current.delete(url); }
    setFilmState(null); setSavedFilm(null);
    notify("Film șters.", "success");
    await invalidateAdminData();
  }

  async function deleteJournalAction() {
    if (!supabase || !journal || !window.confirm("Ștergi articolul?")) return;
    const oldImages = [...new Set([journal.image, savedJournal?.image].filter(Boolean) as string[])];
    const { error } = await supabase.from("journal_entries").delete().eq("id", journal.id);
    if (error) return notify(error.message, "error");
    await removeStorageUrls(oldImages);
    for (const url of oldImages) { pendingUploadedUrls.current.delete(url); pendingDeleteUrls.current.delete(url); }
    setJournalState(null); setSavedJournal(null);
    notify("Articol șters.", "success");
    await invalidateAdminData();
  }

  function removeAboutPortrait() {
    scheduleStorageDeletion(about.portrait_image);
    setAbout({ ...about, portrait_image: "" });
  }

  async function reorder<T extends { id: string; sort_order: number }>(table: string, items: T[], setItems: (items: T[]) => void, from: number, to: number) {
    if (!supabase || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const ordered = next.map((item, i) => ({ ...item, sort_order: i }));
    setItems(ordered);
    const { error } = await supabase.rpc("reorder_content_items", { p_table: table, p_ids: ordered.map((item) => item.id) });
    if (error) { setItems(items); notify(error.message, "error"); }
  }

  const content = sessionLoading || (!session && !loginPage) || (session && loginPage) ? (
    <LoadingAdmin />
  ) : !session ? (
    <Login busy={busy} message={message} login={login} />
  ) : (
    <main className={`admin-shell${tab === "about" ? " admin-shell-no-list" : ""}`}>
      <aside className="admin-sidebar">
        <div className="admin-brand-block"><p className="admin-eyebrow">Andrei Bândilă</p><h1>CMS</h1>{dirty && <p className="admin-dirty">Modificări nesalvate</p>}</div>
        <nav>{(["albums", "films", "journal", "about"] as Tab[]).map((x) => <button key={x} className={tab === x ? "is-active" : ""} onClick={() => setTab(x)}>{iconForTab(x)}{labelForTab(x)}</button>)}</nav>
        <button className="admin-secondary" onClick={() => supabase?.auth.signOut()}><LogOut size={16} />Ieși din cont</button>
      </aside>
      {tab !== "about" && <section className="admin-list">
        <div className="admin-list-head"><h2>{labelForTab(tab)}</h2></div>
        {tab === "albums" && <><button onClick={newAlbum}><Plus size={15} />Album</button><SortableList items={albums} label={(x) => `${x.published ? "" : "[draft] "}${x.title || x.id}`} onSelect={(x) => selectAlbum(x.id)} onReorder={(from, to) => reorder("albums", albums, setAlbums, from, to)} /></>}
        {tab === "films" && <><button onClick={newFilm}><Plus size={15} />Film</button><SortableList items={films} label={(x) => `${x.published ? "" : "[draft] "}${x.title || x.id}`} onSelect={selectFilm} onReorder={(from, to) => reorder("films", films, setFilms, from, to)} /></>}
        {tab === "journal" && <><button onClick={newJournal}><Plus size={15} />Articol</button><SortableList items={journalEntries} label={(x) => `${x.published ? "" : "[draft] "}${x.title || x.id}`} onSelect={selectJournal} onReorder={(from, to) => reorder("journal_entries", journalEntries, setJournalEntries, from, to)} /></>}
      </section>}
      <section className="admin-editor">
        {tab === "albums" && (album ? <AlbumEditor album={album} setAlbum={setAlbum} lockSlug={Boolean(savedAlbum?.id)} canAddPhotos={Boolean(savedAlbum?.id && savedAlbum.id === album.id)} save={() => saveAlbum()} saveDraft={saveAlbumDraft} publish={publishAlbum} onDelete={deleteAlbum} photos={albumPhotos} setPhotos={setAlbumPhotos} addPhotos={addAlbumPhotos} uploadingFiles={uploadingFiles} setCover={setCover} updatePhoto={updatePhoto} deletePhoto={deletePhoto} reorderPhotos={reorderAlbumPhotos} /> : <EmptyEditor label="Selectează sau creează un album." />)}
        {tab === "films" && (film ? <FilmEditor film={film} setFilm={setFilm} lockSlug={Boolean(savedFilm?.id)} save={() => saveFilm()} saveDraft={saveFilmDraft} publish={publishFilm} onDelete={deleteFilm} uploadCover={(file) => handleUpload(file, `films/${film.id || "new"}`, (url) => setFilm({ ...film, cover: url }), film.cover)} removeCover={() => { scheduleStorageDeletion(film.cover); setFilm({ ...film, cover: "" }); }} /> : <EmptyEditor label="Selectează sau creează un film." />)}
        {tab === "journal" && (journal ? <JournalEditor journal={journal} setJournal={setJournal} lockSlug={Boolean(savedJournal?.id)} save={() => saveJournal()} saveDraft={saveJournalDraft} publish={publishJournal} onDelete={deleteJournal} uploadImage={(file) => handleUpload(file, `journal/${journal.id || "new"}`, (url) => setJournal({ ...journal, image: url }), journal.image)} removeImage={() => { scheduleStorageDeletion(journal.image); setJournal({ ...journal, image: "" }); }} /> : <EmptyEditor label="Selectează sau creează un articol." />)}
        {tab === "about" && <AboutEditor about={about} setAbout={setAbout} save={saveAbout} uploadPortrait={(file) => handleUpload(file, "about", (url) => setAbout({ ...about, portrait_image: url }), about.portrait_image)} removePortrait={removeAboutPortrait} sections={aboutSections} setSections={setAboutSectionsOrdered} newSection={newAboutSection} saveSections={saveAboutSections} />}
      </section>
    </main>
  );

  return content;
}

function LoadingAdmin() {
  return <main className="admin-shell admin-login"><div className="admin-card admin-loading"><p className="admin-eyebrow">CMS</p><h1>Se încarcă</h1><p>Verificăm sesiunea…</p></div></main>;
}

function EmptyEditor({ label }: { label: string }) {
  return <div className="admin-empty-editor" aria-label="Nicio selecție"><p>{label}</p></div>;
}
