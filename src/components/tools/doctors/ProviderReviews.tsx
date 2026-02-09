import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, Trash2, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProviderReviews } from '@/hooks/useProviderReviews';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';

interface ProviderReviewsProps {
  providerId: string;
  providerName: string;
}

const ProviderReviews = ({ providerId, providerName }: ProviderReviewsProps) => {
  const { reviews, userReview, isLoading, submitReview, deleteReview, isAuthenticated } = useProviderReviews(providerId);
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(userReview?.comment || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    submitReview.mutate({ rating, comment });
    setIsExpanded(false);
  };

  const handleDelete = () => {
    deleteReview.mutate();
    setRating(0);
    setComment('');
  };

  // Update local state when userReview changes
  if (userReview && rating === 0 && !isExpanded) {
    setRating(userReview.rating);
    setComment(userReview.comment || '');
  }

  return (
    <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Rəylər ({reviews.length})</h2>
        </div>
        {isAuthenticated && !isExpanded && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-xs"
          >
            {userReview ? 'Rəyi redaktə et' : 'Rəy yaz'}
          </Button>
        )}
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {isExpanded && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 pb-4 border-b border-border/50"
          >
            <p className="text-sm text-muted-foreground mb-3">
              {providerName} haqqında rəyinizi yazın
            </p>
            
            {/* Star Rating */}
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 ? `${rating}/5` : 'Qiymətləndirin'}
              </span>
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Təcrübənizi bölüşün (istəyə bağlı)..."
              className="w-full p-3 rounded-xl bg-muted border-0 text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-primary/20"
            />

            {/* Actions */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    setRating(userReview?.rating || 0);
                    setComment(userReview?.comment || '');
                  }}
                >
                  Ləğv et
                </Button>
                {userReview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Sil
                  </Button>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={rating === 0 || submitReview.isPending}
              >
                <Send className="w-4 h-4 mr-1" />
                {userReview ? 'Yenilə' : 'Göndər'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Not authenticated message */}
      {!isAuthenticated && (
        <div className="text-center py-4 mb-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground">
            Rəy yazmaq üçün hesabınıza daxil olun
          </p>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-6">
          <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Hələ heç bir rəy yoxdur</p>
          <p className="text-xs text-muted-foreground/70">İlk rəyi siz yazın!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-3"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {review.user_avatar ? (
                  <img src={review.user_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{review.user_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: az })}
                  </span>
                </div>
                
                {/* Stars */}
                <div className="flex items-center gap-0.5 my-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>

                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderReviews;
