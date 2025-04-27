"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AboutPage() {
     const router = useRouter();

     return (
          <div className="container mx-auto px-4 py-8 max-w-4xl">
               <h1 className="text-3xl font-bold mb-8 text-center">About SJ Snap</h1>

               <div className="flex flex-col md:flex-row items-center justify-center mb-12">
                    <div className="md:w-1/2 flex justify-center mb-6 md:mb-0">
                         <Image
                              src="/logo_nobg.png"
                              alt="SJ Snap Logo"
                              width={200}
                              height={200}
                              priority
                              className="rounded-lg"
                         />
                    </div>
                    <div className="md:w-1/2 md:pl-8">
                         <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                         <p className="text-gray-700 mb-4">
                              SJ Snap empowers San Jose residents to report city issues quickly and easily. Our platform enables citizens to take an active role in maintaining and improving their community.
                         </p>
                         <p className="text-gray-700">
                              By connecting residents directly with city services, we streamline the reporting process and help ensure that problems are addressed efficiently.
                         </p>
                    </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="border rounded-lg p-6 shadow-sm">
                         <h3 className="text-xl font-semibold mb-3">Simple Reporting</h3>
                         <p className="text-gray-700">
                              Snap a photo, add a description, and share your location to report issues in just a few taps. No complicated forms or lengthy processes.
                         </p>
                    </div>

                    <div className="border rounded-lg p-6 shadow-sm">
                         <h3 className="text-xl font-semibold mb-3">Location Tracking</h3>
                         <p className="text-gray-700">
                              Accurately map and track issues with our integrated location services. Help city workers find and fix problems faster.
                         </p>
                    </div>

                    <div className="border rounded-lg p-6 shadow-sm">
                         <h3 className="text-xl font-semibold mb-3">Issue Dashboard</h3>
                         <p className="text-gray-700">
                              Track the progress of your reports and see what others in your community have reported through our comprehensive dashboard.
                         </p>
                    </div>
               </div>

               <div className="bg-gray-50 rounded-lg p-8 mb-12">
                    <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                         <div className="flex flex-col items-center text-center">
                              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                   <span className="text-blue-600 text-2xl font-bold">1</span>
                              </div>
                              <h3 className="font-medium mb-2">Take a Photo</h3>
                              <p className="text-sm text-gray-600">Capture the issue with your device camera</p>
                         </div>

                         <div className="flex flex-col items-center text-center">
                              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                   <span className="text-blue-600 text-2xl font-bold">2</span>
                              </div>
                              <h3 className="font-medium mb-2">Describe the Issue</h3>
                              <p className="text-sm text-gray-600">Add details about what you&apos;re reporting</p>
                         </div>

                         <div className="flex flex-col items-center text-center">
                              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                   <span className="text-blue-600 text-2xl font-bold">3</span>
                              </div>
                              <h3 className="font-medium mb-2">Add Location</h3>
                              <p className="text-sm text-gray-600">Share where the issue is located</p>
                         </div>

                         <div className="flex flex-col items-center text-center">
                              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                   <span className="text-blue-600 text-2xl font-bold">4</span>
                              </div>
                              <h3 className="font-medium mb-2">Submit</h3>
                              <p className="text-sm text-gray-600">Send your report to city services</p>
                         </div>
                    </div>
               </div>

               <div className="text-center mb-12">
                    <h2 className="text-2xl font-semibold mb-6">Get Started Today</h2>
                    <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
                         Join your fellow San Jose residents in making our city better. Start reporting issues and see the difference you can make in your community.
                    </p>
                    <button
                         onClick={() => router.push('/report')}
                         className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                         Report an Issue
                    </button>
               </div>

               <div className="border-t pt-8">
                    <h2 className="text-2xl font-semibold mb-6 text-center">Contact Us</h2>
                    <p className="text-center text-gray-700 mb-4">
                         Have questions or suggestions? We&apos;d love to hear from you!
                    </p>
                    <div className="text-center">
                         <button
                              onClick={() => router.push('/contact')}
                              className="text-blue-600 underline hover:text-blue-800"
                         >
                              Contact our team
                         </button>
                    </div>
               </div>
          </div>
     );
} 