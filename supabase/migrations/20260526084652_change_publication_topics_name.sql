revoke delete on table "public"."publication_topics" from "anon";

revoke insert on table "public"."publication_topics" from "anon";

revoke references on table "public"."publication_topics" from "anon";

revoke select on table "public"."publication_topics" from "anon";

revoke trigger on table "public"."publication_topics" from "anon";

revoke truncate on table "public"."publication_topics" from "anon";

revoke update on table "public"."publication_topics" from "anon";

revoke delete on table "public"."publication_topics" from "authenticated";

revoke insert on table "public"."publication_topics" from "authenticated";

revoke references on table "public"."publication_topics" from "authenticated";

revoke select on table "public"."publication_topics" from "authenticated";

revoke trigger on table "public"."publication_topics" from "authenticated";

revoke truncate on table "public"."publication_topics" from "authenticated";

revoke update on table "public"."publication_topics" from "authenticated";

revoke delete on table "public"."publication_topics" from "service_role";

revoke insert on table "public"."publication_topics" from "service_role";

revoke references on table "public"."publication_topics" from "service_role";

revoke select on table "public"."publication_topics" from "service_role";

revoke trigger on table "public"."publication_topics" from "service_role";

revoke truncate on table "public"."publication_topics" from "service_role";

revoke update on table "public"."publication_topics" from "service_role";

alter table "public"."publication_topics" drop constraint "publication_topics_publication_id_fkey";

alter table "public"."publication_topics" drop constraint "publication_topics_topic_id_fkey";

alter table "public"."publication_topics" drop constraint "publication_topics_pkey";

drop index if exists "public"."publication_topics_pkey";

drop table "public"."publication_topics";


  create table "public"."publication_tags" (
    "publication_id" bigint not null,
    "tag_id" bigint not null
      );


CREATE UNIQUE INDEX publication_tags_pkey ON public.publication_tags USING btree (publication_id, tag_id);

alter table "public"."publication_tags" add constraint "publication_tags_pkey" PRIMARY KEY using index "publication_tags_pkey";

alter table "public"."publication_tags" add constraint "publication_topics_publication_id_fkey" FOREIGN KEY (publication_id) REFERENCES public.publications(publication_id) ON DELETE CASCADE not valid;

alter table "public"."publication_tags" validate constraint "publication_topics_publication_id_fkey";

alter table "public"."publication_tags" add constraint "publication_topics_topic_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE not valid;

alter table "public"."publication_tags" validate constraint "publication_topics_topic_id_fkey";

grant delete on table "public"."publication_tags" to "anon";

grant insert on table "public"."publication_tags" to "anon";

grant references on table "public"."publication_tags" to "anon";

grant select on table "public"."publication_tags" to "anon";

grant trigger on table "public"."publication_tags" to "anon";

grant truncate on table "public"."publication_tags" to "anon";

grant update on table "public"."publication_tags" to "anon";

grant delete on table "public"."publication_tags" to "authenticated";

grant insert on table "public"."publication_tags" to "authenticated";

grant references on table "public"."publication_tags" to "authenticated";

grant select on table "public"."publication_tags" to "authenticated";

grant trigger on table "public"."publication_tags" to "authenticated";

grant truncate on table "public"."publication_tags" to "authenticated";

grant update on table "public"."publication_tags" to "authenticated";

grant delete on table "public"."publication_tags" to "service_role";

grant insert on table "public"."publication_tags" to "service_role";

grant references on table "public"."publication_tags" to "service_role";

grant select on table "public"."publication_tags" to "service_role";

grant trigger on table "public"."publication_tags" to "service_role";

grant truncate on table "public"."publication_tags" to "service_role";

grant update on table "public"."publication_tags" to "service_role";


