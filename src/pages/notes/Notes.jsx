import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFinance } from "../../context/FinanceContext";
import {
  Pin,
  Plus,
  Trash,
  Notebook,
  Check,
  X,
  Target,
  Flame,
  Briefcase,
  DollarSign,
  ShoppingCart,
  Heart,
  Compass,
  Lightbulb,
  Code,
  Edit2,
  Smile,
} from "lucide-react";

const ICON_MAP = {
  Notebook,
  Target,
  Flame,
  Briefcase,
  DollarSign,
  ShoppingCart,
  Heart,
  Compass,
  Lightbulb,
  Code,
};

const EMOJI_PRESETS = [
  "📝",
  "💰",
  "🎯",
  "🔥",
  "💼",
  "🛒",
  "❤️",
  "💡",
  "✈️",
  "🚀",
  "📊",
  "📅",
  "🔒",
  "🏠",
  "🌟",
  "🛠️",
  "🍀",
  "🎨",
  "🍕",
  "☕",
];

const CATEGORY_COLORS = {
  "Personal Finance OS": "#a78bfa",
  Work: "#60a5fa",
  Personal: "#34d399",
  Finance: "#fbbf24",
  Shopping: "#f472b6",
  Health: "#4ade80",
  Travel: "#38bdf8",
  Ideas: "#c084fc",
  General: "#94a3b8",
};

const COVER_PRESETS = [
  { id: "none", name: "None", style: "" },
  {
    id: "aurora",
    name: "Aurora",
    style: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #111827 100%)",
  },
  {
    id: "cyberpunk",
    name: "Neon",
    style: "linear-gradient(135deg, #581c87 0%, #1e1b4b 60%, #09090b 100%)",
  },
  {
    id: "sunset",
    name: "Abyss",
    style: "linear-gradient(135deg, #7c2d12 0%, #4c1d95 70%, #0f172a 100%)",
  },
  {
    id: "mono",
    name: "Matrix",
    style: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
  },
];

const NOTE_ACCENTS = [
  "#a78bfa",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#fb923c",
  "#38bdf8",
  "#4ade80",
];

function getNoteAccent(id) {
  const h = id ? id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  return NOTE_ACCENTS[h % NOTE_ACCENTS.length];
}

const convertToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = (error) => reject(error);
  });

