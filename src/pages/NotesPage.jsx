import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow, addDays, nextMonday, setHours, setMinutes } from "date-fns";
import {
  Plus,
  Search,
  Pin,
  Star,
  Archive,
  Trash2,
  Folder,
  Tag,
  Bold,
  Italic,
  Underline,
  Heading,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Highlighter,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Table,
  Smile,
  Minus,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  Copy,
  Download,
  Printer,
  History,
  Clock,
  Lock,
  Unlock,
  Palette,
  X,
  ChevronLeft,
  Menu,
  Sparkles,
  FileText,
} from "lucide-react";
import { saveAs } from "file-saver";
import axiosInstance from "../api/axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";

const VIEWS = [
  { id: "all", label: "All Notes", icon: FileText },
  { id: "pinned", label: "Pinned", icon: Pin },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "archived", label: "Archived", icon: Archive },
  { id: "trash", label: "Trash", icon: Trash2 },
];

const COLORS = [
  { id: "", label: "None" },
  { id: "yellow", label: "Yellow", swatch: "bg-amber-400" },
  { id: "green", label: "Green", swatch: "bg-emerald-400" },
  { id: "blue", label: "Blue", swatch: "bg-sky-400" },
  { id: "purple", label: "Purple", swatch: "bg-violet-400" },
  { id: "pink", label: "Pink", swatch: "bg-pink-400" },
  { id: "orange", label: "Orange", swatch: "bg-orange-400" },
];

const COLOR_BAR = {
  yellow: "bg-amber-400",
  green: "bg-emerald-400",
  blue: "bg-sky-400",
  purple: "bg-violet-400",
  pink: "bg-pink-400",
  orange: "bg-orange-400",
};

const AI_ACTIONS = [
  "Summarize Note",
  "Rewrite",
  "Translate",
  "Generate Action Items",
  "Extract Tasks",
  "Generate Meeting Minutes",
];

function exec(cmd, value = null) {
  document.execCommand(cmd, false, value);
}

