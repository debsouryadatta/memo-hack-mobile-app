export enum CourseLevel {
  FOUNDATION = 'Foundation (9-10)',
  ADVANCED = 'Advanced (11-12)',
  TARGET = 'Target (Droppers)'
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
  gridArea?: string;
  image?: string;
}

export interface GeneratedAsset {
  imageUrl: string;
  prompt: string;
  timestamp: number;
}
