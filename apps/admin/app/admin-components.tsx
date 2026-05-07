"use client";

import { useState, type CSSProperties } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, FileText, GripVertical, Plus, Save, Settings, Star, Trash2, Upload, Video, X } from "lucide-react";
import type { AdminAboutPage as About, AdminAboutSection as AboutSection, AdminAlbum as Album, AdminAlbumPhoto as AlbumPhoto, AdminFilm as Film, AdminJournalEntry as Journal } from "@andreibandila/shared";

export type Tab = "albums" | "films" | "journal" | "about";
export type LoginValues = { email: string; password: string };
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function Login({ busy, message, login }: { busy: boolean; message: string; login: (values: LoginValues) => void }) {
  const { register, handleSubmit } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  return <main className="admin-shell admin-login"><form className="admin-card" onSubmit={handleSubmit(login)}><p className="admin-eyebrow">CMS</p><h1>Autentificare</h1><label>Email<input {...register("email", { required: true })} type="email" required /></label><label>Parolă<input {...register("password", { required: true })} type="password" required /></label><button disabled={busy}>Intră în admin</button>{message && <p className="admin-message">{message}</p>}</form></main>;
}

export function labelForTab(tab: Tab) { return tab === "albums" ? "Albume" : tab === "films" ? "Filme" : tab === "journal" ? "Jurnal" : "Despre"; }
export function iconForTab(tab: Tab) { return tab === "albums" ? <Camera size={17} /> : tab === "films" ? <Video size={17} /> : tab === "journal" ? <FileText size={17} /> : <Settings size={17} />; }

function Field({ label, value, onChange, textarea = false, type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; textarea?: boolean; type?: string }) {
  return <label>{label}{textarea ? <textarea value={value} onChange={(e) => onChange(e.target.value)} /> : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />}</label>;
}

function PublicationActions({ published, save, saveDraft, publish }: { published: boolean; save: () => void; saveDraft: () => void; publish: () => void }) {
  return <div className="admin-publish-control"><span className={`admin-status-label${published ? " is-published" : " is-draft"}`}>{published ? "Publicat" : "Draft"}</span><button type="button" onClick={save}><Save size={15} />Salvează</button>{published ? <button type="button" className="admin-secondary" onClick={saveDraft}>Retrage în draft</button> : <button type="button" className="admin-secondary" onClick={publish}>Publică</button>}</div>;
}

function IdTitle({ value, placeholder, disabled, onChange }: { value: string; placeholder: string; disabled?: boolean; onChange: (value: string) => void }) {
  return <h2 className="admin-id-title"><span aria-hidden="true">/</span><input value={value} placeholder={placeholder} aria-label="Slug" disabled={disabled} title={disabled ? "Slugul este blocat după salvare." : "Slug public"} onChange={(e) => onChange(slugify(e.target.value))} /></h2>;
}

function validateImages(files: File[]) {
  const invalid = files.find((file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024);
  if (invalid?.type && !invalid.type.startsWith("image/")) { toast.error("Alege doar fișiere imagine."); return false; }
  if (invalid && invalid.size > 10 * 1024 * 1024) { toast.error("Fiecare imagine trebuie să fie sub 10 MB."); return false; }
  return true;
}

export function UploadField({ label, onFiles, disabled = false, help }: { label: string; onFiles: (files: File[]) => void; disabled?: boolean; help?: string }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    disabled,
    onDrop: (accepted) => { if (accepted.length && validateImages(accepted)) onFiles(accepted); },
  });
  return <div className="admin-upload-field"><span className="admin-upload-label">{label}</span><div {...getRootProps()} className={`admin-file${isDragActive ? " is-drag-active" : ""}${disabled ? " is-disabled" : ""}`}><Upload size={15} />{disabled ? (help ?? "Salvează înainte de upload") : "Trage imagini aici sau alege fișiere"}<input {...getInputProps()} /></div></div>;
}

