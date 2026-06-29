export interface GetCollaboratorsResult {
  cosine_similarity: number;
  profile_user_id: string;
  first_name: string;
  last_name: string;
  profile_pic_path: string | null;
  occupation: string | null;
  workplace: string | null;
}