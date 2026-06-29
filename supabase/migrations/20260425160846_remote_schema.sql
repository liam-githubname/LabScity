


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."accept_group_invite"("target_group_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_user_id uuid := auth.uid();
  target_conversation_id bigint;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.invites i
    WHERE i.group_id = target_group_id
      AND i.user_id = current_user_id
      AND (i.status = 'pending' OR i.status IS NULL)
  ) THEN
    RAISE EXCEPTION 'No pending invitation for this group';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = target_group_id
      AND gm.user_id = current_user_id
  ) THEN
    UPDATE public.invites
    SET status = 'accepted'
    WHERE group_id = target_group_id
      AND user_id = current_user_id;
    RETURN;
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (target_group_id, current_user_id, 'Member');

  SELECT g.conversation_id
  INTO target_conversation_id
  FROM public.groups g
  WHERE g.group_id = target_group_id;

  IF target_conversation_id IS NOT NULL THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (target_conversation_id, current_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.invites
  SET status = 'accepted'
  WHERE group_id = target_group_id
    AND user_id = current_user_id;
END;
$$;


ALTER FUNCTION "public"."accept_group_invite"("target_group_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_group_member"("target_group_id" bigint, "target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = target_group_id AND user_id = auth.uid() AND role = 'Admin'
  ) THEN RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (target_group_id, target_user_id, 'Member');

  INSERT INTO conversation_participants (conversation_id, user_id)
  SELECT g.conversation_id, target_user_id
  FROM groups g WHERE g.group_id = target_group_id AND g.conversation_id IS NOT NULL
  ON CONFLICT DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."add_group_member"("target_group_id" bigint, "target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_conversation"("participant_ids" "uuid"[]) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  new_conversation_id bigint;
  p_id uuid;
begin
  -- 1. Create the container
  insert into public.conversations (is_group)
  values (false) -- defaulting to DM for now
  returning id into new_conversation_id;

  -- 2. Add all participants (Loop through the array)
  foreach p_id in array participant_ids
  loop
    insert into public.conversation_participants (conversation_id, user_id)
    values (new_conversation_id, p_id);
  end loop;

  -- 3. Return the ID so the frontend can redirect the user
  return new_conversation_id;
end;
$$;


ALTER FUNCTION "public"."create_conversation"("participant_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_group"("group_name" "text", "group_description" "text", "creator_id" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
   DECLARE
     new_group_id bigint;
     new_conversation_id bigint;
   BEGIN
     INSERT INTO conversations (is_group, name)
     VALUES (true, group_name)
     RETURNING id INTO new_conversation_id;

     INSERT INTO conversation_participants (conversation_id, user_id)
     VALUES (new_conversation_id, creator_id);

     INSERT INTO groups (name, description, conversation_id)
     VALUES (group_name, group_description, new_conversation_id)
     RETURNING group_id INTO new_group_id;

     INSERT INTO group_members (group_id, user_id, role)
     VALUES (new_group_id, creator_id, 'Admin');

     RETURN new_group_id;
   END;
   $$;


ALTER FUNCTION "public"."create_group"("group_name" "text", "group_description" "text", "creator_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_group"("p_name" "text", "p_description" "text", "p_privacy" "text" DEFAULT 'public'::"text", "p_topics" "text"[] DEFAULT '{}'::"text"[], "p_rules" "text" DEFAULT ''::"text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_group_id bigint;
  new_conversation_id bigint;
BEGIN
  -- 1. Ensure user is logged in
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to create a group';
  END IF;

  -- 2. Create the Group Chat Conversation
  INSERT INTO public.conversations (is_group, name)
  VALUES (true, p_name)
  RETURNING id INTO new_conversation_id;

  -- 3. Add the creator to the Group Chat
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (new_conversation_id, auth.uid());

  -- 4. Create the Group with the new extended columns
  INSERT INTO public.groups (name, description, conversation_id, privacy, topics, rules)
  VALUES (p_name, p_description, new_conversation_id, p_privacy, p_topics, p_rules)
  RETURNING group_id INTO new_group_id;

  -- 5. Make the creator an Admin of the group
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (new_group_id, auth.uid(), 'Admin');

  -- 6. Return the new group ID so the frontend can redirect the user
  RETURN new_group_id;
END;
$$;


ALTER FUNCTION "public"."create_group"("p_name" "text", "p_description" "text", "p_privacy" "text", "p_topics" "text"[], "p_rules" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_comment_like_count"("comment_id_param" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE comment 
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE comment_id = comment_id_param;
END;
$$;


ALTER FUNCTION "public"."decrement_comment_like_count"("comment_id_param" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_like_amount"("post_id_param" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE posts 
  SET like_amount = GREATEST(like_amount - 1, 0)
  WHERE post_id = post_id_param;
END;
$$;


ALTER FUNCTION "public"."decrement_like_amount"("post_id_param" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_group"("target_group_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  conv_id bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = target_group_id AND user_id = auth.uid() AND role = 'Admin'
  ) THEN RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT conversation_id INTO conv_id FROM groups WHERE group_id = target_group_id;

  DELETE FROM comment_likes WHERE comment_id IN (
    SELECT comment_id FROM comment WHERE post_id IN (SELECT post_id FROM posts WHERE group_id = target_group_id)
  );
  DELETE FROM feed_report WHERE post_id IN (SELECT post_id FROM posts WHERE group_id = target_group_id);
  DELETE FROM comment WHERE post_id IN (SELECT post_id FROM posts WHERE group_id = target_group_id);
  DELETE FROM likes WHERE post_id IN (SELECT post_id FROM posts WHERE group_id = target_group_id);
  DELETE FROM posts WHERE group_id = target_group_id;

  DELETE FROM invites WHERE group_id = target_group_id;
  DELETE FROM group_members WHERE group_id = target_group_id;

  -- Delete the group BEFORE the conversation (groups.conversation_id references conversations)
  DELETE FROM groups WHERE group_id = target_group_id;

  IF conv_id IS NOT NULL THEN
    DELETE FROM messages WHERE conversation_id = conv_id;
    DELETE FROM conversation_participants WHERE conversation_id = conv_id;
    DELETE FROM conversations WHERE id = conv_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."delete_group"("target_group_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_group_invite"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  wants_notification boolean;
BEGIN
  SELECT is_enabled INTO wants_notification FROM public.notification_preferences 
  WHERE user_id = NEW.user_id AND notification_type = 'group_invite';
  
  IF wants_notification = false THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (NEW.user_id, 'group_invite', 'Group Invitation', 'You have been invited to a group.', '/groups/' || NEW.group_id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_group_invite"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  -- 1. Insert into public.users
  INSERT INTO public.users (
    user_id,
    first_name,
    last_name,
    email,
    profile_pic_path
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    'default_value'
  )
  on conflict (user_id) do nothing;

  -- 2. Insert into public.profile
  INSERT INTO public.profile (
    user_id, 
    first_name, 
    last_name, 
    occupation, 
    workplace
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'occupation', ''),
    coalesce(new.raw_user_meta_data->>'workplace', '')
  )
  on conflict (user_id) do nothing;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  target_user_id uuid;
  wants_notification boolean;
  is_item_muted boolean;
  actor_name text;     -- NEW: To hold the commenter's name
  post_preview text;   -- NEW: To hold a snippet of the post
BEGIN
  -- Find the author of the post and a preview of the post text
  SELECT user_id, COALESCE(substring(text from 1 for 40), 'your post') 
  INTO target_user_id, post_preview 
  FROM public.posts WHERE post_id = NEW.post_id;
  
  -- Don't notify the user if they commented on their own post
  IF target_user_id = NEW.user_id THEN RETURN NEW; END IF;

  -- Grab the commenter's name
  SELECT COALESCE(first_name || ' ' || last_name, 'Someone') 
  INTO actor_name 
  FROM public.users WHERE user_id = NEW.user_id;

  -- Check if the specific post is muted
  SELECT EXISTS (
    SELECT 1 FROM public.muted_items 
    WHERE user_id = target_user_id AND item_id = NEW.post_id AND item_type = 'post'
  ) INTO is_item_muted;

  IF is_item_muted = true THEN RETURN NEW; END IF;

  -- Check global preferences
  SELECT is_enabled INTO wants_notification FROM public.notification_preferences 
  WHERE user_id = target_user_id AND notification_type = 'new_comment';
  
  IF wants_notification = false THEN RETURN NEW; END IF;

  -- Create the enriched Notification!
  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (
    target_user_id, 
    'new_comment', 
    'New Comment from ' || actor_name, 
    actor_name || ' commented on: "' || post_preview || '..."', 
    '/posts/' || NEW.post_id
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_comment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_follow"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  wants_notification boolean;
BEGIN
  SELECT is_enabled INTO wants_notification FROM public.notification_preferences 
  WHERE user_id = NEW.following_id AND notification_type = 'new_follow';
  
  IF wants_notification = false THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (NEW.following_id, 'new_follow', 'New Follower!', 'Someone started following you.', '/profile/' || NEW.follower_id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_follow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_like"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  target_user_id uuid;
  wants_notification boolean;
  is_item_muted boolean;
  actor_name text;
  post_preview text;
BEGIN
  -- Find the author of the post and a preview
  SELECT user_id, COALESCE(substring(text from 1 for 40), 'your post') 
  INTO target_user_id, post_preview 
  FROM public.posts WHERE post_id = NEW.post_id;
  
  IF target_user_id = NEW.user_id THEN RETURN NEW; END IF;

  -- Grab the liker's name
  SELECT COALESCE(first_name || ' ' || last_name, 'Someone') 
  INTO actor_name 
  FROM public.users WHERE user_id = NEW.user_id;

  -- Check if muted
  SELECT EXISTS (
    SELECT 1 FROM public.muted_items 
    WHERE user_id = target_user_id AND item_id = NEW.post_id AND item_type = 'post'
  ) INTO is_item_muted;

  IF is_item_muted = true THEN RETURN NEW; END IF;

  SELECT is_enabled INTO wants_notification FROM public.notification_preferences 
  WHERE user_id = target_user_id AND notification_type = 'post_like';
  
  IF wants_notification = false THEN RETURN NEW; END IF;

  -- Create Enriched Notification
  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (
    target_user_id, 
    'post_like', 
    actor_name || ' liked your post', 
    '"' || post_preview || '..."', 
    '/posts/' || NEW.post_id
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_like"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert notifications for all participants except the sender
  INSERT INTO public.notifications (user_id, type, title, content, link)
  SELECT 
    cp.user_id, 
    'new_message', 
    'New message from ' || COALESCE(sender.first_name, 'Someone'), 
    -- If it's a group chat, mention the group name. Otherwise, just show the message preview.
    CASE 
      WHEN conv.is_group = true THEN 'In ' || COALESCE(conv.name, 'Group') || ': ' || substring(NEW.content from 1 for 40) || '...'
      ELSE substring(NEW.content from 1 for 40) || '...'
    END, 
    '/chat/' || NEW.conversation_id
  FROM public.conversation_participants cp
  -- Join the users table to get the sender's name
  JOIN public.users sender ON sender.user_id = NEW.sender_id
  -- Join the conversations table to check if it's a group and get the name
  JOIN public.conversations conv ON conv.id = NEW.conversation_id
  -- Check preferences
  LEFT JOIN public.notification_preferences np 
    ON np.user_id = cp.user_id AND np.notification_type = 'new_message'
  WHERE cp.conversation_id = NEW.conversation_id 
    AND cp.user_id != NEW.sender_id
    AND (np.is_enabled IS NULL OR np.is_enabled = true)
    AND NOT EXISTS (
      SELECT 1 FROM public.muted_items mi 
      WHERE mi.user_id = cp.user_id 
        AND mi.item_id = NEW.conversation_id 
        AND mi.item_type = 'conversation'
    );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_comment_like_count"("comment_id_param" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE comment 
  SET like_count = like_count + 1 
  WHERE comment_id = comment_id_param;
END;
$$;


ALTER FUNCTION "public"."increment_comment_like_count"("comment_id_param" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_like_amount"("post_id_param" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE posts 
  SET like_amount = like_amount + 1 
  WHERE post_id = post_id_param;
END;
$$;


ALTER FUNCTION "public"."increment_like_amount"("post_id_param" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invite_user_to_group"("p_group_id" bigint, "p_target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Verify the user sending the invite is an Admin of the group
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = auth.uid() AND role = 'Admin'
  ) THEN 
    RAISE EXCEPTION 'Not authorized to invite members to this group';
  END IF;

  -- Verify the user isn't already in the group
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_target_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this group';
  END IF;

  -- Insert the invite
  INSERT INTO public.invites (group_id, user_id, status)
  VALUES (p_group_id, p_target_user_id, 'pending');
END;
$$;


ALTER FUNCTION "public"."invite_user_to_group"("p_group_id" bigint, "p_target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_member"("gid" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_group_member"("gid" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_participant"("_conversation_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = _conversation_id -- No more ambiguity!
    AND user_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_participant"("_conversation_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_public_group"("target_group_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if banned
  IF EXISTS (SELECT 1 FROM public.group_bans WHERE group_id = target_group_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'You are banned from this group';
  END IF;

  -- Ensure the group actually exists and is public
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE group_id = target_group_id AND privacy = 'public') THEN
    RAISE EXCEPTION 'Group is private or does not exist';
  END IF;

  -- Prevent duplicate membership errors
  IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = target_group_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'You are already a member of this group';
  END IF;

  -- Add user to the group
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (target_group_id, auth.uid(), 'Member');

  -- Add user to the group's conversation chat (if one exists)
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  SELECT conversation_id, auth.uid()
  FROM public.groups 
  WHERE group_id = target_group_id AND conversation_id IS NOT NULL
  ON CONFLICT DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."join_public_group"("target_group_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_group_member"("target_group_id" bigint, "target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = target_group_id AND user_id = auth.uid() AND role = 'Admin'
  ) THEN RAISE EXCEPTION 'Not authorized';
  END IF;

  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = target_group_id AND user_id = target_user_id AND role = 'Admin'
  ) THEN RAISE EXCEPTION 'Cannot remove an Admin';
  END IF;

  DELETE FROM group_members
  WHERE group_id = target_group_id AND user_id = target_user_id;

  DELETE FROM conversation_participants
  WHERE user_id = target_user_id
    AND conversation_id = (SELECT conversation_id FROM groups WHERE group_id = target_group_id);
END;
$$;


ALTER FUNCTION "public"."remove_group_member"("target_group_id" bigint, "target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."articles" (
    "article_id" bigint NOT NULL,
    "researchers" "text" DEFAULT ''::"text",
    "article_link" character varying DEFAULT ''::character varying,
    "publication_date" character varying DEFAULT ''::character varying,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text",
    "user_id" "uuid" DEFAULT "auth"."uid"()
);


ALTER TABLE "public"."articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "group_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "conversation_id" bigint,
    "topics" "text"[] DEFAULT '{}'::"text"[],
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "privacy" "text" DEFAULT 'public'::"text",
    "avatar_url" "text",
    "cover_photo_url" "text",
    "rules" "text",
    CONSTRAINT "groups_privacy_check" CHECK (("privacy" = ANY (ARRAY['public'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "post_id" bigint NOT NULL,
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text" "text" DEFAULT ''::"text",
    "like_amount" bigint DEFAULT 0,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "group_id" bigint,
    "media_path" "text",
    "scientific_field" "text",
    "taken_down" boolean DEFAULT false,
    "media_width" bigint,
    "media_height" bigint
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."posts"."group_id" IS 'if group post add here';



CREATE TABLE IF NOT EXISTS "public"."profile" (
    "profession" "text",
    "age" bigint,
    "about" "text",
    "skill" "text"[],
    "first_name" "text",
    "user_id" "uuid" NOT NULL,
    "last_name" "text" DEFAULT ''::"text",
    "header_pic_path" "text",
    "occupation" "text",
    "workplace" "text",
    "articles" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."profile" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profile"."occupation" IS 'user''s occupation';



COMMENT ON COLUMN "public"."profile"."workplace" IS 'user''s workplace';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "user_id" "uuid" NOT NULL,
    "profile_pic_path" "text",
    "is_banned" boolean DEFAULT false,
    "banned_at" timestamp with time zone,
    "banned_by" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_generated_content_search" WITH ("security_invoker"='on') AS
 SELECT 'user'::"text" AS "content_type",
    COALESCE("pr"."about", "u"."email") AS "content",
    COALESCE("pr"."occupation", 'User Profile'::"text") AS "category",
    ("u"."user_id")::"text" AS "id",
    "concat_ws"(' '::"text", "u"."first_name", "u"."last_name") AS "names",
    "setweight"("to_tsvector"('"english"'::"regconfig", "concat_ws"(' '::"text", "u"."first_name", "u"."last_name", "u"."email", "pr"."profession", "pr"."about", "array_to_string"("pr"."skill", ' '::"text"), "pr"."occupation", "pr"."workplace")), 'A'::"char") AS "tsv"
   FROM ("public"."users" "u"
     LEFT JOIN "public"."profile" "pr" ON (("u"."user_id" = "pr"."user_id")))
UNION ALL
 SELECT 'post'::"text" AS "content_type",
    "p"."text" AS "content",
    "p"."category",
    ("p"."post_id")::"text" AS "id",
    "concat_ws"(' '::"text", "u"."first_name", "u"."last_name") AS "names",
    "setweight"("to_tsvector"('"english"'::"regconfig", "concat_ws"(' '::"text", "p"."text", "p"."category", "p"."scientific_field", "u"."first_name", "u"."last_name")), 'B'::"char") AS "tsv"
   FROM ("public"."posts" "p"
     JOIN "public"."users" "u" ON (("p"."user_id" = "u"."user_id")))
UNION ALL
 SELECT 'group'::"text" AS "content_type",
    "groups"."description" AS "content",
    'user-defined group'::"text" AS "category",
    ("groups"."group_id")::"text" AS "id",
    "groups"."name" AS "names",
    "setweight"("to_tsvector"('"english"'::"regconfig", "concat_ws"(' '::"text", "groups"."name", "groups"."description", "array_to_string"("groups"."topics", ' '::"text"))), 'C'::"char") AS "tsv"
   FROM "public"."groups"
UNION ALL
 SELECT 'article'::"text" AS "content_type",
    "articles"."article_link" AS "content",
    "articles"."source" AS "category",
    ("articles"."article_id")::"text" AS "id",
    "articles"."researchers" AS "names",
    "setweight"("to_tsvector"('"english"'::"regconfig", "concat_ws"(' '::"text", "articles"."source", "articles"."researchers")), 'D'::"char") AS "tsv"
   FROM "public"."articles";


ALTER VIEW "public"."user_generated_content_search" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_all_content"("search_query" "text") RETURNS SETOF "public"."user_generated_content_search"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Lower the fuzzy match threshold for this transaction only (Default is 0.3)
  SET LOCAL pg_trgm.similarity_threshold = 0.15;

  RETURN QUERY
  SELECT *
  FROM public.user_generated_content_search
  WHERE 
    tsv @@ websearch_to_tsquery('english', search_query)
    OR names % search_query
    OR category % search_query
    OR names ILIKE '%' || search_query || '%'
    OR category ILIKE '%' || search_query || '%'
  ORDER BY 
    GREATEST(
      ts_rank(tsv, websearch_to_tsquery('english', search_query)),
      similarity(names, search_query),
      similarity(category, search_query)
    ) DESC
  LIMIT 50;
END;
$$;


ALTER FUNCTION "public"."search_all_content"("search_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_groups"("search_query" "text") RETURNS SETOF "public"."groups"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  SET LOCAL pg_trgm.similarity_threshold = 0.15;

  RETURN QUERY
  SELECT *
  FROM public.groups
  WHERE 
    -- 1. Full-Text Match (Description, Topics, Rules)
    to_tsvector('english', concat_ws(' ', name, description, array_to_string(topics, ' '), rules)) 
    @@ websearch_to_tsquery('english', search_query)
    OR 
    -- 2. Fuzzy Match (Catches typos in the group name)
    name % search_query
  ORDER BY 
    GREATEST(
      ts_rank(
        to_tsvector('english', concat_ws(' ', name, description, array_to_string(topics, ' '), rules)),
        websearch_to_tsquery('english', search_query)
      ),
      similarity(name, search_query)
    ) DESC
  LIMIT 50;
END;
$$;


ALTER FUNCTION "public"."search_groups"("search_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_posts"("search_query" "text") RETURNS SETOF "public"."posts"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  SET LOCAL pg_trgm.similarity_threshold = 0.15;

  RETURN QUERY
  SELECT *
  FROM public.posts
  WHERE 
    -- 1. Full-Text Match (Text body, category, field)
    to_tsvector('english', concat_ws(' ', text, category, scientific_field)) 
    @@ websearch_to_tsquery('english', search_query)
    OR 
    -- 2. Fuzzy Match (Catches typos in the post text or its categories)
    concat_ws(' ', text, category, scientific_field) % search_query
  ORDER BY 
    GREATEST(
      ts_rank(
        to_tsvector('english', concat_ws(' ', text, category, scientific_field)),
        websearch_to_tsquery('english', search_query)
      ),
      similarity(concat_ws(' ', text, category, scientific_field), search_query)
    ) DESC
  LIMIT 50;
END;
$$;


ALTER FUNCTION "public"."search_posts"("search_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_users"("search_query" "text") RETURNS TABLE("user_id" "uuid", "first_name" "text", "last_name" "text", "email" "text", "profile_pic_path" "text", "profession" "text", "occupation" "text", "workplace" "text", "about" "text", "skill" "text"[])
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  SET LOCAL pg_trgm.similarity_threshold = 0.15;

  RETURN QUERY
  SELECT u.user_id, u.first_name, u.last_name, u.email, u.profile_pic_path,
         p.profession, p.occupation, p.workplace, p.about, p.skill
  FROM public.users u
  LEFT JOIN public.profile p ON u.user_id = p.user_id
  WHERE 
    -- 1. Full-Text Match
    to_tsvector('english', concat_ws(' ', u.first_name, u.last_name, u.email, p.profession, p.about, array_to_string(p.skill, ' '), p.occupation, p.workplace)) 
    @@ websearch_to_tsquery('english', search_query)
    OR 
    -- 2. Fuzzy Match
    concat_ws(' ', u.first_name, u.last_name) % search_query
    OR 
    -- 3. NEW: Prefix/Substring Match
    concat_ws(' ', u.first_name, u.last_name) ILIKE '%' || search_query || '%'
  ORDER BY 
    GREATEST(
      ts_rank(
        to_tsvector('english', concat_ws(' ', u.first_name, u.last_name, u.email, p.profession, p.about, array_to_string(p.skill, ' '), p.occupation, p.workplace)),
        websearch_to_tsquery('english', search_query)
      ),
      similarity(concat_ws(' ', u.first_name, u.last_name), search_query)
    ) DESC
  LIMIT 50;
END;
$$;


ALTER FUNCTION "public"."search_users"("search_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_group_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.group_id IS NOT NULL THEN
    UPDATE public.groups
    SET last_activity_at = now()
    WHERE group_id = NEW.group_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_group_activity"() OWNER TO "postgres";


ALTER TABLE "public"."articles" ALTER COLUMN "article_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Articles_articleid_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."comment" (
    "post_id" bigint NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "like_count" bigint,
    "comment_id" bigint NOT NULL,
    "taken_down" boolean DEFAULT false
);


ALTER TABLE "public"."comment" OWNER TO "postgres";


ALTER TABLE "public"."comment" ALTER COLUMN "comment_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Comment_comment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."comment_likes" (
    "comment_id" bigint NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comment_likes" OWNER TO "postgres";


ALTER TABLE "public"."comment_likes" ALTER COLUMN "comment_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Comment_likes_comment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."comment" ALTER COLUMN "post_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Comment_post_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."feed_report" (
    "report_id" bigint NOT NULL,
    "reporter_id" "uuid" DEFAULT "auth"."uid"(),
    "reported_id" "uuid",
    "post_id" bigint NOT NULL,
    "comment_id" bigint,
    "type" "text",
    "additional_context" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text",
    "reviewed_at" timestamp with time zone
);


ALTER TABLE "public"."feed_report" OWNER TO "postgres";


ALTER TABLE "public"."feed_report" ALTER COLUMN "report_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."FeedReport_report_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."groups" ALTER COLUMN "group_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Groups_groupid_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."posts" ALTER COLUMN "post_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Posts_postid_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "conversation_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_reads" (
    "user_id" "uuid" NOT NULL,
    "conversation_id" bigint NOT NULL,
    "last_read_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."conversation_reads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "is_group" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" bigint NOT NULL,
    "conversation_id" bigint NOT NULL,
    "sender_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "messages_content_check" CHECK (("char_length"("content") > 0))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."chat_sidebar" WITH ("security_invoker"='true') AS
 SELECT "c"."id" AS "conversation_id",
    COALESCE("c"."name", "ou"."name") AS "name",
    "c"."is_group",
    "ou"."profile_pic_url",
    "m"."id" AS "message_id",
    "m"."sender_id",
    "m"."content" AS "last_message",
    "m"."created_at" AS "last_message_at",
    COALESCE("unread_ct"."unread_count", (0)::bigint) AS "unread_count"
   FROM (((("public"."conversations" "c"
     JOIN "public"."conversation_participants" "cp" ON (("c"."id" = "cp"."conversation_id")))
     LEFT JOIN LATERAL ( SELECT "msg"."id",
            "msg"."sender_id",
            "msg"."content",
            "msg"."created_at"
           FROM "public"."messages" "msg"
          WHERE ("msg"."conversation_id" = "c"."id")
          ORDER BY "msg"."created_at" DESC
         LIMIT 1) "m" ON (true))
     LEFT JOIN LATERAL ( SELECT "concat_ws"(' '::"text", "u"."first_name", "u"."last_name") AS "name",
            "u"."profile_pic_path" AS "profile_pic_url"
           FROM ("public"."conversation_participants" "other_cp"
             JOIN "public"."users" "u" ON (("u"."user_id" = "other_cp"."user_id")))
          WHERE (("other_cp"."conversation_id" = "c"."id") AND ("other_cp"."user_id" <> "auth"."uid"()))
         LIMIT 1) "ou" ON (true))
     LEFT JOIN LATERAL ( SELECT "count"(*) AS "unread_count"
           FROM ("public"."messages" "msg"
             LEFT JOIN "public"."conversation_reads" "cr" ON ((("cr"."conversation_id" = "msg"."conversation_id") AND ("cr"."user_id" = "auth"."uid"()))))
          WHERE (("msg"."conversation_id" = "c"."id") AND ("msg"."sender_id" <> "auth"."uid"()) AND (("cr"."last_read_at" IS NULL) OR ("msg"."created_at" > "cr"."last_read_at")))) "unread_ct" ON (true))
  WHERE ("cp"."user_id" = "auth"."uid"());


ALTER VIEW "public"."chat_sidebar" OWNER TO "postgres";


ALTER TABLE "public"."conversations" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."conversations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."follows" (
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "no_self_follow" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."friends" WITH ("security_invoker"='on') AS
 SELECT "f1"."follower_id" AS "user_id",
    "f1"."following_id" AS "friend_id"
   FROM ("public"."follows" "f1"
     JOIN "public"."follows" "f2" ON ((("f1"."follower_id" = "f2"."following_id") AND ("f1"."following_id" = "f2"."follower_id"))));


ALTER VIEW "public"."friends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_bans" (
    "group_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "banned_by" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_bans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_join_requests" (
    "request_id" bigint NOT NULL,
    "group_id" bigint,
    "user_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_join_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'denied'::"text"])))
);


ALTER TABLE "public"."group_join_requests" OWNER TO "postgres";


ALTER TABLE "public"."group_join_requests" ALTER COLUMN "request_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."group_join_requests_request_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" bigint NOT NULL,
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."group_members" IS 'link to show which users are attached to which groups and vice versa';



CREATE TABLE IF NOT EXISTS "public"."invites" (
    "group_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text",
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."invites" OWNER TO "postgres";


COMMENT ON COLUMN "public"."invites"."status" IS 'declined or accepted';



CREATE TABLE IF NOT EXISTS "public"."likes" (
    "post_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


ALTER TABLE "public"."messages" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."moderators" (
    "user_id" "uuid" NOT NULL,
    "granted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."moderators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."muted_items" (
    "user_id" "uuid" NOT NULL,
    "item_id" bigint NOT NULL,
    "item_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."muted_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "user_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "link" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_report" (
    "report_id" bigint NOT NULL,
    "reported_id" "uuid",
    "reporter_id" "uuid",
    "type" "text",
    "additional_context" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text",
    "reviewed_at" timestamp with time zone
);


ALTER TABLE "public"."user_report" OWNER TO "postgres";


ALTER TABLE "public"."user_report" ALTER COLUMN "report_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_report_report_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "Articles_pkey" PRIMARY KEY ("article_id");



ALTER TABLE ONLY "public"."comment"
    ADD CONSTRAINT "Comment_comment_id_key" UNIQUE ("comment_id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "Comment_likes_pkey" PRIMARY KEY ("comment_id", "user_id");



ALTER TABLE ONLY "public"."comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY ("post_id", "user_id", "comment_id");



ALTER TABLE ONLY "public"."feed_report"
    ADD CONSTRAINT "FeedReport_report_id_key" UNIQUE ("report_id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "GroupMembers_pkey" PRIMARY KEY ("group_id", "user_id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "Groups_groupid_key" UNIQUE ("group_id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "Groups_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY ("group_id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "Invites_pkey" PRIMARY KEY ("group_id", "user_id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "Likes_pkey" PRIMARY KEY ("post_id", "user_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "Posts_pkey" PRIMARY KEY ("post_id", "user_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "Posts_post_id_key" UNIQUE ("post_id");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "Profile_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "Users_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversation_reads"
    ADD CONSTRAINT "conversation_reads_pkey" PRIMARY KEY ("user_id", "conversation_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_report"
    ADD CONSTRAINT "feed_report_pkey" PRIMARY KEY ("report_id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id", "following_id");



ALTER TABLE ONLY "public"."group_bans"
    ADD CONSTRAINT "group_bans_pkey" PRIMARY KEY ("group_id", "user_id");



ALTER TABLE ONLY "public"."group_join_requests"
    ADD CONSTRAINT "group_join_requests_group_id_user_id_key" UNIQUE ("group_id", "user_id");



ALTER TABLE ONLY "public"."group_join_requests"
    ADD CONSTRAINT "group_join_requests_pkey" PRIMARY KEY ("request_id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderators"
    ADD CONSTRAINT "moderators_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."muted_items"
    ADD CONSTRAINT "muted_items_pkey" PRIMARY KEY ("user_id", "item_id", "item_type");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id", "notification_type");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_report"
    ADD CONSTRAINT "user_report_pkey" PRIMARY KEY ("report_id");



CREATE INDEX "articles_researchers_trgm_idx" ON "public"."articles" USING "gin" ("researchers" "public"."gin_trgm_ops");



CREATE INDEX "groups_name_trgm_idx" ON "public"."groups" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_follows_following" ON "public"."follows" USING "btree" ("following_id");



CREATE INDEX "users_first_name_trgm_idx" ON "public"."users" USING "gin" ("first_name" "public"."gin_trgm_ops");



CREATE INDEX "users_last_name_trgm_idx" ON "public"."users" USING "gin" ("last_name" "public"."gin_trgm_ops");



CREATE OR REPLACE TRIGGER "on_group_invite_created" AFTER INSERT ON "public"."invites" FOR EACH ROW EXECUTE FUNCTION "public"."handle_group_invite"();



CREATE OR REPLACE TRIGGER "on_group_invited" AFTER INSERT ON "public"."invites" FOR EACH ROW EXECUTE FUNCTION "public"."handle_group_invite"();



CREATE OR REPLACE TRIGGER "on_message_sent" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_message"();



CREATE OR REPLACE TRIGGER "on_post_commented" AFTER INSERT ON "public"."comment" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_comment"();



CREATE OR REPLACE TRIGGER "on_post_liked" AFTER INSERT ON "public"."likes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_like"();



CREATE OR REPLACE TRIGGER "on_user_followed" AFTER INSERT ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_follow"();



CREATE OR REPLACE TRIGGER "trigger_update_group_activity" AFTER INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_group_activity"();



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "Articles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "Comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("comment_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "Comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment"
    ADD CONSTRAINT "Comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment"
    ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_report"
    ADD CONSTRAINT "FeedReport_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("comment_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_report"
    ADD CONSTRAINT "FeedReport_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_report"
    ADD CONSTRAINT "FeedReport_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "GroupMembers_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("group_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "GroupMembers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "Invites_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("group_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "Invites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "Likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "Likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "Posts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("group_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "Posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "Profile_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "Users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_reads"
    ADD CONSTRAINT "conversation_reads_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_reads"
    ADD CONSTRAINT "conversation_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_bans"
    ADD CONSTRAINT "group_bans_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."group_bans"
    ADD CONSTRAINT "group_bans_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("group_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_bans"
    ADD CONSTRAINT "group_bans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_join_requests"
    ADD CONSTRAINT "group_join_requests_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("group_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_join_requests"
    ADD CONSTRAINT "group_join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderators"
    ADD CONSTRAINT "moderators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."muted_items"
    ADD CONSTRAINT "muted_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_report"
    ADD CONSTRAINT "user_report_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE SET DEFAULT;



ALTER TABLE ONLY "public"."user_report"
    ADD CONSTRAINT "user_report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE SET DEFAULT;



CREATE POLICY "Admins manage bans" ON "public"."group_bans" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_bans"."group_id") AND ("group_members"."user_id" = "auth"."uid"()) AND ("group_members"."role" = 'Admin'::"text")))));



CREATE POLICY "Admins manage join requests" ON "public"."group_join_requests" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_join_requests"."group_id") AND ("group_members"."user_id" = "auth"."uid"()) AND ("group_members"."role" = 'Admin'::"text")))));



CREATE POLICY "Allow authenticated users to view public groups" ON "public"."groups" FOR SELECT TO "authenticated" USING (("privacy" = 'public'::"text"));



CREATE POLICY "Anyone can view public groups, members view private" ON "public"."groups" FOR SELECT TO "authenticated" USING ((("privacy" = 'public'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "groups"."group_id") AND ("group_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."comment" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."comment_likes" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."conversation_participants" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."likes" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."posts" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."users" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."comment" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."comment_likes" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."feed_report" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."follows" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."user_report" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."users" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for users based on user_id" ON "public"."likes" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."posts" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."profile" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all authenticated users" ON "public"."profile" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all authenticated users" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."comment" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."comment_likes" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."feed_report" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."follows" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."likes" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."moderators" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."user_report" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Group admins can update groups" ON "public"."groups" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "groups"."group_id") AND ("gm"."user_id" = "auth"."uid"()) AND ("gm"."role" = 'Admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "groups"."group_id") AND ("gm"."user_id" = "auth"."uid"()) AND ("gm"."role" = 'Admin'::"text")))));



CREATE POLICY "Members can read group memberships" ON "public"."group_members" FOR SELECT USING ("public"."is_group_member"("group_id"));



CREATE POLICY "Moderators can ban users" ON "public"."users" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."moderators"
  WHERE ("moderators"."user_id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."moderators"
  WHERE ("moderators"."user_id" = "auth"."uid"()))));



CREATE POLICY "Moderators can delete any comment" ON "public"."comment" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."moderators"
  WHERE ("moderators"."user_id" = "auth"."uid"()))));



CREATE POLICY "Moderators can delete any post" ON "public"."posts" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."moderators"
  WHERE ("moderators"."user_id" = "auth"."uid"()))));



CREATE POLICY "Moderators can update any comment" ON "public"."comment" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."moderators" "m"
  WHERE ("m"."user_id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."moderators" "m"
  WHERE ("m"."user_id" = "auth"."uid"()))));



CREATE POLICY "Moderators can update any post" ON "public"."posts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."moderators" "m"
  WHERE ("m"."user_id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."moderators" "m"
  WHERE ("m"."user_id" = "auth"."uid"()))));



CREATE POLICY "Participants can send messages" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Participants can view messages" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Read access for public posts and allowed group posts" ON "public"."posts" FOR SELECT TO "authenticated" USING ((("group_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."groups"
  WHERE (("groups"."group_id" = "posts"."group_id") AND (("groups"."privacy" = 'public'::"text") OR (EXISTS ( SELECT 1
           FROM "public"."group_members"
          WHERE (("group_members"."group_id" = "groups"."group_id") AND ("group_members"."user_id" = "auth"."uid"()))))))))));



CREATE POLICY "Users can leave groups" ON "public"."group_members" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own reads" ON "public"."conversation_reads" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their muted items" ON "public"."muted_items" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own preferences" ON "public"."notification_preferences" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can request to join groups" ON "public"."group_join_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can see their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can see their own participation" ON "public"."conversation_participants" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can unfollow (delete their own follow records)" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can update conversations" ON "public"."conversations" FOR UPDATE USING ("public"."is_participant"("id")) WITH CHECK ("public"."is_participant"("id"));



CREATE POLICY "Users can update own comments" ON "public"."comment" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own posts" ON "public"."posts" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profile" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile row" ON "public"."users" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view messages" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view participants" ON "public"."conversation_participants" FOR SELECT USING ("public"."is_participant"("conversation_id"));



CREATE POLICY "Users can view their conversations" ON "public"."conversations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "conversations"."id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_reads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_report" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_bans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_join_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invites_select_invitee_or_admin" ON "public"."invites" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "invites"."group_id") AND ("gm"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gm"."role" = 'Admin'::"text"))))));



CREATE POLICY "invites_update_by_group_admin" ON "public"."invites" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "invites"."group_id") AND ("gm"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gm"."role" = 'Admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "invites"."group_id") AND ("gm"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gm"."role" = 'Admin'::"text")))));



CREATE POLICY "invites_update_own" ON "public"."invites" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moderators" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "moderators_can_update_feed_report" ON "public"."feed_report" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."moderators" "m"
  WHERE ("m"."user_id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."moderators" "m"
  WHERE ("m"."user_id" = "auth"."uid"()))));



CREATE POLICY "moderators_can_update_user_report" ON "public"."user_report" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."moderators" "m"
  WHERE ("m"."user_id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."moderators" "m"
  WHERE ("m"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."muted_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "posts_update_allowed_authenticated" ON "public"."posts" FOR UPDATE TO "authenticated" USING (true);



ALTER TABLE "public"."profile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_report" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_participants";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."accept_group_invite"("target_group_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."accept_group_invite"("target_group_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_group_invite"("target_group_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_group_member"("target_group_id" bigint, "target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_group_member"("target_group_id" bigint, "target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_group_member"("target_group_id" bigint, "target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_conversation"("participant_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_conversation"("participant_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_conversation"("participant_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_group"("group_name" "text", "group_description" "text", "creator_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_group"("group_name" "text", "group_description" "text", "creator_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_group"("group_name" "text", "group_description" "text", "creator_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_group"("p_name" "text", "p_description" "text", "p_privacy" "text", "p_topics" "text"[], "p_rules" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_group"("p_name" "text", "p_description" "text", "p_privacy" "text", "p_topics" "text"[], "p_rules" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_group"("p_name" "text", "p_description" "text", "p_privacy" "text", "p_topics" "text"[], "p_rules" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_comment_like_count"("comment_id_param" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_comment_like_count"("comment_id_param" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_comment_like_count"("comment_id_param" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_like_amount"("post_id_param" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_like_amount"("post_id_param" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_like_amount"("post_id_param" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_group"("target_group_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_group"("target_group_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_group"("target_group_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_group_invite"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_group_invite"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_group_invite"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_comment"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_comment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_comment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_follow"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_follow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_follow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_like"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_like"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_like"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_comment_like_count"("comment_id_param" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_comment_like_count"("comment_id_param" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_comment_like_count"("comment_id_param" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_like_amount"("post_id_param" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_like_amount"("post_id_param" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_like_amount"("post_id_param" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_user_to_group"("p_group_id" bigint, "p_target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."invite_user_to_group"("p_group_id" bigint, "p_target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_user_to_group"("p_group_id" bigint, "p_target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_group_member"("gid" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_member"("gid" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_member"("gid" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_participant"("_conversation_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."is_participant"("_conversation_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_participant"("_conversation_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."join_public_group"("target_group_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."join_public_group"("target_group_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_public_group"("target_group_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_group_member"("target_group_id" bigint, "target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_group_member"("target_group_id" bigint, "target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_group_member"("target_group_id" bigint, "target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON TABLE "public"."articles" TO "anon";
GRANT ALL ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT UPDATE("like_amount") ON TABLE "public"."posts" TO "authenticated";



GRANT ALL ON TABLE "public"."profile" TO "anon";
GRANT ALL ON TABLE "public"."profile" TO "authenticated";
GRANT ALL ON TABLE "public"."profile" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."user_generated_content_search" TO "anon";
GRANT ALL ON TABLE "public"."user_generated_content_search" TO "authenticated";
GRANT ALL ON TABLE "public"."user_generated_content_search" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_all_content"("search_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_all_content"("search_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_all_content"("search_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_groups"("search_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_groups"("search_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_groups"("search_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_posts"("search_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_posts"("search_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_posts"("search_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_group_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON SEQUENCE "public"."Articles_articleid_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Articles_articleid_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Articles_articleid_seq" TO "service_role";



GRANT ALL ON TABLE "public"."comment" TO "anon";
GRANT ALL ON TABLE "public"."comment" TO "authenticated";
GRANT ALL ON TABLE "public"."comment" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Comment_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Comment_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Comment_comment_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."comment_likes" TO "anon";
GRANT ALL ON TABLE "public"."comment_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_likes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Comment_likes_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Comment_likes_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Comment_likes_comment_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Comment_post_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Comment_post_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Comment_post_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."feed_report" TO "anon";
GRANT ALL ON TABLE "public"."feed_report" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_report" TO "service_role";



GRANT ALL ON SEQUENCE "public"."FeedReport_report_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."FeedReport_report_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."FeedReport_report_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Groups_groupid_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Groups_groupid_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Groups_groupid_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Posts_postid_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Posts_postid_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Posts_postid_seq" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_reads" TO "anon";
GRANT ALL ON TABLE "public"."conversation_reads" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_reads" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_sidebar" TO "anon";
GRANT ALL ON TABLE "public"."chat_sidebar" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_sidebar" TO "service_role";



GRANT ALL ON SEQUENCE "public"."conversations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."conversations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."conversations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."friends" TO "anon";
GRANT ALL ON TABLE "public"."friends" TO "authenticated";
GRANT ALL ON TABLE "public"."friends" TO "service_role";



GRANT ALL ON TABLE "public"."group_bans" TO "anon";
GRANT ALL ON TABLE "public"."group_bans" TO "authenticated";
GRANT ALL ON TABLE "public"."group_bans" TO "service_role";



GRANT ALL ON TABLE "public"."group_join_requests" TO "anon";
GRANT ALL ON TABLE "public"."group_join_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."group_join_requests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."group_join_requests_request_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."group_join_requests_request_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."group_join_requests_request_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."invites" TO "anon";
GRANT ALL ON TABLE "public"."invites" TO "authenticated";
GRANT ALL ON TABLE "public"."invites" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."moderators" TO "anon";
GRANT ALL ON TABLE "public"."moderators" TO "authenticated";
GRANT ALL ON TABLE "public"."moderators" TO "service_role";



GRANT ALL ON TABLE "public"."muted_items" TO "anon";
GRANT ALL ON TABLE "public"."muted_items" TO "authenticated";
GRANT ALL ON TABLE "public"."muted_items" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."user_report" TO "anon";
GRANT ALL ON TABLE "public"."user_report" TO "authenticated";
GRANT ALL ON TABLE "public"."user_report" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_report_report_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_report_report_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_report_report_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


  create policy "Users can delete own post media"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'post_images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can delete own profile headers"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'profile_header'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can delete own profile pictures"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'profile_pictures'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload own post media"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'post_images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload own profile headers"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'profile_header'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload own profile pictures"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'profile_pictures'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