function ImageControl({ label, src, alt, previewClass = "", className = "", showRemove = true, onUpload, onRemove }: { label: string; src: string; alt: string; previewClass?: string; className?: string; showRemove?: boolean; onUpload: (file?: File) => void; onRemove: () => void }) {
  function handle(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Alege un fișier imagine.");
    if (file.size > 10 * 1024 * 1024) return toast.error("Imaginea trebuie să fie sub 10 MB.");
    onUpload(file);
  }
  return <div className={`admin-image-control ${className}`}><span className="admin-image-label">{label}</span><label className={`admin-image-drop ${src ? "has-image" : ""}`}><input type="file" accept="image/*" onChange={(e) => handle(e.target.files?.[0])} />{src ? <><img className={`admin-preview ${previewClass}`} src={src} alt={alt} /><span className="admin-image-overlay">Schimbă imaginea</span></> : <span className="admin-image-empty"><Upload size={18} />Alege fișier</span>}</label>{src && showRemove && <button type="button" className="admin-danger-lite admin-image-remove" onClick={onRemove}><X size={14} />Șterge</button>}</div>;
}

function PlainTextField({ label, value, onChange, hints = ["Paragrafe separate prin linii goale.", "**bold**, *italic*", "Liste cu -", "Linkuri: [text](https://...)"] }: { label: string; value: string; onChange: (value: string) => void; hints?: string[] }) {
  return <div className="admin-markdown-field"><div className="admin-markdown-head"><span>{label}</span></div><textarea value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />{hints.length > 0 && <ul className="admin-markdown-hints">{hints.map((hint) => <li key={hint}>{hint}</li>)}</ul>}</div>;
}

export function SortableList<T extends { id: string }>({ items, label, onSelect, onReorder }: { items: T[]; label: (item: T) => string; onSelect: (item: T) => void; onReorder: (from: number, to: number) => void }) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from >= 0 && to >= 0) onReorder(from, to);
  }
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}><div className="admin-sortable">{items.map((item) => <SortableListItem key={item.id} id={item.id} label={label(item)} onSelect={() => onSelect(item)} />)}</div></SortableContext></DndContext>;
}

function SortableListItem({ id, label, onSelect }: { id: string; label: string; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return <button ref={setNodeRef} style={style} type="button" onClick={onSelect}><span {...attributes} {...listeners} aria-label="Reordonează"><GripVertical size={16} /></span>{label}</button>;
}

function ConfirmDeleteButton({ onConfirm, children = "Șterge" }: { onConfirm: () => void; children?: React.ReactNode }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) return <span className="admin-confirm-inline"><button type="button" className="admin-danger" onClick={() => { setConfirming(false); onConfirm(); }}>Confirmă</button><button type="button" onClick={() => setConfirming(false)}>Anulează</button></span>;
  return <button type="button" onClick={() => setConfirming(true)}><Trash2 size={15} />{children}</button>;
}

