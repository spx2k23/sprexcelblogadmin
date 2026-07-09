import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../components/ui/dialog";
import { toast } from "../hooks/use-toast";
import {
  Pencil, Trash2, Plus, Loader2, LogOut, Newspaper, ImageOff,
  Search, Star, FileText, LayoutGrid, Sparkles, Eye, EyeOff,
  Calendar, User, Clock, Tag, Image as ImageIcon, X,
  AlertCircle, CheckCircle2, Info, Globe, Hash,
} from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import {
  categories,
  getAllPostsAdmin, createPost, updatePost, deletePost,
  uploadBlogImage, deleteBlogImage,
} from "../data/blogPosts";
import type { BlogPost, BlogPostInput } from "../data/blogPosts";

const emptyForm: BlogPostInput = {
  slug: "", title: "", excerpt: "", content: "",
  category: "Growth", author: "", read_time: "",
  image: "", featured: false, tags: [], published: true,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const categoryColor: Record<string, string> = {
  Growth: "bg-emerald-500",
  Technology: "bg-indigo-500",
  Fundraising: "bg-amber-500",
  Culture: "bg-rose-500",
  Product: "bg-sky-500",
};
const dotFor = (c: string) => categoryColor[c] ?? "bg-zinc-400";

const CategoryBadge = ({ category }: { category: string }) => {
  const icons: Record<string, any> = {
    Growth: "📈",
    Technology: "💻",
    Fundraising: "💰",
    Culture: "🎨",
    Product: "🚀",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${categoryColor[category]?.replace('bg-', 'bg-opacity-10 text-')}`}>
      <span>{icons[category] || "📄"}</span>
      {category}
    </span>
  );
};

// Character counter component
const CharacterCounter = ({ current, max }: { current: number; max: number }) => {
  const percentage = (current / max) * 100;
  let color = "text-zinc-400";
  if (percentage > 90) color = "text-red-500";
  else if (percentage > 70) color = "text-amber-500";
  else if (percentage > 0) color = "text-emerald-500";
  
  return (
    <span className={`text-xs font-medium ${color} transition-colors`}>
      {current}/{max}
    </span>
  );
};

// Slug preview component
const SlugPreview = ({ slug }: { slug: string }) => {
  if (!slug) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200/50">
      <Globe className="h-3 w-3" />
      <span className="font-mono">yourdomain.com/blog/{slug}</span>
    </div>
  );
};

const BlogAdmin = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogPostInput>(emptyForm);
  const [tagsInput, setTagsInput] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const loadPosts = async () => {
    setLoading(true);
    try {
      setPosts(await getAllPostsAdmin());
    } catch (err: any) {
      toast({ title: "Failed to load posts", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
    );
  }, [posts, query]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTagsInput("");
    setSlugTouched(false);
    setImagePreview(null);
    setValidationErrors({});
    setOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      slug: post.slug, title: post.title, excerpt: post.excerpt, content: post.content,
      category: post.category, author: post.author, read_time: post.readTime,
      image: post.image, featured: post.featured, tags: post.tags, published: post.published,
    });
    setTagsInput(post.tags.join(", "));
    setSlugTouched(true);
    setImagePreview(post.image || null);
    setValidationErrors({});
    setOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugify(title),
    }));
    // Clear validation error for title
    if (validationErrors.title) {
      setValidationErrors(prev => ({ ...prev, title: '' }));
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const oldImage = form.image;
      const url = await uploadBlogImage(file);
      setForm((f) => ({ ...f, image: url }));
      setImagePreview(url);
      if (oldImage && oldImage.includes("/blog-images/")) {
        await deleteBlogImage(oldImage).catch(() => {});
      }
      toast({ title: "Image uploaded successfully", description: "Your cover image is ready" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleImageRemove = () => {
    setForm((f) => ({ ...f, image: "" }));
    setImagePreview(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!form.title.trim()) errors.title = "Title is required";
    else if (form.title.length < 3) errors.title = "Title must be at least 3 characters";
    else if (form.title.length > 100) errors.title = "Title must be less than 100 characters";
    
    if (!form.slug.trim()) errors.slug = "Slug is required";
    else if (!/^[a-z0-9-]+$/.test(form.slug)) errors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    
    if (!form.excerpt.trim()) errors.excerpt = "Excerpt is required";
    else if (form.excerpt.length < 20) errors.excerpt = "Excerpt must be at least 20 characters";
    else if (form.excerpt.length > 200) errors.excerpt = "Excerpt must be less than 200 characters";
    
    if (!form.content.trim()) errors.content = "Content is required";
    else if (form.content.length < 50) errors.content = "Content must be at least 50 characters";
    
    if (!form.author.trim()) errors.author = "Author is required";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({ 
        title: "Validation Error", 
        description: "Please fix the highlighted fields before saving.",
        variant: "destructive" 
      });
      return;
    }

    setSaving(true);
    const payload: BlogPostInput = {
      ...form,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        await updatePost(editingId, payload);
        toast({ title: "Post updated successfully", description: "Your changes have been saved" });
      } else {
        await createPost(payload);
        toast({ title: "Post created successfully", description: "Your new article is ready" });
      }
      setOpen(false);
      await loadPosts();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await deletePost(post.id);
      if (post.image?.includes("/blog-images/")) {
        await deleteBlogImage(post.image).catch(() => {});
      }
      toast({ title: "Post deleted", description: "The article has been removed" });
      await loadPosts();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 flex">
      {/* Rail */}
      <aside className="w-16 shrink-0 border-r border-zinc-200/50 bg-white/80 backdrop-blur-sm flex flex-col items-center py-5 gap-6">
        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1" />
        <div className="flex flex-col items-center gap-2">
          <div className="h-px w-8 bg-zinc-200/50" />
          <button
            onClick={handleLogout}
            className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all duration-200 group shadow-sm hover:shadow-md"
            title="Log out"
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-[10px] text-zinc-400 font-medium tracking-wider">Logout</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/50">
          <div className="px-8 py-5 flex items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                Blog Posts
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {loading ? "Loading…" : `${posts.length} article${posts.length !== 1 ? "s" : ""} in your collection`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search posts…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 h-10 w-64 bg-white/50 border-zinc-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 transition-all duration-200 rounded-xl"
                />
              </div>
              <Button 
                onClick={openCreate} 
                className="bg-gradient-to-r from-zinc-900 to-zinc-700 hover:from-zinc-800 hover:to-zinc-600 text-white h-10 px-5 rounded-xl shadow-lg shadow-zinc-900/20 hover:shadow-zinc-900/30 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" /> New post
              </Button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {loading ? (
            <div className="py-24 text-center">
              <div className="relative inline-block">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
                <div className="absolute inset-0 blur-xl bg-indigo-500/10 rounded-full" />
              </div>
              <p className="text-sm text-zinc-400 font-medium">Loading your posts…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-zinc-300/50 bg-white/50 backdrop-blur-sm py-20 text-center transition-all hover:border-indigo-300/50">
              <div className="relative inline-block">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/10">
                  <FileText className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                  <Plus className="h-3 w-3 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1 text-lg">
                {query ? "No matching posts found" : "Start your blog journey"}
              </h3>
              <p className="text-sm text-zinc-500 mb-5 max-w-sm mx-auto">
                {query ? "Try adjusting your search terms" : "Create your first article and share your insights with the world"}
              </p>
              {!query && (
                <Button 
                  onClick={openCreate} 
                  className="bg-gradient-to-r from-zinc-900 to-zinc-700 hover:from-zinc-800 hover:to-zinc-600 text-white rounded-xl shadow-lg shadow-zinc-900/20"
                >
                  <Plus className="h-4 w-4 mr-2" /> Write your first post
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200/50 bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl shadow-zinc-900/5">
              <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 bg-gradient-to-r from-zinc-50/50 to-white border-b border-zinc-200/50">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <LayoutGrid className="h-3 w-3" /> Post
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 w-24">Category</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 w-28">Status</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 w-16 text-right">Actions</span>
              </div>

              <div className="divide-y divide-zinc-100/50">
                {filtered.map((post) => (
                  <div
                    key={post.id}
                    className="group grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-indigo-50/30 transition-all duration-200 relative"
                  >
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 rounded-r-full ${dotFor(post.category)} opacity-60 group-hover:opacity-100 transition-opacity`}
                    />
                    <div className="flex items-center gap-4 min-w-0 pl-2">
                      <div className="h-12 w-16 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 overflow-hidden shrink-0 flex items-center justify-center shadow-sm border border-zinc-200/30 group-hover:shadow-md transition-all">
                        {post.image ? (
                          <img src={post.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff className="h-4 w-4 text-zinc-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {post.featured && (
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0 animate-pulse" />
                          )}
                          <p className="font-semibold text-zinc-900 truncate text-sm group-hover:text-indigo-600 transition-colors">
                            {post.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-24 hidden md:flex items-center">
                      <CategoryBadge category={post.category} />
                    </div>

                    <div className="w-28 hidden md:block">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full transition-all ${
                          post.published
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            : "bg-zinc-50 text-zinc-500 border border-zinc-200/50"
                        }`}
                      >
                        {post.published ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </div>

                    <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={() => openEdit(post)}
                        className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 hover:scale-110"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog - Enhanced with better UX */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white/95 backdrop-blur-sm border border-zinc-200/50 shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-200/50 bg-gradient-to-r from-zinc-50/50 to-white sticky top-0 z-10 bg-white/95">
            <div className="flex items-center justify-between bg-white/95">
              <div className="flex items-center gap-3 bg-white/95">
                <div className={`h-3 w-3 rounded-full ${dotFor(form.category)} animate-pulse`} />
                <DialogTitle className="text-xl font-bold text-zinc-900">
                  {editingId ? "Edit Article" : "Create New Article"}
                </DialogTitle>
                {editingId && (
                  <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                    Editing
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <DialogDescription className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              {editingId ? "Update your article details below. All changes are saved immediately." : "Fill in the details below to publish a new article."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-6">
            {/* Title with auto-slug */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  Title <span className="text-red-500">*</span>
                </Label>
                <CharacterCounter current={form.title.length} max={100} />
              </div>
              <Input 
                value={form.title} 
                onChange={(e) => handleTitleChange(e.target.value)} 
                placeholder="Enter an attention-grabbing title"
                className={`border-zinc-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 rounded-xl text-zinc-900 font-medium placeholder:text-zinc-400 ${
                  validationErrors.title ? 'border-red-300 focus:border-red-300 focus:ring-red-200/50' : ''
                }`}
              />
              {validationErrors.title && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.title}
                </p>
              )}
            </div>

            {/* Slug with preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-indigo-500" />
                  Slug <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-zinc-400">(URL-friendly)</span>
                </Label>
              </div>
              <Input
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }}
                className={`border-zinc-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 rounded-xl font-mono text-sm ${
                  validationErrors.slug ? 'border-red-300 focus:border-red-300 focus:ring-red-200/50' : ''
                }`}
                placeholder="your-article-slug"
              />
              {validationErrors.slug && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.slug}
                </p>
              )}
              <SlugPreview slug={form.slug} />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-zinc-700">Excerpt <span className="text-red-500">*</span></Label>
                <CharacterCounter current={form.excerpt.length} max={200} />
              </div>
              <Textarea 
                rows={2} 
                value={form.excerpt} 
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })} 
                placeholder="Write a compelling one-line summary for the blog listing"
                className={`border-zinc-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 rounded-xl resize-none text-zinc-600 placeholder:text-zinc-400 ${
                  validationErrors.excerpt ? 'border-red-300 focus:border-red-300 focus:ring-red-200/50' : ''
                }`}
              />
              {validationErrors.excerpt && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.excerpt}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-indigo-500" />
                  Content <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-zinc-400">(Markdown supported)</span>
                </Label>
                <CharacterCounter current={form.content.length} max={10000} />
              </div>
              <Textarea 
                rows={12} 
                className={`font-mono text-sm border-zinc-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 rounded-xl resize-none bg-zinc-50/50 ${
                  validationErrors.content ? 'border-red-300 focus:border-red-300 focus:ring-red-200/50' : ''
                }`} 
                value={form.content} 
                onChange={(e) => setForm({ ...form, content: e.target.value })} 
                placeholder="Write your article content in Markdown..."
              />
              {validationErrors.content && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.content}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200/50">
                <Info className="h-3 w-3" />
                <span>Supports Markdown: **bold**, *italic*, # headings, - lists, and more</span>
              </div>
            </div>

            {/* Metadata - Two column grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-zinc-700">Category</Label>
                <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v })}>
                  <SelectTrigger className="border-zinc-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border border-zinc-200/50 shadow-xl rounded-xl">
                    {categories.filter((c) => c !== "All").map((c) => (
                      <SelectItem key={c} value={c} className="hover:bg-indigo-50/50 rounded-lg">
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${dotFor(c)}`} />
                          {c}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-indigo-500" />
                  Author <span className="text-red-500">*</span>
                </Label>
                <Input 
                  value={form.author} 
                  onChange={(e) => setForm({ ...form, author: e.target.value })} 
                  className={`border-zinc-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 rounded-xl ${
                    validationErrors.author ? 'border-red-300 focus:border-red-300 focus:ring-red-200/50' : ''
                  }`}
                  placeholder="Author name"
                />
                {validationErrors.author && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.author}
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  Read time
                </Label>
                <Input 
                  placeholder="e.g., 6 min read" 
                  value={form.read_time} 
                  onChange={(e) => setForm({ ...form, read_time: e.target.value })} 
                  className="border-zinc-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-indigo-500" />
                  Tags
                </Label>
                <Input 
                  value={tagsInput} 
                  onChange={(e) => setTagsInput(e.target.value)} 
                  placeholder="AI, product, growth (comma separated)"
                  className="border-zinc-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 rounded-xl"
                />
                {tagsInput && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {tagsInput.split(",").map((tag) => {
                      const trimmed = tag.trim();
                      if (!trimmed) return null;
                      return (
                        <span key={trimmed} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                          #{trimmed}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Image upload with preview */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-indigo-500" />
                Cover Image
              </Label>
              <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-dashed border-zinc-200/50 hover:border-indigo-300/50 transition-all bg-zinc-50/30">
                <div className="h-24 w-32 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-200/30 shadow-sm">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Cover preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-400">
                      <ImageOff className="h-6 w-6" />
                      <span className="text-[10px]">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="border-zinc-200/50 focus:border-indigo-300 focus:ring-indigo-200/50 rounded-xl cursor-pointer"
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                      </div>
                    )}
                  </div>
                  {uploading && (
                    <p className="text-xs text-indigo-500 flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading image…
                    </p>
                  )}
                  {imagePreview && !uploading && (
                    <button
                      onClick={handleImageRemove}
                      className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
                    >
                      <X className="h-3 w-3" /> Remove image
                    </button>
                  )}
                  <p className="text-[10px] text-zinc-400">
                    Recommended: 1200x630px, max 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Switches in a card */}
            <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50/50 border border-zinc-200/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <Label className="cursor-pointer text-sm font-medium text-zinc-700">
                    Featured
                  </Label>
                </div>
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => setForm({ ...form, featured: v })}
                  className="data-[checked]:!bg-indigo-500 data-[unchecked]:!bg-zinc-300"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {form.published ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-zinc-400" />
                  )}
                  <Label className="cursor-pointer text-sm font-medium text-zinc-700">
                    {form.published ? "Published" : "Draft"}
                  </Label>
                </div>
                <Switch
                  checked={form.published}
                  onCheckedChange={(v) => setForm({ ...form, published: v })}
                  className="data-[checked]:!bg-emerald-500 data-[unchecked]:!bg-zinc-300"
                />
              </div>
            </div>

            {/* Summary card when editing */}
            {editingId && (
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
                <div className="flex items-center gap-2 text-xs text-indigo-600">
                  <Info className="h-3.5 w-3.5" />
                  <span>Editing post ID: <span className="font-mono">{editingId}</span></span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="p-6 pt-0 flex gap-3 border-t border-zinc-200/50 bg-zinc-50/50 rounded-b-2xl">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border-zinc-200/50 hover:bg-zinc-100 transition-all"
            >
              Cancel
            </Button>
            <Button
              className="flex-[2] bg-gradient-to-r from-zinc-900 to-zinc-700 hover:from-zinc-800 hover:to-zinc-600 text-white rounded-xl shadow-lg shadow-zinc-900/20 hover:shadow-zinc-900/30 transition-all duration-200"
              disabled={saving || uploading}
              onClick={handleSave}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </span>
              ) : editingId ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Update Article
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Publish Article
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogAdmin;