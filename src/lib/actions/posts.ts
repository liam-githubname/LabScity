"use server";

import { createClient } from "@/supabase/server";
import { z } from "zod";
// TODO: add necessary validation forms
// import {} from "@/lib/validations/feed"

// FIXME: Should probably house this interface somewhere else so it can be used later
interface Post {
  readonly postID: string;
  readonly dateCreated: number;
  readonly image?: string;
  readonly tags?: string[];
  readonly content?: string;
  readonly Comments?: string[];
  // TODO: look for post information and meta data for interface
}

// NOTE: Do last as will call other funcs
export async function getFeedPosts() {
  // TODO: Will need to retrieve posts by some metrics
  // TODO: Will need to sort posts (chronological probably - with a filter on followed users posts? - then other posts?)
}

export async function getPostById(postID: string) {
  // make connection to database with supabase client
  // search the tables for posts associated with userID
  const connection = createClient();


}

// NOTE: This will probably be mostly used by profile viewing pages
export async function getUserPosts() { }

// NOTE: I want to be able to search all posts by certain filters (e.g. the kind of science, by date created )
export async function searchPosts(query: string) { }

// NOTE: will comments be associated with posts objects in the database or held somewhere else?
// They might need to be held somewhere else so accessing them without the post can be done (i.e. moderation)
// export async function getComments() {}

