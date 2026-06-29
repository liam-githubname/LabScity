SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict NMDMCdgFTWwvsuBUZ2eOsw9XgE7hZdztGi7fRn3CnZmOWWfqFs3UJ3RrwAANEIx

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '8f81f993-05eb-46be-a4a5-aed4062f247e', '{"action":"login","actor_id":"11111111-1111-4111-8111-111111111111","actor_username":"test1@ucf.edu","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-04-25 21:41:01.543045+00', ''),
	('00000000-0000-0000-0000-000000000000', '963fa727-f740-4615-a7e5-9e28de8b8e83', '{"action":"login","actor_id":"11111111-1111-4111-8111-111111111111","actor_username":"test1@ucf.edu","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-04-25 22:18:45.737155+00', ''),
	('00000000-0000-0000-0000-000000000000', '8d1d4d0c-6f7e-4aa4-8977-6d9b1638b86b', '{"action":"logout","actor_id":"11111111-1111-4111-8111-111111111111","actor_username":"test1@ucf.edu","actor_via_sso":false,"log_type":"account"}', '2026-04-25 22:27:33.862015+00', ''),
	('00000000-0000-0000-0000-000000000000', '3c770589-0d9c-4b27-9a08-0df598597224', '{"action":"login","actor_id":"22222222-2222-4222-8222-222222222222","actor_username":"test2@ucf.edu","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-04-25 22:27:41.908428+00', ''),
	('00000000-0000-0000-0000-000000000000', '771228e4-b799-4afe-900f-d272d51353c5', '{"action":"logout","actor_id":"22222222-2222-4222-8222-222222222222","actor_username":"test2@ucf.edu","actor_via_sso":false,"log_type":"account"}', '2026-04-25 23:00:49.815167+00', ''),
	('00000000-0000-0000-0000-000000000000', '37c1c9fc-a195-4eb0-ad52-ca4ef15365af', '{"action":"login","actor_id":"33333333-3333-4333-8333-333333333333","actor_username":"test3@ucf.edu","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-04-25 23:00:59.426834+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a3c6b078-07a5-4666-be84-256762a33e91', '{"action":"login","actor_id":"11111111-1111-4111-8111-111111111111","actor_username":"test1@ucf.edu","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-04-25 23:24:22.864165+00', '');


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'test2@ucf.edu', '$2a$06$LmAOtGXEcx7xlvrTqwX0c.zIU1LSFR8SZJym/OdpP29F98OrFlD/u', '2026-04-25 21:40:59.322994+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-04-25 22:27:41.909121+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2026-04-25 21:40:59.322994+00', '2026-04-25 22:27:41.911167+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'test3@ucf.edu', '$2a$06$UCBNWEiaRgKBtQfDuqJxz.kmUty3QgP.h8cYrcrGMYLQ7eBpCnhTu', '2026-04-25 21:40:59.322994+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-04-25 23:00:59.428122+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2026-04-25 21:40:59.322994+00', '2026-04-25 23:00:59.431087+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'test1@ucf.edu', '$2a$06$iIKa3yXOOVl3GUmnnvWVWeAdbfuZZea/PA0AnSgsuTA.cRfcI7kJ.', '2026-04-25 21:40:59.322994+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-04-25 23:24:22.864956+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2026-04-25 21:40:59.322994+00', '2026-04-25 23:24:22.867066+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '{"sub": "11111111-1111-4111-8111-111111111111", "email": "test1@ucf.edu"}', 'email', '2026-04-25 21:40:59.322994+00', '2026-04-25 21:40:59.322994+00', '2026-04-25 21:40:59.322994+00', '34dc05a6-341c-4f95-9f19-1848b6d2e935'),
	('22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '{"sub": "22222222-2222-4222-8222-222222222222", "email": "test2@ucf.edu"}', 'email', '2026-04-25 21:40:59.322994+00', '2026-04-25 21:40:59.322994+00', '2026-04-25 21:40:59.322994+00', '759cd4e3-190d-481c-b000-ec362c85e715'),
	('33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '{"sub": "33333333-3333-4333-8333-333333333333", "email": "test3@ucf.edu"}', 'email', '2026-04-25 21:40:59.322994+00', '2026-04-25 21:40:59.322994+00', '2026-04-25 21:40:59.322994+00', '70a99ba4-cf90-4986-bd0d-d1ab05964b31');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('5ae1db4f-23cc-4c14-9707-ca7ffd4eacc5', '33333333-3333-4333-8333-333333333333', '2026-04-25 23:00:59.428224+00', '2026-04-25 23:00:59.428224+00', NULL, 'aal1', NULL, NULL, 'node', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('8dca5689-2b0f-473e-8ae2-a089fbae0435', '11111111-1111-4111-8111-111111111111', '2026-04-25 23:24:22.865019+00', '2026-04-25 23:24:22.865019+00', NULL, 'aal1', NULL, NULL, 'node', '172.18.0.1', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('5ae1db4f-23cc-4c14-9707-ca7ffd4eacc5', '2026-04-25 23:00:59.431407+00', '2026-04-25 23:00:59.431407+00', 'password', 'd66a3527-7b63-4517-8006-8dc077121256'),
	('8dca5689-2b0f-473e-8ae2-a089fbae0435', '2026-04-25 23:24:22.867471+00', '2026-04-25 23:24:22.867471+00', 'password', 'a675758e-16b7-47a0-bccb-500715efcc04');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 4, 'lamlfyjqw6pr', '33333333-3333-4333-8333-333333333333', false, '2026-04-25 23:00:59.429929+00', '2026-04-25 23:00:59.429929+00', NULL, '5ae1db4f-23cc-4c14-9707-ca7ffd4eacc5'),
	('00000000-0000-0000-0000-000000000000', 5, 'k4aq7fb72xlc', '11111111-1111-4111-8111-111111111111', false, '2026-04-25 23:24:22.866351+00', '2026-04-25 23:24:22.866351+00', NULL, '8dca5689-2b0f-473e-8ae2-a089fbae0435');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profile" ("profession", "age", "about", "skill", "first_name", "user_id", "last_name", "header_pic_path", "occupation", "workplace", "articles", "banner_pic_url", "orcid", "timezone") VALUES
	(NULL, NULL, 'I love music ', '{Other,Money,Economics}', 'Bob', '22222222-2222-4222-8222-222222222222', 'Brown', NULL, 'Postdoctoral Fellow', 'University of Central Florida', NULL, NULL, NULL, NULL),
	(NULL, NULL, 'I am Carol Carlsen. I love planes', '{Other}', 'Carol', '33333333-3333-4333-8333-333333333333', 'Carter', NULL, 'Assistant Professor', 'University of Central Florida', NULL, NULL, NULL, NULL),
	(NULL, NULL, 'I am Alice Anderson, and I love math!!', '{C++,Python,"Machine Learning","Data Analysis"}', 'Alice', '11111111-1111-4111-8111-111111111111', 'Anderson', '11111111-1111-4111-8111-111111111111/header-rmpc_logo.webp', 'PhD Student', 'University of Central Florida', NULL, NULL, NULL, NULL);


--
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: authors; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: publications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: authors_publications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."conversations" ("id", "created_at", "name", "is_group") OVERRIDING SYSTEM VALUE VALUES
	(1, '2026-04-25 21:00:00.216195+00', 'Alice''s Awesome Group', true);


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."groups" ("group_id", "name", "description", "created_at", "conversation_id", "topics", "last_activity_at", "privacy", "avatar_url", "cover_photo_url", "rules") VALUES
	(1, 'Alice''s Awesome Group', 'This is about Alice', '2026-04-25 21:00:00.216195+00', 1, '{Alice,"Machine Learning"}', '2026-04-25 21:00:16.787384+00', 'public', NULL, NULL, '');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("first_name", "last_name", "email", "created_at", "user_id", "profile_pic_path", "is_banned", "banned_at", "banned_by") VALUES
	('Bob', 'Bobberson', 'test2@ucf.edu', '2026-04-25 20:54:47.267116+00', '22222222-2222-4222-8222-222222222222', NULL, false, NULL, NULL),
	('Carol', 'Carlsen', 'test3@ucf.edu', '2026-04-25 20:54:47.267116+00', '33333333-3333-4333-8333-333333333333', NULL, false, NULL, NULL),
	('Alice', 'Anderson', 'test1@ucf.edu', '2026-04-25 20:54:47.267116+00', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111/balatro.webp', false, NULL, NULL);


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."posts" ("post_id", "category", "created_at", "text", "like_amount", "user_id", "group_id", "media_path", "scientific_field", "taken_down", "media_width", "media_height") VALUES
	(1, 'general', '2026-04-25 21:00:16.787384+00', 'I love Alice''s Group!', 0, '11111111-1111-4111-8111-111111111111', 1, NULL, 'Mathematics', false, NULL, NULL),
	(2, 'general', '2026-04-25 21:01:13.207377+00', 'This is my first math post guys! I love mathematics soooo much!', 0, '11111111-1111-4111-8111-111111111111', NULL, NULL, 'Mathematics', false, NULL, NULL),
	(3, 'general', '2026-04-25 21:03:51.048545+00', 'Grr, why is this math problem so dang hard?!?!', 0, '11111111-1111-4111-8111-111111111111', NULL, '11111111-1111-4111-8111-111111111111/Adding-2-Drills-50-questions-Worksheet.webp', 'Mathematics', false, 1274, 1801),
	(4, 'general', '2026-04-25 21:18:30.549348+00', 'Math is the sun', 0, '11111111-1111-4111-8111-111111111111', NULL, '11111111-1111-4111-8111-111111111111/237781.webp', 'Mathematics', false, 5000, 2619),
	(5, 'general', '2026-04-25 22:21:19.030212+00', '1600x900', 0, '11111111-1111-4111-8111-111111111111', NULL, '11111111-1111-4111-8111-111111111111/1032-1600x900.webp', 'Aerodynamics', false, 1600, 900),
	(6, 'general', '2026-04-25 22:23:52.521053+00', '1600x100', 0, '11111111-1111-4111-8111-111111111111', NULL, '11111111-1111-4111-8111-111111111111/329-1600x100.webp', 'Mathematics', false, 1600, 100),
	(7, 'general', '2026-04-25 22:24:36.564999+00', '400x400', 0, '11111111-1111-4111-8111-111111111111', NULL, '11111111-1111-4111-8111-111111111111/652-400x400.webp', 'Mathematics', false, 400, 400),
	(8, 'general', '2026-04-25 22:25:38.842705+00', '100x1600', 0, '11111111-1111-4111-8111-111111111111', NULL, '11111111-1111-4111-8111-111111111111/197-100x1600.webp', 'Aerodynamics', false, 100, 1600),
	(9, 'general', '2026-04-25 22:27:59.784819+00', 'WORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTEST', 0, '22222222-2222-4222-8222-222222222222', NULL, NULL, 'Economics', false, NULL, NULL),
	(10, 'general', '2026-04-25 22:59:17.789948+00', 'NEWLINE TEST








This should be multiple newlines below the previous sentence.', 0, '22222222-2222-4222-8222-222222222222', NULL, NULL, 'Economics', false, NULL, NULL),
	(11, 'general', '2026-04-25 23:00:10.324295+00', ' LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST ', 0, '22222222-2222-4222-8222-222222222222', NULL, NULL, 'Economics', false, NULL, NULL),
	(12, 'general', '2026-04-25 23:00:47.367379+00', 'test comments', 0, '22222222-2222-4222-8222-222222222222', NULL, NULL, 'Economics', false, NULL, NULL);


--
-- Data for Name: comment; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."comment" ("post_id", "user_id", "text", "created_at", "like_count", "comment_id", "taken_down") VALUES
	(12, '33333333-3333-4333-8333-333333333333', ' LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST  LINE BREAK TEST ', '2026-04-25 23:02:12.91561+00', NULL, 2, false),
	(12, '33333333-3333-4333-8333-333333333333', 'WORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTESTWORDBREAKTEST', '2026-04-25 23:02:22.828662+00', NULL, 3, false),
	(12, '33333333-3333-4333-8333-333333333333', 'NEWLINE TEST











This should be several newlines below', '2026-04-25 23:02:56.525181+00', NULL, 4, false),
	(12, '33333333-3333-4333-8333-333333333333', 'I love planes', '2026-04-25 23:01:59.580172+00', 1, 1, false);


--
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."comment_likes" ("comment_id", "user_id", "created_at") VALUES
	(1, '33333333-3333-4333-8333-333333333333', '2026-04-25 23:05:12.665916+00');


--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."conversation_participants" ("conversation_id", "user_id", "joined_at") VALUES
	(1, '11111111-1111-4111-8111-111111111111', '2026-04-25 21:00:00.216195+00');


--
-- Data for Name: conversation_reads; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: feed_report; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."follows" ("follower_id", "following_id", "created_at") VALUES
	('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', '2026-04-25 23:03:43.491195+00');


--
-- Data for Name: group_bans; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_join_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."group_members" ("group_id", "role", "created_at", "user_id") VALUES
	(1, 'Admin', '2026-04-25 21:00:00.216195+00', '11111111-1111-4111-8111-111111111111');


--
-- Data for Name: invites; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: jobs_applicants; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: jobs_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: jobs_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: moderators; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: muted_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notifications" ("id", "user_id", "type", "title", "content", "link", "is_read", "created_at") VALUES
	('ca4e4c2e-380d-45d8-a6e0-15088c945a38', '22222222-2222-4222-8222-222222222222', 'new_comment', 'New Comment!', 'Someone commented on your post.', '/posts/12', false, '2026-04-25 23:01:59.580172+00'),
	('0b1635b3-2230-4565-a24c-b7f20e87ed6a', '22222222-2222-4222-8222-222222222222', 'new_comment', 'New Comment!', 'Someone commented on your post.', '/posts/12', false, '2026-04-25 23:02:12.91561+00'),
	('ad2a7853-5df0-4587-bb29-59cbf6ae7975', '22222222-2222-4222-8222-222222222222', 'new_comment', 'New Comment!', 'Someone commented on your post.', '/posts/12', false, '2026-04-25 23:02:22.828662+00'),
	('21ceafe2-485f-438e-891e-7f973e7bd2ae', '22222222-2222-4222-8222-222222222222', 'new_comment', 'New Comment!', 'Someone commented on your post.', '/posts/12', false, '2026-04-25 23:02:56.525181+00'),
	('10fbb7f7-78ed-4c91-a506-2750b3e34ea0', '22222222-2222-4222-8222-222222222222', 'new_follow', 'New Follower!', 'Someone started following you.', '/profile/33333333-3333-4333-8333-333333333333', false, '2026-04-25 23:03:43.491195+00'),
	('5895f7f6-100a-4f84-a20a-f3dd1b115d81', '22222222-2222-4222-8222-222222222222', 'post_like', 'New Like!', 'Someone liked your post.', '/posts/12', false, '2026-04-25 23:05:04.565759+00'),
	('5a1285b6-031f-491b-bfe1-ce39e959fb95', '22222222-2222-4222-8222-222222222222', 'post_like', 'New Like!', 'Someone liked your post.', '/posts/12', false, '2026-04-25 23:05:06.364683+00');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profile_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profile_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profile_tags_temp; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: publication_topics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_products; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_publications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_report; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 5, true);


--
-- Name: Articles_articleid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Articles_articleid_seq"', 1, false);


--
-- Name: Comment_comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Comment_comment_id_seq"', 4, true);


--
-- Name: Comment_likes_comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Comment_likes_comment_id_seq"', 1, false);


--
-- Name: Comment_post_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Comment_post_id_seq"', 1, false);


--
-- Name: FeedReport_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."FeedReport_report_id_seq"', 1, false);


--
-- Name: Groups_groupid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Groups_groupid_seq"', 1, true);


--
-- Name: Posts_postid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Posts_postid_seq"', 12, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."conversations_id_seq"', 1, true);


--
-- Name: group_join_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."group_join_requests_request_id_seq"', 1, false);


--
-- Name: group_members_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."group_members_group_id_seq"', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."jobs_id_seq"', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."messages_id_seq"', 1, false);


--
-- Name: products_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."products_product_id_seq"', 1, false);


--
-- Name: publications_publication_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."publications_publication_id_seq"', 1, false);


--
-- Name: skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."skills_id_seq"', 1, false);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."tags_id_seq"', 1, false);


--
-- Name: user_report_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."user_report_report_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict NMDMCdgFTWwvsuBUZ2eOsw9XgE7hZdztGi7fRn3CnZmOWWfqFs3UJ3RrwAANEIx

RESET ALL;
