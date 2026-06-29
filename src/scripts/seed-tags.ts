import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_SECRET_SUPABASE_KEY!
);

type TagRow = {
    openalex_id: string,
    name: string,
    level: number;
    parent_openalex_id: string | null;
};

function cleanId(id: string){
    return id.replace("https://openalex.org/", "");
}

async function fetchAllTopics() {
  let url = "https://api.openalex.org/topics?per-page=200&cursor=*";
  const allTopics: any[] = [];

  while (url) {
    const res = await fetch(url);
    const data = await res.json();

    allTopics.push(...(data.results ?? []));

    url = data.meta?.next_cursor
      ? `https://api.openalex.org/topics?per-page=200&cursor=${encodeURIComponent(data.meta.next_cursor)}`
      : "";
  }

  console.log("Total topics fetched:", allTopics.length);
  return allTopics;
}

async function fetchAllInsertedTags() {
  const allTags: any[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("tags")
      .select("id, openalex_id")
      .range(from, to);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allTags.push(...data);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allTags;
}

async function seedTags() {
    const topics = await fetchAllTopics();
    const tagMap = new Map<string, TagRow>();

    for(const topic of topics){
        const domainId = cleanId(topic.domain.id);
        const subfieldId = cleanId(topic.subfield.id);
        const fieldId = cleanId(topic.field.id);
        const topicId = cleanId(topic.id);

        tagMap.set(domainId, {
            openalex_id: domainId,
            name: topic.domain.display_name,
            level: 0,
            parent_openalex_id: null,
        });

        tagMap.set(fieldId, {
            openalex_id: fieldId,
            name: topic.field.display_name,
            level: 1,
            parent_openalex_id: domainId,
        });

        tagMap.set(subfieldId, {
            openalex_id: subfieldId,
            name: topic.subfield.display_name,
            level: 2,
            parent_openalex_id: fieldId,
        });

        tagMap.set(topicId, {
            openalex_id: topicId,
            name: topic.display_name,
            level: 3,
            parent_openalex_id: subfieldId,
        });
    }

    const rows = Array.from(tagMap.values());

    const{ error: insertError } = await supabase.from("tags").upsert(
        rows.map(({ openalex_id, name, level }) => ({
            openalex_id,
            name,
            level,
        })),
        { onConflict: "openalex_id"}
    );

    if(insertError) throw insertError;

      const insertedTags = await fetchAllInsertedTags();
      const idMap = new Map(insertedTags.map((t) => [t.openalex_id, t.id]));

    for (const row of rows) {
        const tagId = idMap.get(row.openalex_id);
        const parentId = row.parent_openalex_id 
        ? idMap.get(row.parent_openalex_id) ?? null
        : null;
        
    if (!tagId) continue;

    const { error: updateError } = await supabase
      .from("tags")
      .update({ parent_tag_id: parentId })
      .eq("id", tagId);

    if (updateError) throw updateError;
  }

  console.log("Done seeding tags");
}

seedTags().catch(console.error);