export default function Notes() {
  const {
    notes: rawNotes,
    syncHeaders,
    triggerFetchCycle,
    addNotice,
  } = useFinance();

  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Personal Finance OS");
  const [itemsText, setItemsText] = useState("");
  const [iconType, setIconType] = useState("icon");
  const [selectedIcon, setSelectedIcon] = useState("Notebook");
  const [selectedCover, setSelectedCover] = useState("");

  const [orderedNotes, setOrderedNotes] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverSide, setDragOverSide] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editItemsText, setEditItemsText] = useState("");

  const saveTimerRef = useRef(null);
  const dragNodeRef = useRef(null);

  useEffect(() => {
    setOrderedNotes(rawNotes);
  }, [rawNotes]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isCreating) setIsCreating(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreating]);

  const persistOrder = useCallback(
    (notes) => {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        const updates = notes.map((n, i) => ({
          _id: n._id,
          position: i,
          column: 0,
        }));
        try {
          await fetch("http://localhost:5000/api/notes/reorder", {
            method: "PATCH",
            headers: syncHeaders(),
            body: JSON.stringify(updates),
          });
          setSavingId("done");
          setTimeout(() => setSavingId(null), 1400);
        } catch (_) {}
      }, 300);
    },
    [syncHeaders],
  );

  const onDragStart = (e, id) => {
    if (editingId) return;
    setDraggingId(id);
    dragNodeRef.current = id;
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
    setDragOverSide(null);
    dragNodeRef.current = null;
  };
  const onDragOver = (e, id) => {
    e.preventDefault();
    const mid =
      e.currentTarget.getBoundingClientRect().left +
      e.currentTarget.getBoundingClientRect().width / 2;
    setDragOverId(id);
    setDragOverSide(e.clientX < mid ? "left" : "right");
  };
  const onDrop = (e, toId) => {
    e.preventDefault();
    const fromId = dragNodeRef.current || draggingId;
    if (!fromId || fromId === toId) {
      onDragEnd();
      return;
    }
    setOrderedNotes((prev) => {
      const arr = [...prev];
      const fromIdx = arr.findIndex((n) => n._id === fromId);
      const toIdx = arr.findIndex((n) => n._id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      const insertAt =
        dragOverSide === "right"
          ? toIdx + (fromIdx > toIdx ? 1 : 0)
          : toIdx - (fromIdx < toIdx ? 1 : 0);
      arr.splice(Math.max(0, insertAt), 0, moved);
      persistOrder(arr);
      return arr;
    });
    onDragEnd();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        setSelectedCover(base64);
      } catch (err) {
        console.error("Error converting file:", err);
      }
    }
  };

  const resetCreateForm = () => {
    setTitle("");
    setItemsText("");
    setSelectedIcon("Notebook");
    setIconType("icon");
    setSelectedCover("");
    setTag("Personal Finance OS");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const cleanItems = itemsText
      .split("\n")
      .filter((t) => t.trim())
      .map((text) => ({ text, checked: false }));
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/notes", {
        method: "POST",
        headers: syncHeaders(),
        body: JSON.stringify({
          title,
          categoryTag: tag,
          items: cleanItems,
          icon: selectedIcon,
          image: selectedCover,
        }),
      }).then((r) => r.json());
      if (res.success || !res.error) {
        addNotice("Note saved.");
        resetCreateForm();
        setIsCreating(false);
        triggerFetchCycle();
      } else {
        addNotice(
          res.message || "Error: Could not save duplicate note structure.",
        );
      }
    } catch (error) {
      addNotice("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e, noteId) => {
    e.preventDefault();
    if (isSubmitting) return;
    const cleanItems = editItemsText
      .split("\n")
      .filter((t) => t.trim())
      .map((text) => ({ text, checked: false }));
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        method: "PUT",
        headers: syncHeaders(),
        body: JSON.stringify({
          title: editTitle,
          categoryTag: editTag,
          items: cleanItems,
        }),
      }).then((r) => r.json());
      if (res.success || !res.error) {
        addNotice("Note updated successfully.");
        setEditingId(null);
        triggerFetchCycle();
      } else {
        addNotice(
          res.message ||
            "Conflict Error: Could not overwrite into duplicate data.",
        );
      }
    } catch (error) {
      addNotice("Error updating record. Try alternative title configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (e, note) => {
    e.stopPropagation();
    setEditingId(note._id);
    setEditTitle(note.title);
    setEditTag(note.categoryTag);
    setEditItemsText(note.items.map((i) => i.text).join("\n"));
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const togglePin = async (item) => {
    await fetch(`http://localhost:5000/api/notes/${item._id}`, {
      method: "PUT",
      headers: syncHeaders(),
      body: JSON.stringify({ pinned: !item.pinned }),
    });
    triggerFetchCycle();
  };

  const handlePurge = async (id) => {
    await fetch(`http://localhost:5000/api/notes/${id}`, {
      method: "DELETE",
      headers: syncHeaders(),
    });
    addNotice("Note deleted.");
    triggerFetchCycle();
  };

  const toggleItem = async (note, idx) => {
    const updatedItems = note.items.map((it, i) =>
      i === idx ? { ...it, checked: !it.checked } : it,
    );
    await fetch(`http://localhost:5000/api/notes/${note._id}`, {
      method: "PUT",
      headers: syncHeaders(),
      body: JSON.stringify({ items: updatedItems }),
    });
    triggerFetchCycle();
  };

  // ── NoteCard Component ──
  const NoteCard = ({ note }) => {
    const accent = getNoteAccent(note._id);
    const catColor =
      CATEGORY_COLORS[note.categoryTag] || CATEGORY_COLORS.General;
    const isDragging = draggingId === note._id;
    const isOver = dragOverId === note._id && draggingId !== note._id;
    const isExpanded = expandedId === note._id;
    const isCurrentlyEditing = editingId === note._id;
    const checkedCount = note.items.filter((i) => i.checked).length;
    const totalCount = note.items.length;
    const isGradient = note.image && note.image.startsWith("linear-gradient");
    const isEmoji = note.icon && !ICON_MAP[note.icon];
    const CardIcon = ICON_MAP[note.icon] || Notebook;

    return (
      <div
        draggable={!isCurrentlyEditing}
        onDragStart={(e) => onDragStart(e, note._id)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, note._id)}
        onDrop={(e) => onDrop(e, note._id)}
        onClick={() =>
          !isCurrentlyEditing && setExpandedId(isExpanded ? null : note._id)
        }
        className={`relative border rounded-sm transition-all duration-150 overflow-hidden flex flex-col justify-between
          ${isDragging ? "opacity-30 scale-95" : ""}
          ${isOver ? "scale-[1.01]" : ""}
          ${note.pinned ? "border-yellow-500/20 bg-yellow-500/[0.03]" : "border-white/[0.07] bg-white/[0.02]"}
          ${isCurrentlyEditing ? "cursor-default border-white/20 bg-white/[0.05]" : "cursor-grab hover:bg-white/[0.04] hover:border-white/[0.12]"}
        `}
        style={{
          outline: isOver ? `1px solid ${accent}` : "none",
          outlineOffset: 2,
        }}
      >
        {note.image &&
          !isCurrentlyEditing &&
          (isGradient ? (
            <div
              className="w-full h-11 opacity-60 border-b border-white/[0.04]"
              style={{ background: note.image }}
            />
          ) : (
            <div className="w-full h-24 border-b border-white/[0.04] overflow-hidden relative">
              <img
                src={note.image}
                alt="cover"
                className="w-full h-full object-cover opacity-50"
              />
            </div>
          ))}

        <div
          className="absolute top-0 left-0 w-[2px] h-full"
          style={{
            background: note.pinned ? "#fbbf24" : accent,
            opacity: 0.85,
          }}
        />

        <div className="px-4 py-3 pl-5 flex-1 flex flex-col justify-between">
          {isCurrentlyEditing ? (
            <form
              onSubmit={(e) => handleUpdate(e, note._id)}
              onClick={(e) => e.stopPropagation()}
              className="space-y-3 w-full"
            >
              <div className="space-y-0.5">
                <label className="text-[8px] tracking-widest text-white/30 block">
                  EDIT TITLE
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-sm px-2 py-1 text-[11px] text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] tracking-widest text-white/30 block">
                  CATEGORY
                </label>
                <select
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-white/10 rounded-sm px-2 py-1 text-[11px] text-white focus:outline-none"
                >
                  {Object.keys(CATEGORY_COLORS).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] tracking-widest text-white/30 block">
                  ITEMS (ONE PER LINE)
                </label>
                <textarea
                  value={editItemsText}
                  onChange={(e) => setEditItemsText(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-sm px-2 py-1 text-[11px] text-white focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex-1 py-1 border border-white/10 rounded-sm text-[9px] tracking-widest text-white/40 hover:text-white/70 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-1 bg-white/10 hover:bg-white/15 border border-white/15 rounded-sm text-[9px] tracking-widest text-white/80 transition-colors disabled:opacity-40"
                >
                  {isSubmitting ? "SAVING..." : "UPDATE"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div
                    className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 mb-1.5"
                    style={{ background: `${catColor}15` }}
                  >
                    <div
                      className="w-1 h-1 rounded-full flex-shrink-0"
                      style={{ background: catColor }}
                    />
                    <span
                      className="text-[9px] tracking-[0.12em] font-semibold uppercase"
                      style={{ color: catColor }}
                    >
                      {note.categoryTag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isEmoji ? (
                      <span className="text-sm leading-none flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
                        {note.icon}
                      </span>
                    ) : (
                      <CardIcon
                        className="w-3.5 h-3.5 flex-shrink-0 opacity-50"
                        style={{ color: note.pinned ? "#fbbf24" : accent }}
                      />
                    )}
                    <h4 className="text-[12px] font-semibold text-white/80 tracking-tight leading-snug truncate">
                      {note.title}
                    </h4>
                  </div>
                </div>
                <div
                  className="flex gap-1.5 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => startEditing(e, note)}
                    className="w-6 h-6 rounded-sm border border-white/[0.08] text-white/25 hover:text-white/60 hover:border-white/20 flex items-center justify-center transition-all"
                    title="Edit Note"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => togglePin(note)}
                    className={`w-6 h-6 rounded-sm border flex items-center justify-center transition-all
                      ${note.pinned ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" : "border-white/[0.08] text-white/25 hover:text-white/60"}`}
                  >
                    <Pin
                      className="w-2.5 h-2.5"
                      fill={note.pinned ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    onClick={() => handlePurge(note._id)}
                    className="w-6 h-6 rounded-sm border border-white/[0.08] text-white/25 hover:text-red-400 hover:border-red-500/20 flex items-center justify-center transition-all"
                  >
                    <Trash className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {totalCount > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] tracking-[0.1em] text-white/25">
                      {checkedCount}/{totalCount} DONE
                    </span>
                    {checkedCount === totalCount && (
                      <span className="text-[9px] tracking-widest text-emerald-400">
                        ✓ COMPLETE
                      </span>
                    )}
                  </div>
                  <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${totalCount === 0 ? 0 : (checkedCount / totalCount) * 100}%`,
                        background:
                          checkedCount === totalCount ? "#4ade80" : accent,
                      }}
                    />
                  </div>
                </div>
              )}

              {isExpanded && totalCount > 0 && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col gap-2"
                >
                  {note.items.map((it, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleItem(note, idx)}
                      className="flex items-start gap-2.5 text-left group"
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-sm flex-shrink-0 mt-0.5 border flex items-center justify-center transition-all"
                        style={{
                          borderColor: it.checked
                            ? accent
                            : "rgba(255,255,255,0.12)",
                          background: it.checked
                            ? `${accent}20`
                            : "transparent",
                        }}
                      >
                        {it.checked && (
                          <Check
                            className="w-2 h-2"
                            style={{ color: accent }}
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <span
                        className={`text-[11px] leading-relaxed transition-all ${it.checked ? "text-white/25 line-through" : "text-white/55"}`}
                      >
                        {it.text}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isExpanded && totalCount > 0 && !isCurrentlyEditing && (
            <p className="mt-2 text-[9px] tracking-[0.1em] text-white/20">
              {totalCount} ITEM{totalCount !== 1 ? "S" : ""} — CLICK TO EXPAND
            </p>
          )}
        </div>
      </div>
    );
  };

  const pinnedNotes = orderedNotes.filter((n) => n.pinned);
  const unpinnedNotes = orderedNotes.filter((n) => !n.pinned);

  return (
    <div className="space-y-6 font-mono">
      {/* Header Panel */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-white/20 uppercase mb-1">
            Workspace
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white/90">
            Notes
          </h1>
          <p className="text-[10px] text-white/25 mt-0.5">
            {orderedNotes.length} memo{orderedNotes.length !== 1 ? "s" : ""}
            {savingId === "done" && (
              <span className="text-emerald-400/70 ml-2">✓ order saved</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 border rounded-sm text-[11px] tracking-widest transition-all bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.08] text-white/70"
        >
          <span className="text-white/40">+</span> NEW NOTE
        </button>
      </div>

      {/* ── Create Modal Overlay ── */}
      {isCreating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setIsCreating(false);
            resetCreateForm();
          }}
        >
          <div
            className="relative w-full max-w-lg mx-4 border border-white/[0.12] bg-[#0d0d0d] rounded-sm overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
              <p className="text-[9px] tracking-[0.2em] text-white/25 uppercase">
                New Memo Block Configurations
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  resetCreateForm();
                }}
                className="w-6 h-6 rounded-sm border border-white/[0.08] text-white/30 hover:text-white/70 hover:border-white/20 flex items-center justify-center transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleCreate}
              className="p-4 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  TITLE
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Icon / Emoji Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] tracking-widest text-white/25">
                      ASSIGN NOTE SYMBOL
                    </label>
                    <div className="flex gap-1 border border-white/[0.08] p-0.5 rounded-sm bg-black/20">
                      <button
                        type="button"
                        onClick={() => {
                          setIconType("icon");
                          setSelectedIcon("Notebook");
                        }}
                        className={`px-2 py-0.5 text-[9px] tracking-tight rounded-sm transition-all ${iconType === "icon" ? "bg-white/10 text-white font-bold" : "text-white/30 hover:text-white/50"}`}
                      >
                        ICONS
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIconType("emoji");
                          setSelectedIcon("📝");
                        }}
                        className={`px-2 py-0.5 text-[9px] tracking-tight rounded-sm transition-all ${iconType === "emoji" ? "bg-white/10 text-white font-bold" : "text-white/30 hover:text-white/50"}`}
                      >
                        EMOJIS
                      </button>
                    </div>
                  </div>

                  {iconType === "icon" ? (
                    <div className="grid grid-cols-5 gap-1.5 p-2 bg-white/[0.02] border border-white/[0.06] rounded-sm">
                      {Object.keys(ICON_MAP).map((iconName) => {
                        const TargetIcon = ICON_MAP[iconName];
                        return (
                          <button
                            type="button"
                            key={iconName}
                            onClick={() => setSelectedIcon(iconName)}
                            className={`p-2 border rounded-sm flex items-center justify-center transition-all ${
                              selectedIcon === iconName
                                ? "border-white/40 bg-white/10 text-white"
                                : "border-transparent text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
                            }`}
                            title={iconName}
                          >
                            <TargetIcon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-1.5 p-2 bg-white/[0.02] border border-white/[0.06] rounded-sm max-h-[106px] overflow-y-auto">
                      {EMOJI_PRESETS.map((emoji) => (
                        <button
                          type="button"
                          key={emoji}
                          onClick={() => setSelectedIcon(emoji)}
                          className={`p-1.5 border rounded-sm text-base flex items-center justify-center transition-all ${
                            selectedIcon === emoji
                              ? "border-white/40 bg-white/10"
                              : "border-transparent opacity-40 hover:opacity-90 hover:bg-white/[0.04]"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cover Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] tracking-widest text-white/25">
                    NOTE COVER CANVAS STYLE
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <div className="grid grid-cols-5 gap-1.5">
                      {COVER_PRESETS.map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setSelectedCover(p.style)}
                          className={`h-8 border rounded-sm text-[9px] font-sans font-bold transition-all overflow-hidden relative ${
                            selectedCover === p.style
                              ? "border-white/60 ring-1 ring-white/20"
                              : "border-white/[0.08]"
                          }`}
                          style={{
                            background:
                              p.id !== "none"
                                ? p.style
                                : "rgba(255,255,255,0.02)",
                          }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white/80 font-mono tracking-tighter text-[8px]">
                            {p.name.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <label className="flex-1 border border-dashed border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.03] rounded-sm px-3 py-1.5 cursor-pointer text-center transition-all">
                        <span className="text-[10px] tracking-widest text-white/40 block">
                          {selectedCover &&
                          selectedCover.startsWith("data:image")
                            ? "✓ CUSTOM IMAGE ATTACHED"
                            : "📥 UPLOAD CUSTOM COVER"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {selectedCover && (
                        <button
                          type="button"
                          onClick={() => setSelectedCover("")}
                          className="border border-white/10 px-2.5 py-1.5 rounded-sm text-[10px] text-white/40 hover:text-red-400 hover:border-red-500/20 transition-colors"
                        >
                          RESET
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] tracking-widest text-white/25">
                    CATEGORY TAG
                  </label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none cursor-pointer"
                  >
                    {Object.keys(CATEGORY_COLORS).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5 pt-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: CATEGORY_COLORS[tag] || "#94a3b8" }}
                    />
                    <span className="text-[9px] text-white/25 tracking-widest">
                      {tag.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] tracking-widest text-white/25">
                    ITEMS (ONE PER LINE)
                  </label>
                  <textarea
                    value={itemsText}
                    onChange={(e) => setItemsText(e.target.value)}
                    placeholder={"Buy index funds\nReview budget"}
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    resetCreateForm();
                  }}
                  className="flex-1 py-2 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] rounded-sm text-[10px] tracking-widest text-white/70 transition-all disabled:opacity-40"
                >
                  {isSubmitting ? "SAVING..." : "CREATE NOTE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="w-2.5 h-2.5 text-yellow-400" fill="#fbbf24" />
            <span className="text-[9px] tracking-[0.2em] text-white/25 uppercase">
              Pinned
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedNotes.map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* Unpinned Notes */}
      {unpinnedNotes.length > 0 && (
        <div className="space-y-3">
          {pinnedNotes.length > 0 && (
            <span className="text-[9px] tracking-[0.2em] text-white/25 uppercase">
              Notes
            </span>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unpinnedNotes.map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {orderedNotes.length === 0 && (
        <div className="border border-white/[0.06] rounded-sm bg-white/[0.01]">
          <div className="py-16 flex flex-col items-center gap-3 text-white/20">
            <Notebook className="w-8 h-8 opacity-30" />
            <p className="text-[11px] tracking-widest">NO NOTES YET</p>
            <p className="text-[10px] text-white/15">
              Create one above to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
