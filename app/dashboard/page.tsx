"use client";

import { useSupabaseAuth } from "@/lib/context/supabase-auth-context";
import { useState, useEffect, useCallback } from "react";
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
     is_public: boolean;
     created_at: string;
}

interface PaginationData {
     total: number;
     page: number;
     limit: number;
     pages: number;
}

type VisibilityFilter = 'all' | 'public' | 'private';

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
     const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
     const [selectedReport, setSelectedReport] = useState<Report | null>(null);
     const [dialogOpen, setDialogOpen] = useState(false);

     const fetchReports = useCallback(async (page = 1, limit = 10, userId?: string) => {
          setIsLoading(true);
          setError(null);
          try {
               let url = `/api/dashboard?page=${page}&limit=${limit}`;
               if (userId) {
                    url += `&userId=${userId}`;
               }
               if (visibilityFilter === 'private') {
                    url += `&showPrivate=true`;
               } else if (visibilityFilter === 'public') {
                    url += `&showPublic=true`;
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
     }, [visibilityFilter]);

     useEffect(() => {
          // Initial fetch of reports
          if (!loading) {
               if (viewMode === "mine" && user) {
                    fetchReports(1, 10, user.id);
               } else {
                    fetchReports(1, 10);
               }
          }
     }, [loading, user, viewMode, fetchReports]);

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

     const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          setVisibilityFilter(e.target.value as VisibilityFilter);
     };

     const openReportDetail = (report: Report) => {
          setSelectedReport(report);
          setDialogOpen(true);
     };

     return (
          <div className="container mx-auto px-4 py-8 max-w-6xl">
               <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 space-y-4 md:space-y-0">
                    <h1 className="text-2xl font-bold">Dashboard</h1>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                         {user && (
                              <>
                                   <button
                                        onClick={toggleViewMode}
                                        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                                   >
                                        {viewMode === "all" ? "Show My Reports" : "Show All Reports"}
                                   </button>
                                   {viewMode === "mine" && (
                                        <select
                                             value={visibilityFilter}
                                             onChange={handleVisibilityChange}
                                             className="w-full sm:w-auto px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                             <option value="all">All Reports</option>
                                             <option value="public">Public Only</option>
                                             <option value="private">Private Only</option>
                                        </select>
                                   )}
                              </>
                         )}
                    </div>
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
                                                  <div className="mt-3 flex items-center space-x-2">
                                                       <span className="text-xs text-blue-600">Your Report</span>
                                                       {!report.is_public && (
                                                            <span className="text-xs text-gray-500">(Private)</span>
                                                       )}
                                                  </div>
                                             )}
                                        </div>
                                   </div>
                              ))}
                         </div>

                         {/* Pagination */}
                         <div className="mt-8 flex justify-center">
                              <nav className="flex items-center space-x-2">
                                   <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                                   >
                                        Previous
                                   </button>
                                   <span className="text-sm text-gray-600">
                                        Page {pagination.page} of {pagination.pages}
                                   </span>
                                   <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.pages}
                                        className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                                   >
                                        Next
                                   </button>
                              </nav>
                         </div>
                    </>
               )}

               {/* Report Detail Dialog */}
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
                                             <div className="mt-2 flex items-center space-x-2">
                                                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                       Your Report
                                                  </span>
                                                  {!selectedReport.is_public && (
                                                       <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                                            Private
                                                       </span>
                                                  )}
                                             </div>
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

                                   {/* Privacy Toggle for own reports */}
                                   {user && selectedReport.user_id === user.id && (
                                        <div className="mt-6">
                                             <div className="flex items-center space-x-2">
                                                  <input
                                                       type="checkbox"
                                                       id="togglePrivacy"
                                                       checked={selectedReport.is_public}
                                                       onChange={async (e) => {
                                                            const newIsPublic = e.target.checked;
                                                            try {
                                                                 // Optimistically update the UI
                                                                 setSelectedReport({
                                                                      ...selectedReport,
                                                                      is_public: newIsPublic,
                                                                 });
                                                                 setReports(reports.map(r =>
                                                                      r.id === selectedReport.id
                                                                           ? { ...r, is_public: newIsPublic }
                                                                           : r
                                                                 ));

                                                                 const response = await fetch(`/api/reports/${selectedReport.id}`, {
                                                                      method: 'PATCH',
                                                                      headers: {
                                                                           'Content-Type': 'application/json',
                                                                      },
                                                                      body: JSON.stringify({
                                                                           is_public: newIsPublic,
                                                                      }),
                                                                 });

                                                                 if (!response.ok) {
                                                                      // Revert the optimistic update if the request fails
                                                                      setSelectedReport({
                                                                           ...selectedReport,
                                                                           is_public: !newIsPublic,
                                                                      });
                                                                      setReports(reports.map(r =>
                                                                           r.id === selectedReport.id
                                                                                ? { ...r, is_public: !newIsPublic }
                                                                                : r
                                                                      ));
                                                                      throw new Error('Failed to update privacy setting');
                                                                 }
                                                            } catch (error) {
                                                                 console.error('Error updating privacy:', error);
                                                                 alert('Failed to update privacy setting. Please try again.');
                                                            }
                                                       }}
                                                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                  />
                                                  <label htmlFor="togglePrivacy" className="text-sm text-gray-700">
                                                       Make this report public
                                                  </label>
                                             </div>
                                             <p className="text-xs text-gray-500 mt-1">
                                                  Public reports will be visible to everyone on the dashboard. Private reports will only be visible to you.
                                             </p>
                                        </div>
                                   )}
                              </div>
                         </DialogContent>
                    )}
               </Dialog>
          </div>
     );
}
