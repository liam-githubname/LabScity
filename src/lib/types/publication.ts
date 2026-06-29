import { PUBLICATION_TYPE_LABELS } from "../constants/publications";

// publication_type enum values from supabase
export type PublicationType = keyof typeof PUBLICATION_TYPE_LABELS;

export interface OpenAlexWork {
  title: string | null;
  doi: string | null;
  primary_location: { source: { display_name: string } | null } | null;
  publication_date: string | null;
  authorships: Array<{author: { display_name: string }}>;
  type: string | null;
  open_access: { is_oa: boolean, oa_url: string | null } | null;
  topics: Array<{id: string; display_name: string; score: number}>;
}

export interface ParsedOpenAlexWork {
  title: string;
  doi: string;
  journal: string | null;
  publicationDate: string | null;
  authors: string[];
  type: PublicationType;
  isOA: boolean;
  pdfUrl: string | null;
  openAlexTopicIds: string[];
}