function SortablePhoto({ photo, onCaption, onCaptionBlur, onCover, onDelete }: { photo: AlbumPhoto; onCaption: (caption: string) => void; onCaptionBlur: () => void; onCover: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return <div ref={setNodeRef} style={style}><span className="admin-photo-drag" {...attributes} {...listeners} aria-label="Reordonează fotografia"><GripVertical size={16} /></span><img src={photo.src} alt="" /><input value={photo.caption ?? ""} placeholder="Legendă" onChange={(e) => onCaption(e.target.value)} onBlur={onCaptionBlur} /><button type="button" className={`admin-cover-btn${photo.is_cover ? " is-active" : ""}`} aria-label={photo.is_cover ? "Fotografie copertă" : "Setează ca fotografie copertă"} title={photo.is_cover ? "Fotografie copertă" : "Setează ca fotografie copertă"} aria-pressed={photo.is_cover} onClick={onCover}><Star size={15} fill={photo.is_cover ? "currentColor" : "none"} /></button><ConfirmDeleteButton onConfirm={onDelete} /></div>;
}

function reorderItems<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function AlbumPhotos({ photos, setPhotos, setCover, updatePhoto, deletePhoto, reorderPhotos }: { photos: AlbumPhoto[]; setPhotos: (photos: AlbumPhoto[]) => void; setCover: (id: string) => void; updatePhoto: (photo: AlbumPhoto) => void; deletePhoto: (id: string) => void; reorderPhotos: (photos: AlbumPhoto[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = photos.findIndex((p) => p.id === active.id);
    const to = photos.findIndex((p) => p.id === over.id);
    if (from < 0 || to < 0) return;
    const next = reorderItems(photos, from, to);
    setPhotos(next);
    reorderPhotos(next);
  }
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={photos.map((p) => p.id)} strategy={verticalListSortingStrategy}><div className="admin-repeat">{photos.map((p) => <SortablePhoto key={p.id} photo={p} onCaption={(caption) => setPhotos(photos.map((x) => x.id === p.id ? { ...x, caption } : x))} onCaptionBlur={() => updatePhoto(photos.find((x) => x.id === p.id) ?? p)} onCover={() => setCover(p.id)} onDelete={() => deletePhoto(p.id)} />)}</div></SortableContext></DndContext>;
}

export function AlbumEditor({ album, setAlbum, lockSlug, canAddPhotos, save, saveDraft, publish, onDelete, photos, setPhotos, addPhotos, uploadingFiles, setCover, updatePhoto, deletePhoto, reorderPhotos }: { album: Album; setAlbum: (album: Album) => void; lockSlug: boolean; canAddPhotos: boolean; save: () => void; saveDraft: () => void; publish: () => void; onDelete: () => void; photos: AlbumPhoto[]; setPhotos: (photos: AlbumPhoto[]) => void; addPhotos: (files: File[]) => void; uploadingFiles: string[]; setCover: (id: string) => void; updatePhoto: (photo: AlbumPhoto) => void; deletePhoto: (id: string) => void; reorderPhotos: (photos: AlbumPhoto[]) => void }) {
  return <div><div className="admin-toolbar"><IdTitle value={album.id} placeholder="album-id" disabled={lockSlug} onChange={(id) => setAlbum({ ...album, id })} /><div className="admin-toolbar-actions"><PublicationActions published={album.published} save={save} saveDraft={saveDraft} publish={publish} /><ConfirmDeleteButton onConfirm={onDelete} /></div></div><div className="admin-fields admin-grid"><Field label="Titlu" value={album.title} onChange={(v) => setAlbum({ ...album, title: v, id: !lockSlug && !album.id ? slugify(v) : album.id })} /><Field label="Subtitlu" value={album.subtitle} onChange={(v) => setAlbum({ ...album, subtitle: v })} /><Field label="An" value={album.year} onChange={(v) => setAlbum({ ...album, year: v })} /><Field label="Loc" value={album.location} onChange={(v) => setAlbum({ ...album, location: v })} /><Field label="Descriere" value={album.description} textarea onChange={(v) => setAlbum({ ...album, description: v })} /></div><UploadField label="Adaugă fotografii" onFiles={addPhotos} disabled={!canAddPhotos} help="Salvează albumul înainte de upload" />{uploadingFiles.length > 0 && <div className="admin-upload-list">Se încarcă: {uploadingFiles.join(", ")}</div>}<AlbumPhotos photos={photos} setPhotos={setPhotos} setCover={setCover} updatePhoto={updatePhoto} deletePhoto={deletePhoto} reorderPhotos={reorderPhotos} /></div>;
}

export function FilmEditor({ film, setFilm, lockSlug, save, saveDraft, publish, onDelete, uploadCover, removeCover }: { film: Film; setFilm: (film: Film) => void; lockSlug: boolean; save: () => void; saveDraft: () => void; publish: () => void; onDelete: () => void; uploadCover: (file?: File) => void; removeCover: () => void }) {
  return <div><div className="admin-toolbar"><IdTitle value={film.id} placeholder="film-id" disabled={lockSlug} onChange={(id) => setFilm({ ...film, id })} /><div className="admin-toolbar-actions"><PublicationActions published={film.published} save={save} saveDraft={saveDraft} publish={publish} /><ConfirmDeleteButton onConfirm={onDelete} /></div></div><div className="admin-film-layout"><ImageControl label="Copertă" src={film.cover} alt="Copertă film" previewClass="admin-film-cover-preview" className="admin-film-cover-control" onUpload={uploadCover} onRemove={removeCover} /><div className="admin-fields admin-grid admin-film-fields"><Field label="Titlu" value={film.title} onChange={(v) => setFilm({ ...film, title: v, id: !lockSlug && !film.id ? slugify(v) : film.id })} /><Field label="Subtitlu" value={film.subtitle} onChange={(v) => setFilm({ ...film, subtitle: v })} /><Field label="An" value={film.year} onChange={(v) => setFilm({ ...film, year: v })} /><Field label="Rol" value={film.role} onChange={(v) => setFilm({ ...film, role: v })} /><PlainTextField label="Descriere" value={film.description} onChange={(v) => setFilm({ ...film, description: v })} /></div></div></div>;
}

export function JournalEditor({ journal, setJournal, lockSlug, save, saveDraft, publish, onDelete, uploadImage, removeImage }: { journal: Journal; setJournal: (journal: Journal) => void; lockSlug: boolean; save: () => void; saveDraft: () => void; publish: () => void; onDelete: () => void; uploadImage: (file?: File) => void; removeImage: () => void }) {
  return <div><div className="admin-toolbar"><IdTitle value={journal.id} placeholder="articol-id" disabled={lockSlug} onChange={(id) => setJournal({ ...journal, id })} /><div className="admin-toolbar-actions"><PublicationActions published={journal.published} save={save} saveDraft={saveDraft} publish={publish} /><ConfirmDeleteButton onConfirm={onDelete} /></div></div><div className="admin-fields admin-grid"><Field label="Titlu" value={journal.title} onChange={(v) => setJournal({ ...journal, title: v, id: !lockSlug && !journal.id ? slugify(v) : journal.id })} /><ImageControl label="Imagine" src={journal.image} alt="Imagine jurnal" onUpload={uploadImage} onRemove={removeImage} /><PlainTextField label="Conținut text" value={journal.content} onChange={(v) => setJournal({ ...journal, content: v })} /></div></div>;
}

function SortableAboutSection({ section, sections, setSections }: { section: AboutSection; sections: AboutSection[]; setSections: (sections: AboutSection[]) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return <div ref={setNodeRef} style={style} className="admin-about-section"><span className="admin-photo-drag" {...attributes} {...listeners} aria-label="Reordonează secțiunea"><GripVertical size={16} /></span><div className="admin-about-section-fields"><Field label="Titlu" value={section.title} onChange={(title) => setSections(sections.map((x) => x.id === section.id ? { ...x, title } : x))} /><Field label="Text" value={section.body} textarea onChange={(body) => setSections(sections.map((x) => x.id === section.id ? { ...x, body } : x))} /></div><button type="button" className="admin-danger-lite" onClick={() => setSections(sections.filter((x) => x.id !== section.id).map((x, index) => ({ ...x, sort_order: index })))}><Trash2 size={15} />Șterge</button></div>;
}

function AboutSections({ sections, setSections }: { sections: AboutSection[]; setSections: (sections: AboutSection[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = sections.findIndex((section) => section.id === active.id);
    const to = sections.findIndex((section) => section.id === over.id);
    if (from >= 0 && to >= 0) setSections(reorderItems(sections, from, to).map((section, i) => ({ ...section, sort_order: i })));
  }
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}><div className="admin-about-sections">{sections.map((section) => <SortableAboutSection key={section.id} section={section} sections={sections} setSections={setSections} />)}</div></SortableContext></DndContext>;
}

export function AboutEditor({ about, setAbout, save, uploadPortrait, removePortrait, sections, setSections, newSection, saveSections }: { about: About; setAbout: (about: About) => void; save: () => void; uploadPortrait: (file?: File) => void; removePortrait: () => void; sections: AboutSection[]; setSections: (sections: AboutSection[]) => void; newSection: () => void; saveSections: () => void }) {
  return <div className="admin-about-layout"><aside className="admin-about-media"><ImageControl label="Imagine portret" src={about.portrait_image} alt="Portret" className="admin-about-portrait-control" onUpload={uploadPortrait} onRemove={removePortrait} /></aside><div className="admin-about-main"><div className="admin-toolbar"><h2>Despre</h2><div className="admin-toolbar-actions"><button onClick={save}><Save size={15} />Salvează bio</button></div></div><PlainTextField label="Conținut text" value={about.content} onChange={(v) => setAbout({ ...about, content: v })} /><div className="admin-toolbar"><h2>Mini-secțiuni</h2><div className="admin-toolbar-actions"><button type="button" onClick={newSection}><Plus size={15} />Secțiune</button><button type="button" onClick={saveSections}><Save size={15} />Salvează secțiuni</button></div></div><AboutSections sections={sections} setSections={setSections} /></div></div>;
}
