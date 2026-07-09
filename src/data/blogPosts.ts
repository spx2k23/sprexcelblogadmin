

import { supabase } from "../integrations/supabase/client";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;       // derived from published_at
  readTime: string;
  image: string;
  featured: boolean;
  tags: string[];
  published: boolean;
}

const mapRow = (row: any): BlogPost => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  content: row.content,
  category: row.category,
  author: row.author,
  date: new Date(row.published_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  }),
  readTime: row.read_time ?? "",
  image: row.image ?? "",
  featured: row.featured,
  tags: row.tags ?? [],
  published: row.published,
});

export const categories = ["All", "Growth", "Technology", "Fundraising", "Culture", "Product"];

export async function getAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getFeaturedPost(): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function getRecentPosts(limit: number = 4): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .eq("featured", false)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  let query = supabase.from("blog_posts").select("*").eq("published", true);
  if (category !== "All") query = query.eq("category", category);
  const { data, error } = await query.order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

// ----- Admin functions -----

export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export interface BlogPostInput {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  read_time: string;
  image: string;
  featured: boolean;
  tags: string[];
  published: boolean;
}

export async function createPost(input: BlogPostInput) {
  const { data, error } = await supabase.from("blog_posts").insert(input).select().single();
  if (error) throw error;
  return mapRow(data);
}

export async function updatePost(id: string, input: Partial<BlogPostInput>) {
  const { data, error } = await supabase
    .from("blog_posts")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadBlogImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteBlogImage(url: string) {
  // Extract file path from public URL
  const path = url.split("/blog-images/")[1];
  if (!path) return;
  await supabase.storage.from("blog-images").remove([path]);
}