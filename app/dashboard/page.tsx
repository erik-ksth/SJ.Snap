"use client";

import { useSupabaseAuth } from "@/lib/context/supabase-auth-context";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
     Dialog,
     DialogContent,
     DialogHeader,
     DialogTitle,
} from "@/components/ui/dialog";

interface Report {
     id: string;
     user_id: string | null;
     description: string;
     location: string | null;
     image_url: string | null;
     created_at: string;
}

interface PaginationData {
     total: number;
     page: number;
     limit: number;
     pages: number;
}

export default function Dashboard() {
     const { user, loading } = useSupabaseAuth();
     const [reports, setReports] = useState<Report[]>([]);
     const [pagination, setPagination] = useState<PaginationData>({
          total: 0,
          page: 1,
          limit: 10,
          pages: 0,
     });
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const [viewMode, setViewMode] = useState<"all" | "mine">("all");
     const [selectedReport, setSelectedReport] = useState<Report | null>(null);
     const [dialogOpen, setDialogOpen] = useState(false);

     const fetchReports = async (page = 1, limit = 10, userId?: string) => {
          setIsLoading(true);
          setError(null);
          try {
               let url = `/api/dashboard?page=${page}&limit=${limit}`;
               if (userId) {
                    url += `&userId=${userId}`;
               }

               const response = await fetch(url);
               if (!response.ok) {
                    throw new Error("Failed to fetch reports");
               }

               const data = await response.json();
               setReports(data.reports);
               setPagination(data.pagination);
          } catch (err) {
               console.error("Error fetching reports:", err);
               setError("Failed to load reports. Please try again later.");
          } finally {
               setIsLoading(false);
          }
     };

     useEffect(() => {
          // Initial fetch of reports
          if (!loading) {
               if (viewMode === "mine" && user) {
                    fetchReports(1, 10, user.id);
               } else {
                    fetchReports(1, 10);
               }
          }
     }, [loading, user, viewMode]);

     const handlePageChange = (newPage: number) => {
          if (viewMode === "mine" && user) {
               fetchReports(newPage, pagination.limit, user.id);
          } else {
               fetchReports(newPage, pagination.limit);
          }
     };

     const toggleViewMode = () => {
          setViewMode(viewMode === "all" ? "mine" : "all");
     };

     const openReportDetail = (report: Report) => {
          setSelectedReport(report);
          setDialogOpen(true);
     };

     return (
          <div className="container mx-auto px-4 py-8 max-w-6xl">
               <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Dashboard</h1>

                    {user && (
                         <button
                              onClick={toggleViewMode}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                         >
                              {viewMode === "all" ? "Show My Reports" : "Show All Reports"}
                         </button>
                    )}
               </div>

               {!user && !loading && (
                    <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-6">
                         <p>
                              Please{" "}
                              <Link href="/login" className="underline font-medium">
                                   log in
                              </Link>{" "}
                              to see your reports.
                         </p>
                    </div>
               )}

               {isLoading ? (
                    <div className="flex justify-center py-10">
                         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
               ) : error ? (
                    <div className="bg-red-100 text-red-800 p-4 rounded mb-6">
                         <p>{error}</p>
                    </div>
               ) : reports.length === 0 ? (
                    <div className="text-center py-10">
                         <p className="text-gray-500 mb-4">No reports found</p>
                         <Link href="/report" className="text-blue-500 hover:underline">
                              Create your first report
                         </Link>
                    </div>
               ) : (
                    <>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {reports.map((report) => (
                                   <div
                                        key={report.id}
                                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => openReportDetail(report)}
                                   >
                                        {report.image_url && (
                                             <div className="relative h-48 w-full">
                                                  <Image
                                                       src={report.image_url}
                                                       alt={report.description}
                                                       fill
                                                       className="object-cover"
                                                  />
                                             </div>
                                        )}
                                        <div className="p-4">
                                             <p className="text-sm text-gray-500 mb-2">
                                                  {format(new Date(report.created_at), "MMM d, yyyy")}
                                             </p>
                                             <p className="font-medium mb-2 line-clamp-2">{report.description}</p>
                                             {report.location && (
                                                  <p className="text-sm text-gray-600 line-clamp-1">
                                                       📍 {report.location}
                                                  </p>
                                             )}
                                             {user && report.user_id === user.id && (
                                                  <div className="mt-3 text-xs text-blue-600">Your Report</div>
                                             )}
                                        </div>
                                   </div>
                              ))}
                         </div>

                         {/* Pagination */}
                         {pagination.pages > 1 && (
                              <div className="flex justify-center mt-8">
                                   <nav className="inline-flex">
                                        <button
                                             onClick={() => handlePageChange(pagination.page - 1)}
                                             disabled={pagination.page === 1}
                                             className="px-3 py-1 rounded-l border border-gray-300 bg-white text-gray-500 disabled:opacity-50"
                                        >
                                             Previous
                                        </button>
                                        {Array.from({ length: pagination.pages }).map((_, index) => (
                                             <button
                                                  key={index}
                                                  onClick={() => handlePageChange(index + 1)}
                                                  className={`px-3 py-1 border-t border-b border-gray-300 ${pagination.page === index + 1
                                                       ? "bg-blue-500 text-white"
                                                       : "bg-white text-gray-700"
                                                       }`}
                                             >
                                                  {index + 1}
                                             </button>
                                        ))}
                                        <button
                                             onClick={() => handlePageChange(pagination.page + 1)}
                                             disabled={pagination.page === pagination.pages}
                                             className="px-3 py-1 rounded-r border border-gray-300 bg-white text-gray-500 disabled:opacity-50"
                                        >
                                             Next
                                        </button>
                                   </nav>
                              </div>
                         )}
                    </>
               )}

               {/* Shadcn Dialog for report details */}
               <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    {selectedReport && (
                         <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh] overflow-y-auto" style={{ scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent' }}>
                              <DialogHeader>
                                   <DialogTitle>Report Details</DialogTitle>
                              </DialogHeader>

                              <div className="py-4">
                                   {/* Image */}
                                   {selectedReport.image_url && (
                                        <div className="relative h-96 w-full mb-6">
                                             <Image
                                                  src={selectedReport.image_url}
                                                  alt={selectedReport.description}
                                                  fill
                                                  className="object-contain"
                                             />
                                        </div>
                                   )}

                                   {/* Date */}
                                   <div className="mb-4">
                                        <p className="text-gray-500">
                                             Reported on {format(new Date(selectedReport.created_at), "MMMM d, yyyy 'at' h:mm a")}
                                        </p>
                                        {user && selectedReport.user_id === user.id && (
                                             <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                  Your Report
                                             </span>
                                        )}
                                   </div>

                                   {/* Description */}
                                   <div className="mb-4">
                                        <h3 className="text-lg font-medium mb-2">Description</h3>
                                        <p className="text-gray-700 whitespace-pre-line">{selectedReport.description}</p>
                                   </div>

                                   {/* Location */}
                                   {selectedReport.location && (
                                        <div className="mb-4">
                                             <h3 className="text-lg font-medium mb-2">Location</h3>
                                             <p className="text-gray-700">{selectedReport.location}</p>
                                        </div>
                                   )}
                              </div>
                         </DialogContent>
                    )}
               </Dialog>
          </div>
     );
}
