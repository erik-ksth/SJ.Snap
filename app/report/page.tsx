'use client';

import { useSupabaseAuth } from '@/lib/context/supabase-auth-context';
import { useState } from 'react';
import { MapPinIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { uploadFile, getPublicUrl, createReport } from '@/lib/supabase/supabase';

export default function ReportPage() {
     const { user, loading } = useSupabaseAuth();
     const [imagePreview, setImagePreview] = useState<string | null>(null);
     const [imageFile, setImageFile] = useState<File | null>(null);
     const [location, setLocation] = useState<string | null>(null);
     const [description, setDescription] = useState('');
     const [isSubmitting, setIsSubmitting] = useState(false);
     const router = useRouter();

     const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) {
               setImageFile(file);
               const reader = new FileReader();
               reader.onloadend = () => {
                    setImagePreview(reader.result as string);
               };
               reader.readAsDataURL(file);
          }
     };

     const detectLocation = () => {
          if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(
                    (position) => {
                         const lat = position.coords.latitude;
                         const lng = position.coords.longitude;
                         setLocation(`${lat}, ${lng}`);
                    },
                    (error) => {
                         console.error("Error getting location:", error);
                         alert("Unable to retrieve your location");
                    }
               );
          } else {
               alert("Geolocation is not supported by your browser");
          }
     };

     const submitReport = async (e: React.FormEvent) => {
          e.preventDefault();

          if (!user) {
               alert('Please log in to submit a report');
               return;
          }

          if (!imageFile || !imagePreview) {
               alert('Please upload an image');
               return;
          }

          setIsSubmitting(true);

          try {
               // Generate a unique file path
               const filePath = `${user.id}/${Date.now()}-${imageFile.name}`;

               // Upload image to Supabase Storage
               await uploadFile('reports', filePath, imageFile, {
                    contentType: imageFile.type,
                    upsert: false
               });

               // Get the public URL
               const imageUrl = getPublicUrl('reports', filePath);

               // Save report to Supabase
               await createReport({
                    description,
                    location,
                    image_url: imageUrl,
               });

               alert('Report submitted successfully!');
               router.push('/'); // Redirect to home page

          } catch (error) {
               console.error('Error submitting report:', error);
               alert('There was an error submitting your report. Please try again.');
          } finally {
               setIsSubmitting(false);
          }
     };

     return (
          <div className="container mx-auto px-4 py-8">
               <h1 className="text-2xl font-bold mb-6">Report</h1>

               {!user && !loading && (
                    <div className="p-4 mb-6 bg-yellow-100 text-yellow-800 rounded">
                         Please <a className="underline" href="/login">log in</a> to access all features.
                    </div>
               )}

               <div className="p-6 border rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Submit a Report</h2>

                    <form onSubmit={submitReport}>
                         {/* Image Upload Section */}
                         <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                              <div className="flex items-center justify-center w-full">
                                   <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                        {imagePreview ? (
                                             <div className="h-full w-full relative">
                                                  <img src={imagePreview} alt="Preview" className="h-full w-full object-contain p-2" />
                                                  <button
                                                       onClick={() => {
                                                            setImagePreview(null);
                                                            setImageFile(null);
                                                       }}
                                                       className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                                                       type="button"
                                                  >
                                                       ✕
                                                  </button>
                                             </div>
                                        ) : (
                                             <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                  <PhotoIcon className="w-10 h-10 mb-3 text-gray-400" />
                                                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 10MB)</p>
                                             </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                                   </label>
                              </div>
                         </div>

                         {/* Description Input */}
                         <div className="mb-6">
                              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                              <textarea
                                   id="description"
                                   rows={4}
                                   className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                   placeholder="Please describe what you're reporting..."
                                   value={description}
                                   onChange={(e) => setDescription(e.target.value)}
                                   required
                              ></textarea>
                         </div>

                         {/* Location Section */}
                         <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                              <div className="flex items-center space-x-2">
                                   <input
                                        type="text"
                                        className="block flex-1 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Coordinates or address"
                                        value={location || ''}
                                        readOnly
                                   />
                                   <button
                                        type="button"
                                        onClick={detectLocation}
                                        className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700"
                                   >
                                        <MapPinIcon className="h-5 w-5 mr-1" />
                                        Detect
                                   </button>
                              </div>
                         </div>

                         {/* Submit Button */}
                         <button
                              type="submit"
                              disabled={isSubmitting || !user}
                              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-white font-medium hover:bg-blue-700 disabled:bg-blue-400"
                         >
                              {isSubmitting ? 'Submitting...' : 'Submit Report'}
                         </button>
                    </form>
               </div>
          </div>
     );
} 