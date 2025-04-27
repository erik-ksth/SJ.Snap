"use client";

import { useSupabaseAuth } from "@/lib/context/supabase-auth-context";
import { useState, useEffect, useRef } from "react";
import { PhotoIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";
import mapboxgl from "mapbox-gl";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import emailjs from "@emailjs/browser";
import { extractResponseDetails } from "../lib/utils";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
// /import { useRouter } from 'next/navigation';
// import { uploadFile, getPublicUrl, createReport } from '@/lib/supabase/supabase';

export default function ReportPage() {
  const { user, loading } = useSupabaseAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Add state for editing in step 4
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Add new state for tracking the current step
  const [currentStep, setCurrentStep] = useState(1);
  // Add state for success confirmation
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Automatically open camera on mobile when the page loads
    if (currentStep === 1 && fileInputRef.current && isMobile()) {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 500);
    }
  }, [currentStep]);

  // Check if user is on mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // Move to next step after image is captured if not already in step 4
        if (currentStep === 1) {
          setCurrentStep(2);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await response.json();
      return data.display_name; // Full address
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return null;
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const address = await reverseGeocode(lat, lng);
          if (address) {
            setLocation(address);
          } else {
            setLocation(`Lat: ${lat}, Lng: ${lng}`);
          }

          // Update Mapbox map and marker
          if (map) {
            map.flyTo({ center: [lng, lat], zoom: 14 });
            if (marker) {
              marker.setLngLat([lng, lat]);
            } else {
              const newMarker = new mapboxgl.Marker()
                .setLngLat([lng, lat])
                .addTo(map);
              setMarker(newMarker);
            }
          }

          // Move to final review step
          setCurrentStep(4);
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

  // Handle moving to the next step
  const moveToNextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 2) {
      const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (!description.trim()) {
        alert("Please enter a description");
        return;
      } else if (wordCount < 2) {
        alert("Description should be at least 2 words");
        return;
      }
    }

    // Move to next step
    setCurrentStep(currentStep + 1);

    // Automatically detect location when reaching location step
    if (currentStep === 2) {
      setTimeout(detectLocation, 500);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile || !imagePreview) {
      alert('Please upload an image');
      return;
    }

    const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 2) {
      alert("Description should be at least 2 words");
      return;
    }

    setIsSubmitting(true);

    try {
      // First upload the image to Supabase
      const uploadFormData = new FormData();
      uploadFormData.append("image", imageFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.details || errorData.error || "Failed to upload image");
      }

      const uploadData = await uploadResponse.json();
      console.log("Image upload successful:", uploadData);

      // Now create FormData for image verification with the Supabase URL
      const formData = new FormData();
      formData.append("description", description);
      if (location) {
        formData.append("location", location);
      } else {
        formData.append("location", "");
      }
      formData.append("image", imageFile);

      // Send the request for verification
      const response = await fetch('/api/imageVerification', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || "Something went wrong");
      }

      const responseData = await response.json();
      console.log("API Response:", responseData);

      if (responseData.response === "Negative") {
        alert("The description doesn't match with the image. Please provide an accurate description of the issue.");
        // Return to review step instead of clearing values
        setCurrentStep(4);
      } else {
        // Extract description and location from the response
        const { description: enhancedDescription, location: enhancedLocation } = extractResponseDetails(responseData.response);
        // Show success screen
        console.log("Description:", enhancedDescription);
        console.log("Location:", enhancedLocation);

        // Save report to database - with or without user ID
        try {
          const reportData = {
            description: enhancedDescription,
            location: enhancedLocation,
            imageUrl: uploadData.publicUrl,
            // Only include userId if user is logged in
            ...(user && { userId: user.id })
          };

          const reportResponse = await fetch('/api/reports', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(reportData),
          });

          if (reportResponse.ok) {
            console.log("Report saved to database");
          } else {
            console.error("Failed to save report to database");
            const errorData = await reportResponse.json();
            console.error("Error details:", errorData);
          }
        } catch (error) {
          console.error("Error saving report to database:", error);
        }

        // Send email using EmailJS with Supabase image URL
        const result = await emailjs.send(
          "service_az5gytx", // Service ID from EmailJS
          "template_sqlnyfo", // Template ID from EmailJS
          {
            from_name: "SJ Snap",
            from_email: "kaungsitu09009@gmail.com",
            email: "heinkaung16@gmail.com",
            description: enhancedDescription,
            location: enhancedLocation,
            imageUrl: uploadData.publicUrl, // Use the Supabase public URL instead
            latitude: marker?.getLngLat().lat,
            longitude: marker?.getLngLat().lng,
          },
          "OriH99KkGtVruBYSe" // Public API Key (safe) from EmailJS
        );
        console.log("EmailJS Result:", result);
        setShowSuccess(true);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert('There was an error submitting your report. Please try again.');
      // Stay on the review page on error
      setCurrentStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (currentStep === 3 || currentStep === 4) {
      if (!mapContainerRef.current) return;

      const mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-121.87578145532126, 37.334973065378634], // Default center (SJSU)
        zoom: 12,
      });

      setMap(mapInstance);

      return () => {
        mapInstance.remove();
      };
    }
  }, [currentStep]);

  // Render step content based on current step
  const renderStepContent = () => {
    // Show success screen if showSuccess is true
    if (showSuccess) {

      return (
        <div className="mb-6 flex flex-col items-center justify-center py-10">
          <div className="relative">
            {/* Outer pulsing circle animation */}
            <div className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-25"></div>
            {/* Inner circle with check icon */}
            <div className="relative bg-green-500 text-white rounded-full p-6 flex items-center justify-center">
              <CheckIcon className="h-16 w-16 animate-[bounce_1s_ease-in-out_infinite]" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mt-8 mb-3 text-center">Report Submitted Successfully!</h2>
          <p className="text-gray-600 text-center">Thank you for your contribution</p>

          {user && (
            <p className="text-gray-600 text-center mt-2">
              Your report has been saved to your account
            </p>
          )}

          <button
            onClick={() => {
              setShowSuccess(false);
              setImagePreview(null);
              setImageFile(null);
              setDescription('');
              setLocation(null);
              setCurrentStep(1);
            }}
            className="mt-10 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Report Another Issue
          </button>

          <button
            onClick={() => {
              router.push('/dashboard');
            }}
            className="mt-4 text-black px-4 py-2 rounded underline hover:text-grey-500 cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    switch (currentStep) {
      case 1: // Photo capture step
        return (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Take a Photo</h2>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                {imagePreview ? (
                  <div className="h-full w-full relative">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-contain p-2"
                      fill
                    />
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
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Take a photo</span> of the issue
                    </p>
                    <p className="text-xs text-gray-500">
                      Tap to open camera
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>
        );

      case 2: // Description step
        return (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Describe the Issue</h2>
            <textarea
              id="description"
              rows={4}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Please describe what you're reporting..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              autoFocus
            ></textarea>
            <button
              type="button"
              onClick={moveToNextStep}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-white font-medium hover:bg-blue-700 mt-6 flex items-center justify-center"
            >
              Next
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        );

      case 3: // Location step (manual detect button)
        return (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Location</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter location or click 'Detect Location'"
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                value={location || ''}
                onChange={(e) => setLocation(e.target.value)}
              />
              <button
                type="button"
                onClick={detectLocation}
                className="whitespace-nowrap rounded-lg bg-slate-600 px-4 py-2.5 text-center text-white font-medium hover:bg-slate-700"
              >
                Detect Location
              </button>
            </div>
            <div
              ref={mapContainerRef}
              className="w-full h-64 mt-4 border rounded"
            ></div>
            <button
              type="button"
              onClick={moveToNextStep}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-white font-medium hover:bg-blue-700 mt-6 flex items-center justify-center"
            >
              Next
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        );

      case 4: // Final review step
        return (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Review and Submit</h2>

            {/* Image preview */}
            <div className="mb-4">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Photo</h3>
                <button
                  onClick={() => editFileInputRef.current?.click()}
                  className="text-blue-500 text-sm"
                  type="button"
                >
                  Change Photo
                </button>
              </div>
              <div className="h-48 w-full relative mt-2">
                <Image
                  src={imagePreview || ''}
                  alt="Preview"
                  className="object-contain"
                  fill
                />
                <input
                  ref={editFileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {/* Description preview/edit */}
            <div className="mb-4">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                {!isEditingDescription && (
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="text-blue-500 text-sm"
                    type="button"
                  >
                    Edit Description
                  </button>
                )}
              </div>
              {isEditingDescription ? (
                <>
                  <textarea
                    rows={4}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    autoFocus
                  ></textarea>
                  <button
                    onClick={() => setIsEditingDescription(false)}
                    className="mt-2 text-blue-500 text-sm"
                    type="button"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <p className="p-2 bg-gray-50 border rounded-lg">{description}</p>
                </>
              )}
            </div>

            {/* Location preview */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
              <p className="p-2 bg-gray-50 border rounded-lg">{location || "Not detected"}</p>
            </div>

            {/* Map */}
            <div
              ref={mapContainerRef}
              className="w-full h-64 mt-4 border rounded"
            ></div>

            {/* Submit button */}
            <button
              type="submit"
              onClick={submitReport}
              disabled={isSubmitting || isEditingDescription}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-white font-medium hover:bg-blue-700 disabled:bg-blue-400 mt-6"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Report</h1>

      {!user && !loading && (
        <div className="p-4 mb-6 bg-yellow-100 text-yellow-800 rounded">
          Please{" "}
          <a className="underline" href="/login">
            log in
          </a>{" "}
          to access all features.
        </div>
      )}

      <div className="p-6 border rounded-lg shadow-sm">
        {/* Step indicator */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex flex-col items-center ${currentStep >= step ? 'text-blue-600' : 'text-gray-300'}`}
            >
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${currentStep >= step ? 'border-blue-600 bg-blue-100' : 'border-gray-300'}`}>
                {step}
              </div>
              <span className="text-xs mt-1 hidden md:block">
                {step === 1 ? "Photo" : step === 2 ? "Description" : step === 3 ? "Location" : "Submit"}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <form onSubmit={(e) => e.preventDefault()}>
          {renderStepContent()}
        </form>
      </div>
    </div>
  );
}
