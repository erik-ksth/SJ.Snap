"use client";

import { useSupabaseAuth } from "@/lib/context/supabase-auth-context";
import { useState, useEffect, useRef } from "react";
import { PhotoIcon, ArrowRightIcon, CheckIcon, MicrophoneIcon } from "@heroicons/react/24/outline";
import { MdOutlineMyLocation } from "react-icons/md";
import mapboxgl from "mapbox-gl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import emailjs from "@emailjs/browser";
import { extractResponseDetails } from "../lib/utils";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export default function ReportPage() {
  const { user, loading } = useSupabaseAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isListening, setIsListening] = useState(false); // New state for speech-to-text
  const [isDetectingLocation, setIsDetectingLocation] = useState(false); // New state for location detection
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reviewFileInputRef = useRef<HTMLInputElement>(null); // Separate ref for review step
  // const editFileInputRef = useRef<HTMLInputElement>(null);

  // Add state for editing in step 4
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isChangingImage, setIsChangingImage] = useState(false); // State to track image changing mode

  // Add new state for tracking the current step
  const [currentStep, setCurrentStep] = useState(1);
  // Add state for success confirmation
  const [showSuccess, setShowSuccess] = useState(false);

  // Add state for error count
  const [errorCount, setErrorCount] = useState(0);

  // Add state for privacy toggle
  const [isPublic, setIsPublic] = useState(false);

  // Add type for speech recognition
  interface SpeechRecognitionEvent extends Event {
    results: {
      [key: number]: {
        [key: number]: {
          transcript: string;
        };
      };
    };
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onstart: (event: Event) => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: (event: Event) => void;
    start: () => void;
  }

  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }

  useEffect(() => {
    // Automatically open camera on mobile when the page loads
    if (currentStep === 1 && fileInputRef.current && isMobile()) {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 500);
    }
  }, [currentStep]);

  // Enhanced mobile detection
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || (window.innerWidth <= 768);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Please select an image under 5MB.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // Move to next step after image is captured if not already in step 4
        if (currentStep === 1) {
          setCurrentStep(2);
        }
        // Reset image changing flag if we're in review mode
        if (currentStep === 4) {
          setIsChangingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        // `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=37.321626&lon=-121.907250`
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
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
      setIsDetectingLocation(true); // Set loading state to true
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
            // First center map on the location
            map.flyTo({ center: [lng, lat], zoom: 14 });

            // Clear existing marker if any
            if (marker) {
              marker.remove();
            }

            // Create a new marker
            const newMarker = new mapboxgl.Marker()
              .setLngLat([lng, lat])
              .addTo(map);

            // Update marker state
            setMarker(newMarker);
          }
          setIsDetectingLocation(false); // Set loading state to false when done
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to retrieve your location");
          setIsDetectingLocation(false); // Set loading state to false on error
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

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
  };

  // New function for speech-to-text
  const handleSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }

    const recognition = new (window as Window).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;


    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const speechResult = event.results[0][0].transcript;
      setDescription((prev) => `${prev} ${speechResult}`.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setErrorCount((prev) => {
        const newErrorCount = prev + 1;
        // console.log("Error count:", newErrorCount);

        if (event.error === "not-allowed") {
          alert("Microphone access is required for speech recognition. Please allow microphone access.");
        } else if (event.error === "network") {
          alert("Network error: Unable to connect to the speech recognition service. Please check your internet connection.");
        } else {
          alert("An error occurred during speech recognition. Please try again.");
        }

        if (newErrorCount >= 3) {
          alert("Speech to text feature is best compatible with Google Chrome!");
          console.log("Speech recognition error count exceeded");
        }

        return newErrorCount;
      });
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
    };

    console.log("Starting speech recognition...");
    recognition.start();
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
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

    // Validate email if provided for non-logged in users
    if (!user && userEmail.trim() && !validateEmail(userEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    } else {
      setEmailError('');
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

      if (responseData.response === "DescriptionMismatch") {
        alert("The description doesn't match with the image. Please try again with a more accurate description that matches what's visible in the photo.");
        // Return to review step instead of clearing values
        setCurrentStep(4);
      } else if (responseData.response === "NotCityIssue") {
        alert("This image appears to show a private property issue or something unrelated to city cleanliness. Please only report public issues that city services can address.");
        // Return to review step
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
            // Only include userId and isPublic if user is logged in
            ...(user && {
              userId: user.id,
              isPublic: isPublic
            })
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

        // Determine which email to use for BCC
        const bccEmail = user ? user.email : userEmail;

        // Send email using EmailJS with Supabase image URL
        const result = await emailjs.send(
          "service_hmaw4rq", // Service ID from EmailJS
          "template_ndxs4e9", // Template ID from EmailJS
          {
            from_name: "SJ Snap",
            from_email: "sjsnapteam@gmail.com",
            email: "cityofsanjose.dev@gmail.com",
            description: enhancedDescription,
            location: enhancedLocation,
            imageUrl: uploadData.publicUrl, // Use the Supabase public URL instead
            latitude: marker?.getLngLat().lat,
            longitude: marker?.getLngLat().lng,
            bcc: `${bccEmail}`,
          },
          "uPpsd3jHxxeBnS0fP" // Public API Key (safe) from EmailJS
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
    if ((currentStep === 3 || currentStep === 4) && mapContainerRef.current) {
      console.log("Initializing map, step:", currentStep);

      // Create a new map instance
      const mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-121.87578145532126, 37.334973065378634], // Default center (SJSU)
        zoom: 12,
      });

      // Store map in state
      setMap(mapInstance);

      // Wait for the map to load once
      let mapLoaded = false;
      mapInstance.on('load', () => {
        // Prevent duplicate load events
        if (mapLoaded) return;
        mapLoaded = true;

        console.log("Map loaded successfully");

        // If we have location coordinates stored from previous marker
        if (marker) {
          const position = marker.getLngLat();

          // Create a new marker at the same position
          const newMarker = new mapboxgl.Marker()
            .setLngLat(position)
            .addTo(mapInstance);

          setMarker(newMarker);

          // Center the map on the marker position
          mapInstance.flyTo({
            center: position,
            zoom: 14
          });
        }
      });

      // Cleanup function
      return () => {
        console.log("Cleaning up map instance");
        mapInstance.remove();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            type="button"
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
            type="button"
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
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
                    <p className="text-xs text-gray-500 md:block hidden">
                      Click to upload a photo
                    </p>
                    <p className="text-xs text-gray-500 block md:hidden">
                      Tap to open camera or upload a photo
                    </p>

                    {/* Only show these buttons on mobile */}
                    <div className="flex mt-4 space-x-3 md:hidden">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (fileInputRef.current) {
                            fileInputRef.current.setAttribute('capture', 'environment');
                            fileInputRef.current.click();
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg"
                      >
                        Camera
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (fileInputRef.current) {
                            fileInputRef.current.removeAttribute('capture');
                            fileInputRef.current.click();
                          }
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg"
                      >
                        Gallery
                      </button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
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

            {/* Textarea */}
            <div className="relative">
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

              {errorCount >= 2 && (
                <div className="mt-2 text-yellow-600 text-sm">
                  Having trouble with speech recognition? Try using Google Chrome.
                </div>
              )}

              {/* Circular Speech Button */}
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={handleSpeechToText}
                  disabled={isListening}
                  className={`flex items-center justify-center rounded-full w-14 h-14 border-none ${isListening ? "bg-green-400 animate-pulse" : "bg-green-600 hover:bg-green-700"
                    } text-white focus:outline-none`}
                >
                  <MicrophoneIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={moveToNextStep}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-white font-medium hover:bg-blue-700 mt-8 flex items-center justify-center"
            >
              Next
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        );

      case 3: // Location step (simplified detect button)
        return (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Location</h2>

            {/* Detect Location Button */}
            <button
              type="button"
              onClick={detectLocation}
              disabled={isSubmitting || isDetectingLocation}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-center text-white font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              {isDetectingLocation ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Detecting your location...</span>
                </>
              ) : (
                <>
                  <MdOutlineMyLocation className="h-5 w-5" />
                  {location ? "Update Location" : "Detect My Location"}
                </>
              )}
            </button>

            {/* Display Location When Available */}
            {location && (
              <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
                <p className="text-gray-700">{location}</p>
              </div>
            )}

            {/* Map Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-64 mt-4 border rounded-lg"
            ></div>

            {/* Next Button */}
            <button
              type="button"
              onClick={() => {
                if (location) {
                  moveToNextStep();
                } else {
                  alert("Please detect your location first");
                }
              }}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-white font-medium hover:bg-blue-700 mt-6 flex items-center justify-center"
            >
              Next
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        );

      case 4: // Final review step
        return (
          <div className="space-y-6">
            {/* Image preview */}
            {imagePreview && (
              <div className="relative h-64 w-full">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to change the image?")) {
                      setIsChangingImage(true);
                      if (reviewFileInputRef.current) {
                        reviewFileInputRef.current.click();
                      }
                    }
                  }}
                  className="absolute bottom-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Change Image
                </button>
                {isChangingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white">Selecting new image...</div>
                  </div>
                )}
              </div>
            )}

            {/* Hidden file input for review step */}
            <input
              ref={reviewFileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />

            {/* Description preview */}
            <div className="mb-4">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                {!isEditingDescription && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDescription(true)}
                    className="text-blue-500 text-sm"
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
                    type="button"
                    onClick={() => setIsEditingDescription(false)}
                    className="mt-2 text-blue-500 text-sm"
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
            {location && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
                <p className="p-2 bg-gray-50 border rounded-lg">{location}</p>
              </div>
            )}

            {/* Optional Email for non-logged-in users */}
            {!user && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Email (Optional)</h3>
                <p className="text-xs text-gray-500 mb-1">Receive a copy of your report</p>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className={`block w-full rounded-lg border ${emailError ? 'border-red-500' : 'border-gray-300'} bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500`}
                  placeholder="your@email.com"
                />
                {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
              </div>
            )}

            {/* Privacy toggle for logged-in users */}
            {user && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Privacy</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make this report public
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Public reports will be visible to everyone on the dashboard. Private reports will only be visible to you.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
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
        <form onSubmit={submitReport}>
          {renderStepContent()}
        </form>
      </div>
    </div>
  );
}