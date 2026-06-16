import { tr } from "@/lib/tr";import { useEffect, useRef, useState, ReactNode } from 'react';
import { useUnreadCommunityPosts } from '@/hooks/useUnreadCommunityPosts';
import { useAuth } from '@/hooks/useAuth';

interface PostSeenObserverProps {
  postId: string;
  createdAt: string;
  postUserId?: string;
  children: ReactNode;
}

/**
 * Wraps a community post and marks it as "seen" when at least 50% of it
 * has been visible in the viewport for ~600ms. Also renders a small red
 * unread-dot in the top-right corner if the post is newer than the user's
 * last-seen timestamp; the dot disappears synchronously when marked seen.
 */
const PostSeenObserver = ({ postId, createdAt, postUserId, children }: PostSeenObserverProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { markPostSeen, isUnreadPost, seenPostIds } = useUnreadCommunityPosts();
  const { user } = useAuth();
  const [marked, setMarked] = useState(false);

  const isOwnPost = !!postUserId && postUserId === user?.id;

  useEffect(() => {
    if (seenPostIds[postId]) {
      setMarked(true);
      return;
    }
    setMarked(false);
  }, [postId, seenPostIds]);

  const isUnread = !isOwnPost && !marked && isUnreadPost(postId, createdAt, postUserId);

  useEffect(() => {
    if (!ref.current || marked) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (timer) return;
          timer = setTimeout(() => {
            setMarked(true);
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
  }, [postId, createdAt, postUserId, markPostSeen, marked]);

  return (
    <div ref={ref} className="relative">
      {isUnread &&
      <span
        aria-label={tr("postseenobserver_oxunmamis_post_42ef5b", "Oxunmam\u0131\u015F post")}
        className="absolute top-3 right-3 z-20 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-background shadow-sm animate-pulse" />

      }
      {children}
    </div>);

};

export default PostSeenObserver;