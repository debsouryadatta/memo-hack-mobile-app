import { ChapterData } from './types';

// Helper function to get chapter data by ID
export const getChapterDataById = (chapterId: string, chapterVideosData: any): { data: ChapterData; classKey: string; subject: string } | null => {
  try {
    const classes = ["class9", "class10", "class11", "class12"];
    const subjects = ["physics", "biology"];
    
    for (const classKey of classes) {
      for (const subject of subjects) {
        const classData = (chapterVideosData as any)[classKey];
        if (!classData) continue;
        
        const subjectData = classData[subject];
        if (!subjectData) continue;
        
        const chapters = Object.values(subjectData) as ChapterData[];
        const chapter = chapters.find((ch: ChapterData) => ch.id === chapterId);
        if (chapter) {
          return { data: chapter, classKey, subject };
        }
      }
    }
    return null;
  } catch (error) {
    console.log('Error getting chapter data by ID:', error);
    return null;
  }
};