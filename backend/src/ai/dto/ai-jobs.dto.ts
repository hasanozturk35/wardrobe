export interface Generate3DModelJob {
  garmentId: string;
  imageUrl: string;
}

export interface GenerateAvatarJob {
  userId: string;
  selfieUrl: string;
  bodyPhotoUrl: string;
}

export interface HeavyStyleAnalysisJob {
  userId: string;
  userMessage: string;
}
