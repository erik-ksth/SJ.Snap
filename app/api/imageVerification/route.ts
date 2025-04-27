import { HfInference } from "@huggingface/inference";
import { NextRequest, NextResponse } from "next/server";

// Initialize Hugging Face client
const hfToken = process.env.HUGGING_FACE_API_KEY || "";
if (!hfToken) {
  console.warn(
    "HUGGINGFACE_API_TOKEN is not set. Using fallback token which may not work."
  );
}
const client = new HfInference(hfToken || "YOUR_HF_TOKEN");

// Function to extract description and location from AI response
function extractResponseDetails(response: string) {
  // Look for "Description of Issue:" and "Specific Location Details:" patterns
  const descriptionMatch = response.match(
    /Description of Issue:[\s\n]*([\s\S]*?)(?=Specific Location Details:|$)/i
  );
  const locationMatch = response.match(
    /Specific Location Details:[\s\n]*([\s\S]*?)(?=$)/i
  );

  const description = descriptionMatch ? descriptionMatch[1].trim() : "";
  const location = locationMatch ? locationMatch[1].trim() : "";

  return { description, location };
}

export async function POST(request: NextRequest) {
  try {
    console.log(
      "API route called - Content Type:",
      request.headers.get("content-type")
    );

    // Parse form data
    const formData = await request.formData();
    console.log("Form data received", {
      keys: Array.from(formData.keys()),
      hasDescription: Boolean(formData.get("description")),
      hasLocation: Boolean(formData.get("location")),
      hasImage: Boolean(formData.get("image")),
    });

    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const imageFile = formData.get("image");

    console.log("Description:", description);
    console.log("Location:", location);
    console.log("Image:", imageFile);

    // Validate image file specifically
    if (!imageFile || !(imageFile instanceof File)) {
      console.error("Invalid or missing image file:", imageFile);
      return NextResponse.json(
        {
          error: "Missing or invalid image file",
          imageReceived: Boolean(imageFile),
          imageType: typeof imageFile,
        },
        { status: 400 }
      );
    }

    console.log("Image file details:", {
      name: imageFile.name,
      type: imageFile.type,
      size: imageFile.size,
    });

    if (!description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert image to base64
    console.log("Converting image to base64");
    try {
      const imageArrayBuffer = await imageFile.arrayBuffer();
      if (!imageArrayBuffer || imageArrayBuffer.byteLength === 0) {
        console.error("Empty image data");
        return NextResponse.json(
          { error: "Empty image data" },
          { status: 400 }
        );
      }

      console.log(`Image size: ${imageArrayBuffer.byteLength} bytes`);
      const imageBase64 = Buffer.from(imageArrayBuffer).toString("base64");

      // Ensure correct MIME type, defaulting to jpeg if not available
      const mimeType = imageFile.type || "image/jpeg";
      const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;
      console.log(
        "Image converted, type:",
        mimeType,
        "length:",
        imageBase64.length
      );

      // Validate image data
      if (imageBase64.length === 0) {
        return NextResponse.json(
          { error: "Invalid image: Empty or corrupted file" },
          { status: 400 }
        );
      }

      // Create user message with location and description
      const userMessage = `${description} at ${location}.\n\nCheck the image if the problem is correct. If so, format it correctly and informatively to report to the city. Otherwise, return "Negative" and nothing else. Return in this exact format:
      Description of Issue:
      Specific Location Details:
      `;

      // Check if we have a valid token before proceeding
      if (!hfToken) {
        console.error("Cannot process request: Missing Hugging Face API token");
        return NextResponse.json(
          { error: "Configuration error: Missing API token" },
          { status: 500 }
        );
      }

      // Stream the chat completion
      console.log("Sending request to Hugging Face");
      try {
        const stream = client.chatCompletionStream({
          model: "google/gemma-3-27b-it",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: userMessage },
                { type: "image_url", image_url: { url: imageDataUrl } },
              ],
            },
          ],
          provider: "nebius",
          temperature: 0.5,
          max_tokens: 2048,
          top_p: 0.7,
        });

        // Process stream and return response
        let response = "";
        for await (const chunk of stream) {
          if (chunk.choices && chunk.choices.length > 0) {
            const newContent = chunk.choices[0].delta.content;
            if (newContent) {
              response += newContent;
            }
          }
        }

        console.log("Response received, length:", response.length);

        // Check if response is "Negative"
        if (response.trim() === "Negative") {
          return NextResponse.json({
            success: false,
            response: "Negative",
            message:
              "The description doesn't match with the image. Please provide an accurate description of the issue.",
          });
        }

        // Extract and log description and location details
        const {
          description: extractedDescription,
          location: extractedLocation,
        } = extractResponseDetails(response);
        console.log(
          `Description of Issue: ${extractedDescription}\nSpecific Location Details: ${extractedLocation}`
        );

        return NextResponse.json({ success: true, response });
      } catch (apiError) {
        console.error("Hugging Face API error:", apiError);
        return NextResponse.json(
          {
            error: "API call failed",
            details:
              apiError instanceof Error ? apiError.message : String(apiError),
          },
          { status: 502 }
        );
      }
    } catch (error) {
      console.error("Error processing image conversion:", error);
      return NextResponse.json(
        {
          error: "Failed to process image conversion",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing image verification:", error);
    return NextResponse.json(
      {
        error: "Failed to process image verification",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
