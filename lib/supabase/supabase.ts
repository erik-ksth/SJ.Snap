"use client";

import { createClient } from "@supabase/supabase-js";
import { type Provider } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create a Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Authentication functions
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google" as Provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// Database functions
export async function createReport(reportData: {
  description: string;
  location?: string | null;
  image_url?: string | null;
  status?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("User must be logged in to create a report");

  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      description: reportData.description,
      location: reportData.location || null,
      image_url: reportData.image_url || null,
      status: reportData.status || "pending",
    })
    .select();

  if (error) throw error;
  return data;
}

export async function getUserReports() {
  const user = await getCurrentUser();
  if (!user) throw new Error("User must be logged in to view reports");

  const { data, error } = await supabase
    .from("reports")
    .select()
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Function to upload a file to Supabase Storage
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob | ArrayBuffer | string,
  fileOptions?: {
    contentType?: string;
    upsert?: boolean;
  }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, fileOptions);

  if (error) {
    throw error;
  }

  return data;
}

// Function to get a public URL for a file
export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Function to delete a file
export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw error;
  }

  return true;
}
