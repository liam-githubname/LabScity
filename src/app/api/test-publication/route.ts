import { createPublication } from "@/lib/actions/publication";
import { NextResponse } from "next/server";

// this is just for testing


export async function GET() {
  const result = await createPublication({
    title: "Second Test Publication",
    doi: "12.1000/test-doi2",
    publicationType: 'journal_article',
    journal: "Test Journal",
    datePublished: "2025-01-01",
    authors: ["Barbara Sharanowski", "Jane Smith"]
  });

  return NextResponse.json(result);
}

/*
export async function GET(){
    const result = await getUserPublications(
        "b798c0c3-bd97-4595-8ac1-d05029206303"
    )
    return NextResponse.json(result);
}*/