"use client";

import { useSupabaseAuth } from "@/lib/context/supabase-auth-context";
import { useState, useEffect, useRef } from "react";
import { MapPinIcon, PhotoIcon } from "@heroicons/react/24/outline";
import mapboxgl from "mapbox-gl";

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

      if (responseData.response == "Negative") {
        alert("The description doesn't match with the image. Please provide an accurate description of the issue.");
      }

      // Reset form
      setImagePreview(null);
      setImageFile(null);
      setDescription('');
      setLocation(null);

    } catch (error) {
      console.error('Error submitting report:', error);
      alert('There was an error submitting your report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-121.87578145532126, 37.334973065378634], // Default center (SJSU)
      zoom: 12,
    });

    //     mapInstance.addControl(
    //       new mapboxgl.GeolocateControl({
    //         positionOptions: {
    //           enableHighAccuracy: true,
    //         },
    //         // When active the map will receive updates to the device's location as it changes.
    //         trackUserLocation: true,
    //         // Draw an arrow next to the location dot to indicate which direction the device is heading.
    //         showUserHeading: true,
    //       })
    //     );

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, []);

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
        <h2 className="text-lg font-semibold mb-4">Submit a Report</h2>

        <form onSubmit={submitReport}>
          {/* Image Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                {imagePreview ? (
                  <div className="h-full w-full relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-contain p-2"
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
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG or JPEG (MAX. 10MB)
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>

          {/* Description Input */}
          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                className="block flex-1 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Coordinates or address"
                value={location || ""}
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

          {/* Mapbox Map */}
          <div
            ref={mapContainerRef}
            className="w-full h-96 mt-4 border rounded"
          ></div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !user}
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-white font-medium hover:bg-blue-700 disabled:bg-blue-400 mt-6"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
