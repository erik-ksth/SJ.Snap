// Function to extract description and location from AI response
export function extractResponseDetails(response: string) {
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
