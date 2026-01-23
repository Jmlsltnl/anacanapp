import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Star, Search,
  ChevronDown, Save, X, Image as ImageIcon, Tag, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useBlogAdmin, BlogPost, BlogCategory } from '@/hooks/useBlog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const AdminBlog = () => {
  const { posts, categories, loading, createPost, updatePost, deletePost, createCategory, deleteCategory } = useBlogAdmin();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'posts' | 'categories'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    category: 'hamiləlik',
    tags: [] as string[],
    author_name: 'Anacan',
    reading_time: 5,
    is_featured: false,
    is_published: false
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📝',
    color: '#f28155'
  });

  const [newTag, setNewTag] = useState('');

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-ğüşöçəı]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      cover_image_url: post.cover_image_url || '',
      category: post.category,
      tags: post.tags || [],
      author_name: post.author_name,
      reading_time: post.reading_time,
      is_featured: post.is_featured,
      is_published: post.is_published
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Xəta',
        description: 'Başlıq və məzmun tələb olunur',
        variant: 'destructive'
      });
      return;
    }

    const postData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.title)
    };

    let result;
    if (editingPost) {
      result = await updatePost(editingPost.id, postData);
    } else {
      result = await createPost(postData);
    }

    if (result.error) {
      toast({
        title: 'Xəta',
        description: 'Məqalə saxlanıla bilmədi',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Uğurlu!',
        description: editingPost ? 'Məqalə yeniləndi' : 'Məqalə yaradıldı'
      });
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu məqaləni silmək istədiyinizə əminsiniz?')) {
      const result = await deletePost(id);
      if (!result.error) {
        toast({
          title: 'Silindi',
          description: 'Məqalə uğurla silindi'
        });
      }
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    await updatePost(post.id, { is_published: !post.is_published });
    toast({
      title: post.is_published ? 'Gizlədildi' : 'Dərc edildi',
      description: `Məqalə ${post.is_published ? 'gizlədildi' : 'dərc edildi'}`
    });
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    await updatePost(post.id, { is_featured: !post.is_featured });
  };

  const handleSaveCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: 'Xəta',
        description: 'Kateqoriya adı tələb olunur',
        variant: 'destructive'
      });
      return;
    }

    const result = await createCategory({
      ...newCategory,
      slug: newCategory.slug || generateSlug(newCategory.name),
      sort_order: categories.length,
      is_active: true
    });

    if (!result.error) {
      toast({
        title: 'Uğurlu!',
        description: 'Kateqoriya yaradıldı'
      });
      setNewCategory({ name: '', slug: '', description: '', icon: '📝', color: '#f28155' });
      setShowCategoryModal(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Bu kateqoriyanı silmək istədiyinizə əminsiniz?')) {
      await deleteCategory(id);
      toast({
        title: 'Silindi',
        description: 'Kateqoriya silindi'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      cover_image_url: '',
      category: 'hamiləlik',
      tags: [],
      author_name: 'Anacan',
      reading_time: 5,
      is_featured: false,
      is_published: false
    });
    setEditingPost(null);
    setShowEditor(false);
  };

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bloq İdarəsi</h1>
          <p className="text-muted-foreground">Məqalələr və kateqoriyaları idarə edin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
            <Tag className="w-4 h-4 mr-2" />
            Kateqoriya
          </Button>
          <Button onClick={() => setShowEditor(true)} className="bg-primary">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Məqalə
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'posts'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
        >
          Məqalələr ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'categories'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
        >
          Kateqoriyalar ({categories.length})
        </button>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Məqalə axtar..."
              className="pl-10"
            />
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {post.cover_image_url ? (
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={post.is_published ? 'default' : 'secondary'}>
                      {post.is_published ? 'Dərc edilib' : 'Qaralama'}
                    </Badge>
                    {post.is_featured && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                  </div>

                  <h3 className="font-bold text-foreground line-clamp-2 mb-2">{post.title}</h3>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <span>{categories.find(c => c.slug === post.category)?.name || post.category}</span>
                    <span>•</span>
                    <span>{post.reading_time} dəq</span>
                    <span>•</span>
                    <span>{post.view_count} baxış</span>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Redaktə
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTogglePublish(post)}
                    >
                      {post.is_published ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleFeatured(post)}
                    >
                      <Star className={`w-3 h-3 ${post.is_featured ? 'text-amber-500 fill-amber-500' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-muted-foreground">Hələ məqalə yoxdur</p>
            </div>
          )}
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.slug}</p>
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {posts.filter(p => p.category === category.slug).length} məqalə
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Post Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <h2 className="text-xl font-bold">
                  {editingPost ? 'Məqaləni Redaktə Et' : 'Yeni Məqalə'}
                </h2>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Başlıq *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Məqalənin başlığı"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="text-sm font-medium mb-2 block">URL Slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="meqale-url-slug"
                  />
                </div>

                {/* Cover Image */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Örtük Şəkli URL</label>
                  <Input
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.cover_image_url && (
                    <img
                      src={formData.cover_image_url}
                      alt="Preview"
                      className="mt-2 w-full h-40 object-cover rounded-lg"
                    />
                  )}
                </div>

                {/* Category & Reading Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Kateqoriya</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Oxuma müddəti (dəq)</label>
                    <Input
                      type="number"
                      value={formData.reading_time}
                      onChange={(e) => setFormData({ ...formData, reading_time: parseInt(e.target.value) || 5 })}
                      min={1}
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Qısa Təsvir</label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Məqalənin qısa təsviri..."
                    rows={2}
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Məzmun *</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Məqalənin tam məzmunu..."
                    rows={12}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Etiketlər</label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                        {tag} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Yeni etiket"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      Əlavə et
                    </Button>
                  </div>
                </div>

                {/* Author */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Müəllif adı</label>
                  <Input
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    placeholder="Anacan"
                  />
                </div>

                {/* Toggles */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <span className="text-sm">Önə çıxan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                    <span className="text-sm">Dərc et</span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-card">
                <Button variant="outline" onClick={resetForm}>
                  Ləğv et
                </Button>
                <Button onClick={handleSave} className="bg-primary">
                  <Save className="w-4 h-4 mr-2" />
                  {editingPost ? 'Yenilə' : 'Yarat'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold">Yeni Kateqoriya</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Ad *</label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value, slug: generateSlug(e.target.value) })}
                    placeholder="Kateqoriya adı"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Emoji İkon</label>
                  <Input
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    placeholder="📝"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Rəng</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      placeholder="#f28155"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Təsvir</label>
                  <Textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Kateqoriya haqqında qısa məlumat"
                    rows={2}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
                  Ləğv et
                </Button>
                <Button onClick={handleSaveCategory} className="bg-primary">
                  Yarat
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBlog;
