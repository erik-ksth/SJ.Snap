import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a service role client for admin access that bypasses RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const data = await request.json();
    // Default to false (private) if is_public is not provided
    const is_public = data.is_public ?? false;

    // Verify the report exists
    const { error: fetchError } = await supabaseAdmin
      .from("reports")
      .select("user_id")
      .eq("id", reportId)
      .single();

    if (fetchError) {
      console.error("Error fetching report:", fetchError);
      return NextResponse.json(
        { error: "Report not found", details: fetchError.message },
        { status: 404 }
      );
    }

    // Update the report
    const { data: updatedReport, error: updateError } = await supabaseAdmin
      .from("reports")
      .update({ is_public })
      .eq("id", reportId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating report:", updateError);
      return NextResponse.json(
        { error: "Failed to update report", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      {
        error: "Failed to update report",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