function highlightMatch(text, q) {
  if (!q?.trim() || !text) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${escaped})`, "ig"));
  const lower = q.toLowerCase();
  return parts.map((p, i) =>
    p.toLowerCase() === lower ? (
      <mark key={i} className="rounded bg-amber-200/80 px-0.5 dark:bg-amber-500/40">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function ToolbarButton({ onClick, title, children, active }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export default function NotesPage() {
  const [meta, setMeta] = useState({ folders: [], counts: {}, tags: [], recent: [] });
  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("all");
  const [folderId, setFolderId] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sort, setSort] = useState("updated");
  const [q, setQ] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [active, setActive] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("list"); // sidebar | list | editor
  const [folderDialog, setFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderParent, setFolderParent] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const listRef = useRef(null);
  const saveTimer = useRef(null);
  const skipRef = useRef(0);

  const isTrash = view === "trash";

  const fetchMeta = useCallback(async () => {
    const { data } = await axiosInstance.get("/notebook/meta");
    setMeta(data);
  }, []);

  const fetchNotes = useCallback(
    async ({ append = false } = {}) => {
      const skip = append ? skipRef.current : 0;
      const params = new URLSearchParams({
        view,
        sort,
        skip: String(skip),
        limit: "40",
      });
      if (folderId) params.set("folder", folderId);
      if (tagFilter) params.set("tag", tagFilter);
      if (q) params.set("q", q);

      const { data } = await axiosInstance.get(`/notebook?${params}`);
      setNotes((prev) => (append ? [...prev, ...data.notes] : data.notes));
      setTotal(data.total);
      setHasMore(data.hasMore);
      skipRef.current = skip + data.notes.length;
      return data;
    },
    [view, sort, folderId, tagFilter, q]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    skipRef.current = 0;
    try {
      await Promise.all([fetchMeta(), fetchNotes({ append: false })]);
    } finally {
      setLoading(false);
    }
  }, [fetchMeta, fetchNotes]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const t = setTimeout(() => setQ(searchDraft), 250);
    return () => clearTimeout(t);
  }, [searchDraft]);

  const loadNote = async (id) => {
    if (!id) {
      setActive(null);
      setSelectedId(null);
      return;
    }
    const { data } = await axiosInstance.get(`/notebook/${id}`);
    setActive(data);
    setSelectedId(id);
    setUnlocked(!data.locked);
    setSavedAt(data.updatedAt);
    setMobilePanel("editor");
  };

  useEffect(() => {
    if (!active || !unlocked) return;
    const noteId = active._id;
    if (titleRef.current && titleRef.current.dataset.noteId !== noteId) {
      titleRef.current.value = active.title || "";
      titleRef.current.dataset.noteId = noteId;
    }
    if (editorRef.current && editorRef.current.dataset.noteId !== noteId) {
      editorRef.current.innerHTML = active.content || "";
      editorRef.current.dataset.noteId = noteId;
    }
  }, [active, unlocked]);

  useEffect(() => {
    if (!selectedId && notes[0] && typeof window !== "undefined" && window.innerWidth >= 768) {
      loadNote(notes[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes.length]);

  const scheduleSave = (patch) => {
    if (!active || isTrash) return;
    setActive((prev) => (prev ? { ...prev, ...patch } : prev));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(patch), 1800);
  };

  const persist = async (patch = {}) => {
    if (!active || isTrash) return;
    const title = titleRef.current?.value ?? active.title;
    const content = editorRef.current?.innerHTML ?? active.content;
    setSaving(true);
    try {
      // Refs must win over any stale patch from the debounce timer
      const { data } = await axiosInstance.put(`/notebook/${active._id}`, {
        ...patch,
        title,
        content,
      });
      setActive(data);
      setSavedAt(data.updatedAt);
      setNotes((prev) =>
        prev.map((n) =>
          n._id === data._id
            ? {
                ...n,
                title: data.title,
                preview: (data.plainText || "").slice(0, 180),
                updatedAt: data.updatedAt,
                pinned: data.pinned,
                favorite: data.favorite,
                colorLabel: data.colorLabel,
                tags: data.tags,
              }
            : n
        )
      );
      fetchMeta();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const createNote = async () => {
    const { data } = await axiosInstance.post("/notebook", {
      title: "Untitled",
      content: "",
      folder: folderId || null,
    });
    await refresh();
    await loadNote(data._id);
    setMobilePanel("editor");
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const patchFlags = async (flags) => {
    if (!active) return;
    const { data } = await axiosInstance.put(`/notebook/${active._id}`, flags);
    setActive(data);
    await refresh();
  };

  const moveToTrash = async (id = active?._id) => {
    if (!id) return;
    await axiosInstance.delete(`/notebook/${id}`);
    setActive(null);
    setSelectedId(null);
    await refresh();
    setMobilePanel("list");
  };

  const restoreNote = async () => {
    if (!active) return;
    await axiosInstance.post(`/notebook/${active._id}/restore`);
    await refresh();
    setView("all");
  };

  const permanentDelete = async () => {
    if (!active || !confirm("Permanently delete this note?")) return;
    await axiosInstance.delete(`/notebook/${active._id}/permanent`);
    setActive(null);
    await refresh();
  };

  const duplicateNote = async () => {
    if (!active) return;
    const { data } = await axiosInstance.post(`/notebook/${active._id}/duplicate`);
    await refresh();
    await loadNote(data._id);
  };

  const copyLink = async () => {
    if (!active) return;
    const url = `${window.location.origin}${window.location.pathname}#/notes?id=${active._id}`;
    await navigator.clipboard.writeText(url);
    alert("Link copied");
  };

  const exportNote = (type) => {
    if (!active) return;
    const title = active.title || "note";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1>${active.content || ""}</body></html>`;
    if (type === "html") {
      saveAs(new Blob([html], { type: "text/html" }), `${title}.html`);
    } else if (type === "markdown") {
      const md = `# ${title}\n\n${stripToMd(active.content || "")}`;
      saveAs(new Blob([md], { type: "text/markdown" }), `${title}.md`);
    } else if (type === "word") {
      saveAs(new Blob([html], { type: "application/msword" }), `${title}.doc`);
    } else if (type === "pdf") {
      const w = window.open("", "_blank");
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    }
  };

  const stripToMd = (html) =>
    String(html)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<li>/gi, "- ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

  const onEditorInput = () => {
    scheduleSave({ content: editorRef.current?.innerHTML });
  };

  const insertTable = () => {
    exec(
      "insertHTML",
      `<table style="width:100%;border-collapse:collapse;margin:8px 0"><tr><td style="border:1px solid #ccc;padding:6px"> </td><td style="border:1px solid #ccc;padding:6px"> </td></tr><tr><td style="border:1px solid #ccc;padding:6px"> </td><td style="border:1px solid #ccc;padding:6px"> </td></tr></table><p><br></p>`
    );
    onEditorInput();
  };

  const insertChecklist = () => {
    exec(
      "insertHTML",
      `<div><label><input type="checkbox"/> Checklist item</label></div>`
    );
    onEditorInput();
  };

  const insertLink = () => {
    const url = prompt("URL");
    if (url) exec("createLink", url);
  };

  const insertEmoji = () => {
    const emoji = prompt("Emoji", "📝");
    if (emoji) exec("insertText", emoji);
  };

  const setReminder = async (preset) => {
    if (!active) return;
    let at = new Date();
    let label = "";
    let recur = "none";
    if (preset === "tomorrow") {
      at = setMinutes(setHours(addDays(new Date(), 1), 9), 0);
      label = "Tomorrow 9 AM";
    } else if (preset === "monday") {
      at = setMinutes(setHours(nextMonday(new Date()), 9), 0);
      label = "Next Monday";
    } else if (preset === "3days") {
      at = setMinutes(setHours(addDays(new Date(), 3), 9), 0);
      label = "After 3 Days";
    } else if (preset === "daily") {
      at = setMinutes(setHours(addDays(new Date(), 1), 9), 0);
      label = "Daily";
      recur = "daily";
    } else if (preset === "weekly") {
      at = setMinutes(setHours(addDays(new Date(), 7), 9), 0);
      label = "Weekly";
      recur = "weekly";
    } else if (preset === "monthly") {
      at = setMinutes(setHours(addDays(new Date(), 30), 9), 0);
      label = "Monthly";
      recur = "monthly";
    } else if (preset === "custom") {
      const raw = prompt("Date/time (YYYY-MM-DD HH:mm)", format(addDays(new Date(), 1), "yyyy-MM-dd HH:mm"));
      if (!raw) return;
      at = new Date(raw.replace(" ", "T"));
      label = "Custom";
    } else if (preset === "clear") {
      await patchFlags({ reminder: null });
      setReminderOpen(false);
      return;
    }
    await patchFlags({ reminder: { at, recur, label } });
    setReminderOpen(false);
  };

  const restoreVersion = async (versionId) => {
    const { data } = await axiosInstance.post(
      `/notebook/${active._id}/versions/${versionId}/restore`
    );
    setActive(data);
    if (editorRef.current) {
      editorRef.current.innerHTML = data.content || "";
      editorRef.current.dataset.noteId = data._id;
    }
    if (titleRef.current) titleRef.current.value = data.title || "";
    setHistoryOpen(false);
    refresh();
  };

  const createFolder = async () => {
    if (!folderName.trim()) return;
    await axiosInstance.post("/notebook/folders", {
      name: folderName.trim(),
      parent: folderParent || null,
    });
    setFolderDialog(false);
    setFolderName("");
    setFolderParent("");
    fetchMeta();
  };

  const deleteFolder = async (id) => {
    if (!confirm("Delete folder? Notes will be unfiled.")) return;
    await axiosInstance.delete(`/notebook/folders/${id}`);
    if (folderId === id) setFolderId("");
    fetchMeta();
    refresh();
  };

  const addTag = async () => {
    const t = tagInput.trim();
    if (!t || !active) return;
    const tags = [...new Set([...(active.tags || []), t])];
    setTagInput("");
    await patchFlags({ tags });
  };

  const removeTag = async (t) => {
    await patchFlags({ tags: (active.tags || []).filter((x) => x !== t) });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        createNote();
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        persist();
      }
      if (mod && e.key.toLowerCase() === "f") {
        e.preventDefault();
        document.getElementById("notes-search")?.focus();
      }
      if (mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (active) patchFlags({ pinned: !active.pinned });
      }
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
      if (e.key === "Delete" && document.activeElement === document.body && active && !isTrash) {
        moveToTrash();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, fullscreen, isTrash]);

  // Infinite scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (!hasMore || loading) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
        fetchNotes({ append: true });
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasMore, loading, fetchNotes]);

  // Deep link
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const id = params.get("id");
    if (id) loadNote(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const folderTree = useMemo(() => {
    const roots = (meta.folders || []).filter((f) => !f.parent);
    const kids = (parentId) => (meta.folders || []).filter((f) => String(f.parent) === String(parentId));
    return { roots, kids };
  }, [meta.folders]);

  const selectView = (id) => {
    setView(id);
    setFolderId("");
    setTagFilter("");
    setMobilePanel("list");
  };

  const shellClass = cn(
    "-mx-4 -my-4 flex overflow-hidden border border-border bg-card sm:-mx-6 md:-mx-6 md:-my-6 lg:-mx-8 lg:-my-8",
    fullscreen
      ? "fixed inset-0 z-50 m-0 h-screen rounded-none"
      : "h-[calc(100dvh-7.5rem)] rounded-xl shadow-sm md:h-[calc(100dvh-5.5rem)]"
  );

  return (
    <div className={shellClass}>
      {/* LEFT SIDEBAR */}
      <aside
        className={cn(
          "w-64 shrink-0 flex-col border-r border-border bg-muted/30",
          mobilePanel === "sidebar" ? "flex absolute inset-y-0 left-0 z-20 w-[85%] max-w-xs shadow-xl md:static md:flex" : "hidden md:flex"
        )}
      >
        <div className="space-y-2 border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="notes-search"
              className="h-9 pl-8"
              placeholder="Search notes…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
          </div>
          <Button className="w-full gap-2" size="sm" onClick={createNote}>
            <Plus className="h-4 w-4" /> New Note
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-2">
          <div>
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Folders
            </p>
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectView(id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  view === id && !folderId && !tagFilter
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground/80 hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                <span className="text-xs text-muted-foreground">{meta.counts?.[id] ?? 0}</span>
              </button>
            ))}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between px-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Custom folders
              </p>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setFolderDialog(true)}
              >
                + New
              </button>
            </div>
            {folderTree.roots.map((f) => (
              <div key={f._id}>
                <button
                  type="button"
                  onClick={() => {
                    setView("all");
                    setFolderId(f._id);
                    setTagFilter("");
                    setMobilePanel("list");
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    deleteFolder(f._id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                    folderId === f._id ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"
                  )}
                >
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate text-left">{f.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {meta.counts?.folders?.[f._id] ?? 0}
                  </span>
                </button>
                {folderTree.kids(f._id).map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      setView("all");
                      setFolderId(c._id);
                      setMobilePanel("list");
                    }}
                    className={cn(
                      "ml-4 flex w-[calc(100%-1rem)] items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm",
                      folderId === c._id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                  >
                    <Folder className="h-3.5 w-3.5" />
                    <span className="flex-1 truncate text-left">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {meta.counts?.folders?.[c._id] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            ))}
            {!folderTree.roots.length && (
              <p className="px-2 text-xs text-muted-foreground">No custom folders</p>
            )}
          </div>

          <div>
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tags
            </p>
            <div className="flex flex-wrap gap-1 px-1">
              {(meta.tags || []).map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => {
                    setTagFilter(t.name);
                    setFolderId("");
                    setView("all");
                    setMobilePanel("list");
                  }}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs",
                    tagFilter === t.name
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t.name} · {t.count}
                </button>
              ))}
              {!meta.tags?.length && (
                <p className="px-1 text-xs text-muted-foreground">No tags yet</p>
              )}
            </div>
          </div>

          <div>
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent
            </p>
            {(meta.recent || []).map((r) => (
              <button
                key={r._id}
                type="button"
                onClick={() => loadNote(r._id)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className="truncate flex-1">{r.title || "Untitled"}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* MIDDLE LIST */}
      <section
        className={cn(
          "w-full shrink-0 flex-col border-r border-border md:w-80 lg:w-96",
          mobilePanel === "list" ? "flex" : "hidden md:flex",
          fullscreen && "hidden"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobilePanel("sidebar")}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm font-medium">
            {total} note{total === 1 ? "" : "s"}
          </p>
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto">
          {loading && !notes.length ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : !notes.length ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No notes here yet.</p>
          ) : (
            notes.map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => loadNote(n._id)}
                className={cn(
                  "relative w-full border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  selectedId === n._id && "bg-primary/5"
                )}
              >
                {n.colorLabel && (
                  <span className={cn("absolute left-0 top-0 h-full w-1", COLOR_BAR[n.colorLabel])} />
                )}
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 font-medium">
                    {highlightMatch(n.title || "Untitled", q)}
                  </p>
                  <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
                    {n.pinned && <Pin className="h-3 w-3 fill-current text-amber-500" />}
                    {n.favorite && <Star className="h-3 w-3 fill-current text-amber-500" />}
                    {n.locked && <Lock className="h-3 w-3" />}
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {highlightMatch(n.preview || "No additional text", q)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>
                    {formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}
                  </span>
                  {n.folder?.name && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                      {n.folder.name}
                    </Badge>
                  )}
                  {(n.tags || []).slice(0, 2).map((t) => (
                    <span key={t} className="rounded bg-muted px-1.5 py-0.5">
                      #{t}
                    </span>
                  ))}
                  {n.reminder?.at && (
                    <span className="inline-flex items-center gap-0.5 text-amber-600">
                      <Clock className="h-3 w-3" /> Reminder
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
          {hasMore && (
            <p className="py-3 text-center text-xs text-muted-foreground">Scroll for more…</p>
          )}
        </div>
      </section>

      {/* RIGHT EDITOR */}
      <section
        className={cn(
          "relative min-w-0 flex-1 flex-col bg-background",
          mobilePanel === "editor" ? "flex" : "hidden md:flex"
        )}
      >
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <FileText className="h-12 w-12 opacity-30" />
            <p className="text-sm">Select a note or create a new one</p>
            <Button onClick={createNote} className="gap-2">
              <Plus className="h-4 w-4" /> New Note
            </Button>
          </div>
        ) : (
          <>
            {/* Editor header */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:hidden"
                onClick={() => setMobilePanel("list")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex flex-1 flex-wrap items-center gap-1">
                <ToolbarButton
                  title="Pin"
                  onClick={() => patchFlags({ pinned: !active.pinned })}
                  active={active.pinned}
                >
                  <Pin className={cn("h-4 w-4", active.pinned && "fill-current text-amber-500")} />
                </ToolbarButton>
                <ToolbarButton
                  title="Favorite"
                  onClick={() => patchFlags({ favorite: !active.favorite })}
                  active={active.favorite}
                >
                  <Star className={cn("h-4 w-4", active.favorite && "fill-current text-amber-500")} />
                </ToolbarButton>
                <ToolbarButton
                  title="Archive"
                  onClick={() => patchFlags({ archived: !active.archived })}
                >
                  <Archive className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton title="Reminder" onClick={() => setReminderOpen(true)}>
                  <Clock className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  title={active.locked ? "Unlock" : "Lock"}
                  onClick={() => {
                    if (active.locked && !unlocked) setUnlocked(true);
                    else patchFlags({ locked: !active.locked });
                  }}
                >
                  {active.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </ToolbarButton>
                <ToolbarButton title="History" onClick={() => setHistoryOpen(true)}>
                  <History className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton title="More" onClick={() => setMoreOpen(true)}>
                  <MoreHorizontal className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  title={fullscreen ? "Exit full screen" : "Full screen"}
                  onClick={() => setFullscreen((f) => !f)}
                >
                  {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </ToolbarButton>
              </div>

              <div className="text-[11px] text-muted-foreground">
                {saving ? "Saving…" : savedAt ? `Saved ${formatDistanceToNow(new Date(savedAt), { addSuffix: true })}` : ""}
              </div>

              {!isTrash ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-rose-600"
                  onClick={() => moveToTrash()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={restoreNote}>
                    Restore
                  </Button>
                  <Button size="sm" variant="destructive" onClick={permanentDelete}>
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {/* Formatting toolbar */}
            {!isTrash && unlocked && (
              <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-background/95 px-2 py-1.5 backdrop-blur">
                <ToolbarButton title="Bold" onClick={() => exec("bold")}>
                  <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Italic" onClick={() => exec("italic")}>
                  <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Underline" onClick={() => exec("underline")}>
                  <Underline className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Heading" onClick={() => exec("formatBlock", "h2")}>
                  <Heading className="h-3.5 w-3.5" />
                </ToolbarButton>
                <span className="mx-1 h-4 w-px bg-border" />
                <ToolbarButton title="Bullet list" onClick={() => exec("insertUnorderedList")}>
                  <List className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Numbered list" onClick={() => exec("insertOrderedList")}>
                  <ListOrdered className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Checklist" onClick={insertChecklist}>
                  <CheckSquare className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Quote" onClick={() => exec("formatBlock", "blockquote")}>
                  <Quote className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Code" onClick={() => exec("formatBlock", "pre")}>
                  <Code className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Highlight" onClick={() => exec("hiliteColor", "#fef08a")}>
                  <Highlighter className="h-3.5 w-3.5" />
                </ToolbarButton>
                <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-muted" title="Text color">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="color"
                    className="sr-only"
                    onChange={(e) => exec("foreColor", e.target.value)}
                  />
                </label>
                <span className="mx-1 h-4 w-px bg-border" />
                <ToolbarButton title="Undo" onClick={() => exec("undo")}>
                  <Undo2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Redo" onClick={() => exec("redo")}>
                  <Redo2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Link" onClick={insertLink}>
                  <LinkIcon className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Table" onClick={insertTable}>
                  <Table className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Emoji" onClick={insertEmoji}>
                  <Smile className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Divider" onClick={() => { exec("insertHorizontalRule"); onEditorInput(); }}>
                  <Minus className="h-3.5 w-3.5" />
                </ToolbarButton>

                <span className="mx-1 h-4 w-px bg-border" />
                {AI_ACTIONS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    disabled
                    title={`${label} (coming soon)`}
                    className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[11px] text-muted-foreground/60"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span className="hidden xl:inline">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8">
              {active.locked && !unlocked ? (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <Lock className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">This note is locked</p>
                  <Button onClick={() => setUnlocked(true)}>Unlock</Button>
                </div>
              ) : (
                <>
                  <input
                    ref={titleRef}
                    disabled={isTrash}
                    onChange={() => scheduleSave({ title: titleRef.current?.value })}
                    placeholder="Title"
                    className="mb-2 w-full border-0 bg-transparent font-display text-2xl font-semibold outline-none placeholder:text-muted-foreground/50 sm:text-3xl"
                  />

                  <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Created {format(new Date(active.createdAt), "dd MMM yyyy HH:mm")}
                      {active.user?.name ? ` · ${active.user.name}` : ""}
                    </span>
                    <span>·</span>
                    <span>Modified {format(new Date(active.updatedAt), "dd MMM yyyy HH:mm")}</span>
                    {active.reminder?.at && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      >
                        <Clock className="h-3 w-3" />
                        {active.reminder.label || format(new Date(active.reminder.at), "dd MMM HH:mm")}
                        {active.reminder.recur !== "none" ? ` · ${active.reminder.recur}` : ""}
                      </Badge>
                    )}
                  </div>

                  {/* Folder / tags / color */}
                  {!isTrash && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        value={active.folder?._id || active.folder || ""}
                        onChange={(e) => patchFlags({ folder: e.target.value || null })}
                      >
                        <option value="">No folder</option>
                        {(meta.folders || []).map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        value={active.colorLabel || ""}
                        onChange={(e) => patchFlags({ colorLabel: e.target.value })}
                      >
                        {COLORS.map((c) => (
                          <option key={c.id || "none"} value={c.id}>
                            Color: {c.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        {(active.tags || []).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => removeTag(t)}
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                          >
                            #{t} <X className="h-3 w-3" />
                          </button>
                        ))}
                        <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                          placeholder="Add tag"
                          className="h-7 w-24 rounded border border-dashed border-input bg-transparent px-2 text-xs outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div
                    ref={editorRef}
                    contentEditable={!isTrash}
                    suppressContentEditableWarning
                    onInput={onEditorInput}
                    className="min-h-[40vh] max-w-none text-[15px] leading-relaxed outline-none focus:outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-sm [&_table]:w-full [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  />
                </>
              )}
            </div>
          </>
        )}
      </section>

      {/* Mobile FAB */}
      {mobilePanel === "list" && (
        <button
          type="button"
          onClick={createNote}
          className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
          aria-label="New note"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Backdrop for mobile sidebar */}
      {mobilePanel === "sidebar" && (
        <button
          type="button"
          className="absolute inset-0 z-10 bg-black/40 md:hidden"
          aria-label="Close sidebar"
          onClick={() => setMobilePanel("list")}
        />
      )}

      {/* Folder dialog */}
      <Dialog open={folderDialog} onOpenChange={setFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={folderParent}
              onChange={(e) => setFolderParent(e.target.value)}
            >
              <option value="">Top level</option>
              {(meta.folders || []).map((f) => (
                <option key={f._id} value={f._id}>
                  Nested under: {f.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder dialog */}
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Reminder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {[
              ["tomorrow", "Tomorrow 9 AM"],
              ["monday", "Next Monday"],
              ["3days", "After 3 Days"],
              ["custom", "Custom Date"],
              ["daily", "Recurring: Daily"],
              ["weekly", "Recurring: Weekly"],
              ["monthly", "Recurring: Monthly"],
              ["clear", "Clear reminder"],
            ].map(([id, label]) => (
              <Button key={id} variant="outline" className="justify-start" onClick={() => setReminder(id)}>
                {label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* History */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {(active?.versions || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No previous versions yet.</p>
            )}
            {(active?.versions || []).map((v) => (
              <div
                key={v._id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{v.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(v.savedAt), "dd MMM yyyy HH:mm")}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => restoreVersion(v._id)}>
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* More / export */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note Actions</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start gap-2" onClick={() => { duplicateNote(); setMoreOpen(false); }}>
              <Copy className="h-4 w-4" /> Duplicate note
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => { copyLink(); setMoreOpen(false); }}>
              <LinkIcon className="h-4 w-4" /> Copy link
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => { exportNote("markdown"); setMoreOpen(false); }}>
              <Download className="h-4 w-4" /> Export Markdown
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => { exportNote("html"); setMoreOpen(false); }}>
              <Download className="h-4 w-4" /> Export HTML
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => { exportNote("word"); setMoreOpen(false); }}>
              <Download className="h-4 w-4" /> Export Word
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => { exportNote("pdf"); setMoreOpen(false); }}>
              <Printer className="h-4 w-4" /> Print / PDF
            </Button>
            <Button variant="outline" className="justify-start gap-2" disabled title="Internal share coming soon">
              <Sparkles className="h-4 w-4" /> Share internally (soon)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
