export interface VideoData {
  id: string;
  title: string;
  duration: string;
  description: string;
  notes?: string; // Optional PDF link for notes
}

export interface ChapterData {
  id: string;
  title: string;
  description: string;
  videos: VideoData[];
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}