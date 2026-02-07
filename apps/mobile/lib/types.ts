import { Id } from "@/convex/_generated/dataModel";

export interface VideoData {
  title: string;
  description?: string;
  youtubeUrl: string;
}

export interface NoteData {
  name: string;
  url: string;
}

export interface ChapterData {
  _id: Id<"chapters">;
  _creationTime: number;
  title: string;
  description: string;
  videos?: VideoData[];
  difficulty: string;
  class: string;
  subject: string;
  notes?: NoteData[];
}
