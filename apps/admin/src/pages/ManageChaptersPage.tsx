import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { handleError } from "@/lib/errors";
import { api } from "@memo-hack/convex";
import { useMutation, useQuery } from "convex/react";
import type { GenericId } from "convex/values";
import {
    BookOpen,
    Edit3,
    FileText,
    Loader2,
    Play,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface VideoForm {
  title: string;
  description?: string;
  youtubeUrl: string;
}

interface NoteForm {
  name: string;
  url: string;
}

interface ChapterForm {
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  class: string;
  subject: string;
  videos: VideoForm[];
  notes: NoteForm[];
}

const CLASSES = ["9", "10", "11", "12"];
const SUBJECTS = ["physics", "biology"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

const difficultyColors: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  Advanced: "bg-red-100 text-red-700 border-red-200",
};

export default function ManageChaptersPage() {
  const { token } = useAuth();

  const [selectedSubject, setSelectedSubject] = useState("physics");
  const [selectedClass, setSelectedClass] = useState("9");
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<ChapterForm>({
    title: "",
    description: "",
    difficulty: "Beginner",
    class: "9",
    subject: "physics",
    videos: [],
    notes: [],
  });

  const allChapters = useQuery(api.chapter.getAllChapters);
  const createChapter = useMutation(api.chapter.createChapter);
  const updateChapter = useMutation(api.chapter.updateChapter);
  const deleteChapter = useMutation(api.chapter.deleteChapter);

  const filteredChapters =
    allChapters?.[selectedSubject]?.[selectedClass] ?? [];

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      difficulty: "Beginner",
      class: selectedClass,
      subject: selectedSubject,
      videos: [],
      notes: [],
    });
    setEditingChapter(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (chapter: any) => {
    setEditingChapter(chapter);
    setForm({
      title: chapter.title,
      description: chapter.description,
      difficulty: chapter.difficulty,
      class: chapter.class,
      subject: chapter.subject,
      videos: chapter.videos ?? [],
      notes: chapter.notes ?? [],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const addVideo = () =>
    setForm((prev) => ({
      ...prev,
      videos: [...prev.videos, { title: "", description: "", youtubeUrl: "" }],
    }));

  const updateVideo = (i: number, field: keyof VideoForm, value: string) =>
    setForm((prev) => ({
      ...prev,
      videos: prev.videos.map((v, idx) =>
        idx === i ? { ...v, [field]: value } : v,
      ),
    }));

  const removeVideo = (i: number) =>
    setForm((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, idx) => idx !== i),
    }));

  const addNote = () =>
    setForm((prev) => ({
      ...prev,
      notes: [...prev.notes, { name: "", url: "" }],
    }));

  const updateNote = (i: number, field: keyof NoteForm, value: string) =>
    setForm((prev) => ({
      ...prev,
      notes: prev.notes.map((n, idx) =>
        idx === i ? { ...n, [field]: value } : n,
      ),
    }));

  const removeNote = (i: number) =>
    setForm((prev) => ({
      ...prev,
      notes: prev.notes.filter((_, idx) => idx !== i),
    }));

  const handleSave = async () => {
    if (!token) return;
    if (!form.title.trim()) {
      toast.error("Chapter title is required");
      return;
    }
    setLoading(true);
    try {
      const validVideos = form.videos.filter((v) => v.title && v.youtubeUrl);
      if (editingChapter) {
        await updateChapter({
          token,
          chapterId: editingChapter._id as GenericId<"chapters">,
          title: form.title,
          description: form.description,
          difficulty: form.difficulty,
          videos: validVideos,
          notes: form.notes,
        });
        toast.success("Chapter updated successfully");
      } else {
        await createChapter({
          token,
          title: form.title,
          description: form.description,
          difficulty: form.difficulty,
          class: form.class,
          subject: form.subject,
          videos: validVideos,
          notes: form.notes,
        });
        toast.success("Chapter created successfully");
      }
      closeModal();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chapter: any) => {
    if (!token) return;
    if (!window.confirm(`Delete "${chapter.title}"? This cannot be undone.`))
      return;
    try {
      await deleteChapter({ token, chapterId: chapter._id });
      toast.success("Chapter deleted");
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Chapters</h1>
          <p className="text-slate-500 text-sm mt-1">
            Create, edit, and delete chapters for all subjects and classes.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-5 gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          New Chapter
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 mb-4">
          Filter Content
        </p>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">
              Subject
            </p>
            <div className="flex gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSubject(s)}
                  className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md ${
                    selectedSubject === s
                      ? "bg-indigo-600 text-white shadow-indigo-200"
                      : "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">
              Class
            </p>
            <div className="flex gap-2">
              {CLASSES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md ${
                    selectedClass === c
                      ? "bg-indigo-600 text-white shadow-indigo-200"
                      : "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 capitalize">
            {selectedSubject} — Class {selectedClass}
          </h2>
          <span className="text-sm text-slate-500">
            {allChapters === undefined
              ? "Loading..."
              : `${filteredChapters.length} chapters`}
          </span>
        </div>

        {allChapters === undefined ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : filteredChapters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-700 font-semibold text-lg">
              No chapters found
            </p>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              No chapters exist for {selectedSubject} Class {selectedClass} yet.
            </p>
            <Button
              onClick={openCreate}
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Create First Chapter
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChapters.map((chapter: any) => (
              <div
                key={chapter._id}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/70 p-5 flex items-start justify-between hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:shadow-indigo-100/40 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-900">
                      {chapter.title}
                    </h3>
                    <Badge
                      className={`text-xs px-2 py-0.5 border ${difficultyColors[chapter.difficulty] ?? ""}`}
                      variant="outline"
                    >
                      {chapter.difficulty}
                    </Badge>
                  </div>
                  {chapter.description && (
                    <p className="text-slate-500 text-sm mb-2 line-clamp-2">
                      {chapter.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {chapter.videos?.length ?? 0} videos
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {chapter.notes?.length ?? 0} notes
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => openEdit(chapter)}
                    className="cursor-pointer p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-blue-200"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(chapter)}
                    className="cursor-pointer p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-red-200"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingChapter ? "Edit Chapter" : "Create Chapter"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Basic info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">
                Chapter Information
              </h3>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Chapter title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Chapter description"
                  rows={3}
                />
              </div>

              {!editingChapter && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <div className="flex gap-2">
                      {SUBJECTS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, subject: s }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                            form.subject === s
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <div className="flex gap-2 flex-wrap">
                      {CLASSES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, class: c }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            form.class === c
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, difficulty: d }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        form.difficulty === d
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Videos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Videos</h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={addVideo}
                  variant="outline"
                  className="rounded-lg gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <Plus className="w-3 h-3" />
                  Add Video
                </Button>
              </div>

              {form.videos.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">
                  No videos added yet. Click "Add Video" to start.
                </p>
              ) : (
                form.videos.map((video, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-xl p-4 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-700">
                        Video {i + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeVideo(i)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <Input
                      value={video.title}
                      onChange={(e) => updateVideo(i, "title", e.target.value)}
                      placeholder="Video title"
                    />
                    <Input
                      value={video.youtubeUrl}
                      onChange={(e) =>
                        updateVideo(i, "youtubeUrl", e.target.value)
                      }
                      placeholder="YouTube URL or Video ID"
                    />
                    <Input
                      value={video.description ?? ""}
                      onChange={(e) =>
                        updateVideo(i, "description", e.target.value)
                      }
                      placeholder="Description (optional)"
                    />
                  </div>
                ))
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Study Notes</h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={addNote}
                  variant="outline"
                  className="rounded-lg gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <Plus className="w-3 h-3" />
                  Add Note
                </Button>
              </div>

              {form.notes.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">
                  No notes added yet.
                </p>
              ) : (
                form.notes.map((note, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={note.name}
                      onChange={(e) => updateNote(i, "name", e.target.value)}
                      placeholder="Note name"
                    />
                    <Input
                      value={note.url}
                      onChange={(e) => updateNote(i, "url", e.target.value)}
                      placeholder="PDF / Document URL"
                    />
                    <button
                      type="button"
                      onClick={() => removeNote(i)}
                      className="text-red-500 hover:text-red-600 p-1 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="cursor-pointer rounded-xl hover:bg-slate-100 transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editingChapter ? "Update Chapter" : "Create Chapter"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
