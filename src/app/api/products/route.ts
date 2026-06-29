import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import type { Product } from "@/lib/types/data";

// GET /api/products?userId={userId}
// returns all products that belong to the specified user 
// query params = userId
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json<ApiResponse<Product[]>>(
        { 
            success: false, error: "userId required" 
        }, { status: 400 }
    );

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("user_products")
        .select("products(*)")
        .eq("user_id", userId)
        .returns<{ products: Product }[]>();

    if (error) return NextResponse.json<ApiResponse<Product[]>>(
        { 
            success: false, 
            error: error.message 
        }, { status: 500 }
    );

    return NextResponse.json<ApiResponse<Product[]>>(
        { 
            success: true, 
            data: data.map((row) => row.products) 
        }
    );
}