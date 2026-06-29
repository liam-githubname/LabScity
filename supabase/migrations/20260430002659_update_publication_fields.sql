create type "public"."publication_type" as enum ('journal_article', 'conference_paper', 'preprint', 'dissertation', 'review_article', 'technical_report', 'other', 'book_chapter');

alter table "public"."publications" drop column "is_openalex";

alter table "public"."publications" add column "is_oa" boolean not null default false;

alter table "public"."publications" add column "pdf_url" text;

alter table "public"."publications" add column "type" public.publication_type default 'other'::public.publication_type;

alter table "public"."user_publications" alter column "is_featured" set not null;


