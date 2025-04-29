import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a service role client for admin access that bypasses RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const showPrivate = url.searchParams.get("showPrivate") === "true";
    const showPublic = url.searchParams.get("showPublic") === "true";
    const offset = (page - 1) * limit;

    // Query to get reports using the admin client
    let query = supabaseAdmin
      .from("reports")
      .select(
        `
        id,
        user_id,
        description,
        location,
        image_url,
        is_public,
        created_at
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Filter by userId if provided
    if (userId) {
      query = query.eq("user_id", userId);
      // Apply visibility filters
      if (showPrivate) {
        // Show only private reports
        query = query.eq("is_public", false);
      } else if (showPublic) {
        // Show only public reports
        query = query.eq("is_public", true);
      }
      // If neither showPrivate nor showPublic is true, show all reports
    } else {
      // For non-user specific view, only show public reports
      query = query.eq("is_public", true);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error("Error fetching reports:", error);
      return NextResponse.json(
        { error: "Failed to fetch reports", details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from("reports")
      .select("*", { count: "exact", head: true });

    // Apply the same filters for the count
    if (userId) {
      countQuery = countQuery.eq("user_id", userId);
      if (showPrivate) {
        countQuery = countQuery.eq("is_public", false);
      } else if (showPublic) {
        countQuery = countQuery.eq("is_public", true);
      }
    } else {
      countQuery = countQuery.eq("is_public", true);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      success: true,
      reports,
      pagination: {
        total: totalCount || 0,
        page,
        limit,
        pages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch reports",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
