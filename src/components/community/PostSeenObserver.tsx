import { useEffect, useRef, ReactNode } from 'react';
import { useUnreadCommunityPosts } from '@/hooks/useUnreadCommunityPosts';

interface PostSeenObserverProps {
  postId: string;
  createdAt: string;
  postUserId?: string;
  children: ReactNode;
}

/**
 * Wraps a community post and marks it as "seen" when at least 50% of it
 * has been visible in the viewport for ~600ms. This drives the per-post
 * decrement of the community badge counter.
 */
const PostSeenObserver = ({ postId, createdAt, postUserId, children }: PostSeenObserverProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { markPostSeen } = useUnreadCommunityPosts();
  const markedRef = useRef(false);

  useEffect(() => {
    if (!ref.current || markedRef.current) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (timer) return;
          timer = setTimeout(() => {
            if (markedRef.current) return;
            markedRef.current = true;
            markPostSeen(postId, createdAt, postUserId);
            observer.disconnect();
          }, 600);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0, 0.5, 1] }
    );

    observer.observe(ref.current);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [postId, createdAt, postUserId, markPostSeen]);

  return <div ref={ref}>{children}</div>;
};

export default PostSeenObserver;
