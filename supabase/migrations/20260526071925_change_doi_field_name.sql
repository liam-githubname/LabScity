alter table "public"."publications" drop column "doi_link";

alter table "public"."publications" add column "doi" text;


