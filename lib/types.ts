export interface VideoData {
  id: string;
  title: string;
  duration: string;
  description: string;
  notes?: string; // Optional PDF link for notes
}

export interface ChapterData {
  _id: string;
  _creationTime: number;
  chapterId: string;
  title: string;
  description: string;
  videos?: VideoData[];
  estimatedTime: string;
  difficulty: string;
  class: string;
  subject: string;
}