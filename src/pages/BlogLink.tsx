import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { rememberBlog, validBlogSlug } from '@/lib/blog-links';

export default function BlogLink() {
  const { slug } = useParams(), navigate = useNavigate();
  useEffect(() => {
    if (validBlogSlug(slug)) rememberBlog(slug);
    navigate('/', { replace: true });
  }, [slug, navigate]);
  return null;
}
