import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a service role client for admin access that bypasses RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
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
    const insertData = {
      description,
      location: location || null,
      image_url: imageUrl,
    };

    // Add user_id if it's provided
    if (userId) {
      console.log("Creating report with user ID:", userId);
      Object.assign(insertData, { user_id: userId });
    } else {
      console.log("Creating anonymous report");
    }

    // Always use the admin client to bypass RLS
    const { data: report, error } = await supabaseAdmin
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
