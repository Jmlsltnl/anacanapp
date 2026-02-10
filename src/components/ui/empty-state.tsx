import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Button } from './button';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  variant?: 'default' | 'gradient' | 'minimal';
  className?: string;
}

const EmptyState = ({
  emoji,
  title,
  description,
  action,
  variant = 'default',
  className = '',
}: EmptyStateProps) => {
  return (
    <motion.div
      className={`text-center py-12 px-4 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated emoji container */}
      <motion.div
        className="relative mx-auto w-24 h-24 mb-4"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-full animate-pulse blur-xl" />
        
        {/* Outer ring */}
        <motion.div
          className={`absolute inset-0 rounded-full ${
            variant === 'gradient'
              ? 'bg-gradient-to-br from-primary/10 to-pink-500/10'
              : 'bg-muted/50'
          }`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Inner container with emoji */}
        <div className="absolute inset-2 bg-card rounded-full flex items-center justify-center shadow-lg border border-border/50">
          <span className="text-4xl">{emoji}</span>
        </div>
        
        {/* Sparkle effects */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary/60"
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-pink-500/60"
          animate={{ scale: [1, 0.8, 1], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>

      {/* Title */}
      <motion.h3
        className="font-bold text-foreground mb-2 text-base"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {description}
      </motion.p>

      {/* Optional action button */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={action.onClick}
            className="gradient-primary text-sm h-10 px-6 gap-2"
          >
            {action.icon}
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

// Preset empty states for common use cases
const NoPostsEmptyState = ({ onCreatePost }: { onCreatePost?: () => void }) => (
  <EmptyState
    emoji="💬"
    title="Hələ paylaşım yoxdur"
    description="İlk paylaşımı siz edin və digər analarla əlaqə qurun!"
    action={
      onCreatePost
        ? {
            label: 'Paylaşım yarat',
            onClick: onCreatePost,
          }
        : undefined
    }
  />
);

const NoCommentsEmptyState = () => (
  <EmptyState
    emoji="💭"
    title="Hələ şərh yoxdur"
    description="Bu paylaşım üçün ilk şərhi siz yazın."
    variant="minimal"
  />
);

const NoSearchResultsEmptyState = () => (
  <EmptyState
    emoji="🔍"
    title="Nəticə tapılmadı"
    description="Başqa axtarış sözləri sınayın."
    variant="minimal"
  />
);

const NoStoriesEmptyState = () => (
  <EmptyState
    emoji="📸"
    title="Story yoxdur"
    description="Hələ ki, heç kim story paylaşmayıb."
    variant="minimal"
  />
);

const NoGroupsEmptyState = () => (
  <EmptyState
    emoji="👥"
    title="Qrup yoxdur"
    description="Sizə uyğun qruplar tezliklə əlavə olunacaq."
    variant="gradient"
  />
);

const NoNotificationsEmptyState = () => (
  <EmptyState
    emoji="🔔"
    title="Bildiriş yoxdur"
    description="Yeni bildirişləriniz burada görünəcək."
    variant="minimal"
  />
);

export {
  EmptyState,
  NoPostsEmptyState,
  NoCommentsEmptyState,
  NoSearchResultsEmptyState,
  NoStoriesEmptyState,
  NoGroupsEmptyState,
  NoNotificationsEmptyState,
};
