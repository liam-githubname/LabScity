import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getPostById, searchForGroups, searchForPosts, searchForUsers, searchUserContent } from "../../lib/actions/data";
import { GetPostByIdInput, GetUserPostsInput } from "../../lib/types/data";
import { getUserPosts } from "../../lib/actions/data";

async function integration_test_data_ts() {
  console.log("Starting testing");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SECRET_SUPABASE_KEY!,
  )

  const test_id: GetPostByIdInput = {
    post_id: 10
  }

  const result1 = await getPostById(test_id, supabaseAdmin);

  console.log("Result: ", result1);

  const test_user: GetUserPostsInput = {
    user_id: "02fe68aa-1c88-477d-9f0f-b9dd86736537"
  }

  const result2 = await getUserPosts(test_user, supabaseAdmin);

  console.log("Result: ", result2);

  const result3 = await getUserPosts({
    user_id: "02fe68aa-1c88-477d-9f0f-b9dd86736537",
    limit: 1,
  }, supabaseAdmin);

  console.log("Result3 ", result3);

  const result4 = await searchUserContent({ query: "post" }, supabaseAdmin);
  const result5 = await searchUserContent({ query: "Chris" }, supabaseAdmin);
  const result6 = await searchUserContent({ query: "test group" }, supabaseAdmin);
  const result7 = await searchUserContent({ query: "blah", limit: 5 }, supabaseAdmin);

  console.log("result4: ", result4);
  console.log("result5: ", result5);
  console.log("result6: ", result6);
  console.log("result7: ", result7);

  const result8 = await searchForUsers({ query: "Lixm Harvell" }, supabaseAdmin)
  const result9 = await searchForPosts({ query: "qokka real" }, supabaseAdmin)
  const result10 = await searchForGroups({ query: "test" }, supabaseAdmin)

  console.log("result8: ", result8)
  console.log("result9: ", result9)
  console.log("result10: ", result10)

}

if (require.main === module) {
  integration_test_data_ts();
}
