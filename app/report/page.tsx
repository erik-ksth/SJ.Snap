"use client";

import { useSupabaseAuth } from "@/lib/context/supabase-auth-context";
import { useState, useEffect, useRef } from "react";
import { PhotoIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";
import mapboxgl from "mapbox-gl";
import Image from "next/image";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYXVuZ2JvYm8wNCIsImEiOiJjbTl5cTZzajcxbGlvMmpwdmV0a2E2MDVzIn0.HRwDajB6LBfUF1EIYlMaXg"; // Replace with your Mapbox token
// /import { useRouter } from 'next/navigation';
// import { uploadFile, getPublicUrl, createReport } from '@/lib/supabase/supabase';

export default function ReportPage() {
  const { user, loading } = useSupabaseAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Move to next step after image is captured
        setCurrentStep(2);
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
    if (currentStep === 2 && !description.trim()) {
      alert("Please enter a description");
      return;
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

    // if (!user) {
    //   alert('Please log in to submit a report');
    //   return;
    // }

    if (!imageFile || !imagePreview) {
      alert('Please upload an image');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData object
      const formData = new FormData();
      formData.append("description", description);
      if (location) {
        formData.append("location", location);
      } else {
        formData.append("location", "");
      }
      formData.append("image", imageFile);

      // Send the request
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
      } else {
        // Show success screen
        setShowSuccess(true);

        // Reset form after 3 seconds
        setTimeout(() => {
          setImagePreview(null);
          setImageFile(null);
          setDescription('');
          setLocation(null);
          setCurrentStep(1);
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('There was an error submitting your report. Please try again.');
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

      case 3: // Location step (auto-detect)
        return (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Detecting Location...</h2>
            <div className="flex items-center justify-center my-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <div
              ref={mapContainerRef}
              className="w-full h-64 mt-4 border rounded"
            ></div>
          </div>
        );

      case 4: // Final review step
        return (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Review and Submit</h2>

            {/* Image preview */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Photo</h3>
              <div className="h-48 w-full relative">
                <Image
                  src={imagePreview || ''}
                  alt="Preview"
                  className="object-contain"
                  fill
                />
              </div>
            </div>

            {/* Description preview */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="p-2 bg-gray-50 border rounded-lg">{description}</p>
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
              disabled={isSubmitting}
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
