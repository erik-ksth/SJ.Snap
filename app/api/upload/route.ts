import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with anon key (no auth required)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set max file size to 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Missing image file" },
        { status: 400 }
      );
    }

    // Validate file size
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size (5MB)` },
        { status: 400 }
      );
    }

    // Validate file type
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    if (!validImageTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
        },
        { status: 400 }
      );
    }

    // Generate a unique file name
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    try {
      // Convert image to array buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage (using anonymous access)
      const { error } = await supabase.storage
        .from("reports")
        .upload(filePath, fileBuffer, {
          contentType: imageFile.type,
          upsert: true,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return NextResponse.json(
          { error: "Failed to upload image", details: error.message },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("reports")
        .getPublicUrl(filePath);

      return NextResponse.json({
        success: true,
        filePath,
        publicUrl: urlData.publicUrl,
      });
    } catch (uploadError) {
      console.error("Error during upload process:", uploadError);
      return NextResponse.json(
        {
          error: "Upload process failed",
          details:
            uploadError instanceof Error
              ? uploadError.message
              : String(uploadError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing upload request:", error);
    return NextResponse.json(
      {
        error: "Failed to process upload request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
