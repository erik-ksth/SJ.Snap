"use client";

import { useState, useRef } from "react";

export default function ReportForm() {
     const [description, setDescription] = useState("");
     const [location, setLocation] = useState("");
     const [image, setImage] = useState<File | null>(null);
     const [imagePreview, setImagePreview] = useState<string | null>(null);
     const [loading, setLoading] = useState(false);
     const [response, setResponse] = useState("");
     const [error, setError] = useState("");
     const fileInputRef = useRef<HTMLInputElement>(null);

     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0] || null;
          if (file) {
               // Check file size (max 5MB)
               if (file.size > 5 * 1024 * 1024) {
                    setError("Image size too large. Maximum size is 5MB.");
                    return;
               }

               setImage(file);

               // Create preview
               const reader = new FileReader();
               reader.onloadend = () => {
                    setImagePreview(reader.result as string);
               };
               reader.readAsDataURL(file);
          } else {
               setImage(null);
               setImagePreview(null);
          }
     };

     const resetForm = () => {
          setDescription("");
          setLocation("");
          setImage(null);
          setImagePreview(null);
          setResponse("");
          if (fileInputRef.current) {
               fileInputRef.current.value = "";
          }
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setLoading(true);
          setError("");
          setResponse("");

          if (!image) {
               setError("Please select an image file");
               setLoading(false);
               return;
          }

          console.log("Image selected:", image.name, image.type, image.size);

          try {
               // Create FormData object
               const formData = new FormData();
               formData.append("description", description);
               formData.append("location", location);
               formData.append("image", image);

               // Log what's being sent
               console.log("Sending form data with keys:", Array.from(formData.keys()));

               // Send the request
               const res = await fetch("/api/imageVerification", {
                    method: "POST",
                    body: formData,
                    // Don't set Content-Type header manually, browser will set it with boundary
               });

               const data = await res.json();

               if (!res.ok) {
                    throw new Error(data.details || data.error || "Something went wrong");
               }

               setResponse(data.response);
          } catch (err) {
               setError(err instanceof Error ? err.message : "An unknown error occurred");
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
               <h2 className="text-2xl font-bold mb-6 text-center">Report an Issue</h2>

               <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                         <label htmlFor="description" className="block mb-2 font-medium">
                              Description
                         </label>
                         <input
                              id="description"
                              type="text"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="What's the issue?"
                              required
                         />
                    </div>

                    <div className="mb-4">
                         <label htmlFor="location" className="block mb-2 font-medium">
                              Location
                         </label>
                         <input
                              id="location"
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Where is it located?"
                              required
                         />
                    </div>

                    <div className="mb-6">
                         <label htmlFor="image" className="block mb-2 font-medium">
                              Image
                         </label>

                         {imagePreview ? (
                              <div className="relative mb-3">
                                   <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-48 object-contain border rounded-md"
                                   />
                                   <button
                                        type="button"
                                        onClick={() => {
                                             setImage(null);
                                             setImagePreview(null);
                                             if (fileInputRef.current) {
                                                  fileInputRef.current.value = "";
                                             }
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                   >
                                        ×
                                   </button>
                              </div>
                         ) : null}

                         <input
                              ref={fileInputRef}
                              id="image"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="w-full border border-gray-300 rounded-md p-2"
                              required
                         />
                         <p className="text-sm text-gray-500 mt-1">
                              Maximum file size: 5MB. Supported formats: JPG, PNG, GIF.
                         </p>
                    </div>

                    <div className="flex gap-2">
                         <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                         >
                              {loading ? "Submitting..." : "Submit Report"}
                         </button>

                         {!loading && (
                              <button
                                   type="button"
                                   onClick={resetForm}
                                   className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                              >
                                   Reset
                              </button>
                         )}
                    </div>
               </form>

               {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                         {error}
                    </div>
               )}

               {response && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md">
                         <h3 className="font-bold mb-2">AI Response:</h3>
                         <p className="whitespace-pre-line">{response}</p>
                    </div>
               )}
          </div>
     );
}