import { useEffect, useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  getDaysInMonth,
  getDay,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import axiosInstance from "../api/axios";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(d) {
  return format(d, "yyyy-MM-dd");
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dayOpen, setDayOpen] = useState(false);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const fetchNotes = async () => {
    const { data } = await axiosInstance.get(`/notes?year=${year}`);
    setNotes(data);
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const noteDates = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => set.add(dateKey(new Date(n.date))));
    return set;
  }, [notes]);

  const dayNotes = useMemo(() => {
    if (!selected) return [];
    return notes.filter((n) => isSameDay(new Date(n.date), selected));
  }, [notes, selected]);

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const days = getDaysInMonth(first);
    const offset = getDay(first);
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1)),
    ];
  }, [cursor, year, month]);

  const weekRows = Math.ceil(cells.length / 7);

  const openDay = (day) => {
    setSelected(day);
    setText("");
    setEditingId(null);
    setDayOpen(true);
  };

  const resetForm = () => {
    setText("");
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!text.trim() || !selected) return;
    try {
      if (editingId) {
        await axiosInstance.put(`/notes/${editingId}`, { text: text.trim() });
      } else {
        await axiosInstance.post("/notes", {
          date: dateKey(selected),
          text: text.trim(),
        });
      }
      resetForm();
      await fetchNotes();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save note");
    }
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setText(note.text);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this note?")) return;
    try {
      await axiosInstance.delete(`/notes/${id}`);
      if (editingId === id) resetForm();
      await fetchNotes();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete note");
    }
  };

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] flex-col gap-4 md:h-[calc(100dvh-6.5rem)]">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Shared team calendar — all users can view and edit notes
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor((d) => subMonths(d, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[9rem] text-center text-lg font-semibold">
            {format(cursor, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor((d) => addMonths(d, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col border-border">
        <CardContent className="flex min-h-0 flex-1 flex-col p-3 sm:p-5">
          <div className="mb-2 grid shrink-0 grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground sm:mb-3 sm:gap-2 sm:text-sm">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1.5 sm:py-2">
                {d}
              </div>
            ))}
          </div>
          <div
            className="grid min-h-0 flex-1 grid-cols-7 gap-1 sm:gap-2"
            style={{ gridTemplateRows: `repeat(${weekRows}, minmax(0, 1fr))` }}
          >
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="min-h-0" />;
              const key = dateKey(day);
              const hasNotes = noteDates.has(key);
              const active = selected && isSameDay(day, selected);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openDay(day)}
                  className={cn(
                    "relative flex min-h-0 w-full flex-col items-center justify-center rounded-xl text-base transition-colors sm:text-lg",
                    "hover:bg-muted",
                    isToday(day) && !active && "font-semibold text-vivid-lilac ring-1 ring-vivid-lilac/40",
                    active && "bg-vivid-lilac text-white hover:bg-vivid-lilac/90",
                    !active && hasNotes && "font-medium"
                  )}
                >
                  {day.getDate()}
                  {hasNotes && (
                    <span
                      className={cn(
                        "absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full sm:bottom-3",
                        active ? "bg-white" : "bg-vivid-lilac"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dayOpen}
        onOpenChange={(v) => {
          setDayOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selected ? format(selected, "dd MMM yyyy") : "Notes"}
            </DialogTitle>
          </DialogHeader>

          <div className="-mr-2 flex-1 space-y-4 overflow-y-auto py-2 pr-2">
            {dayNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes for this date.</p>
            ) : (
              <ul className="space-y-2">
                {dayNotes.map((note) => (
                  <li
                    key={note._id}
                    className={cn(
                      "rounded-lg border border-border px-3 py-2.5",
                      editingId === note._id && "border-vivid-lilac/50 bg-muted/40"
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm">{note.text}</p>
                    {note.user?.name && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        by {note.user.name}
                      </p>
                    )}
                    <div className="mt-2 flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => startEdit(note)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-vivid-coral hover:bg-block-coral/30 hover:text-vivid-coral"
                        onClick={() => handleDelete(note._id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-1.5 border-t border-border pt-4">
              <Label>{editingId ? "Edit note" : "Add note"}</Label>
              <textarea
                className="flex min-h-[88px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Write a note…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancel edit
              </Button>
            )}
            <Button onClick={handleSave} disabled={!text.trim()} className="gap-2">
              <Plus className="h-4 w-4" />
              {editingId ? "Update" : "Add"} note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
