import type { PublicationType } from "../types/publication";

export const PUBLICATION_TYPE_LABELS = {
  journal_article: "Journal Article",
  book_chapter: "Book Chapter",
  conference_paper: "Conference Paper",
  preprint: "Preprint",
  dissertation: "Thesis / Dissertation",
  review_article: "Review Article",
  technical_report: "Report / Working Paper",
  other: "Other",
} as const;

export const OPENALEX_TYPE_MAP: Record<string, PublicationType> = {
  "article": "journal_article",
  "book-chapter": "book_chapter",
  "preprint": "preprint",
  "dissertation": "dissertation",
  "review": "review_article",
  "report": "technical_report",
  "book": "other",
  "dataset": "other",
  "editorial": "other",
  "erratum": "other",
  "letter": "other",
  "libguides": "other",
  "paratext": "other",
  "peer-review": "other",
  "reference-entry": "other",
  "retraction": "other",
  "standard": "other",
  "supplementary-materials": "other",
  "other": "other",
}

export const PUBLICATION_TYPE_VALUES = Object.keys(PUBLICATION_TYPE_LABELS) as PublicationType[]

export const MAX_FEATURED_PUBLICATIONS = 3