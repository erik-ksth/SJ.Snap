import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse the request body
    const data = await request.json();
    const { description, location, imageUrl, userId } = data;

    if (!description || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prepare insert data
    // For anonymous reports, don't include user_id at all
    const insertData = {
      description,
      location: location || null,
      image_url: imageUrl,
    };

    // Only add user_id if it's provided and not null/undefined
    if (userId) {
      // Using spread operator to add user_id only for authenticated users
      Object.assign(insertData, { user_id: userId });
    }

    console.log("Inserting report with data:", insertData);

    const { data: report, error } = await supabase
      .from("reports")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error inserting report:", error);
      return NextResponse.json(
        { error: "Failed to save report", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error saving report:", error);
    return NextResponse.json(
      {
        error: "Failed to save report",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
