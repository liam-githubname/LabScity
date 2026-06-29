import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/supabase/server";
import HomeFeedSkeleton from "@/components/feed/home-feed-skeleton";
import HomeFeedServer from "@/components/feed/home-feed-server";

export const metadata: Metadata = {
  title: "Home | LabScity",
  description: "Discover research updates from the LabScity community.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  return (
    <Suspense fallback={<HomeFeedSkeleton />}>
      <HomeFeedServer />
    </Suspense>
  );
}
