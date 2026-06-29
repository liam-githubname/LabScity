'use client'

import { Badge } from "@mantine/core";
import { useRouter } from "next/navigation";

export default function Hashtag({hashtag}: {hashtag: string}) {
    const router = useRouter();

    return (
      <Badge
        color="gray.7"
        fw="normal"
        fz="sm"
        p={12}
        tt="capitalize"
        variant="outline"
        onClick={() => router.push(`/home?hashtag=${hashtag}`)}
        style={{cursor: "pointer"}}
     >
        #{hashtag}
      </Badge>
    )
  }