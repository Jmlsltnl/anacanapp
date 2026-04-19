import { motion } from 'framer-motion';
import { useTranslation } from "@/hooks/useTranslation";

interface PostSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'recent' | 'popular';
  onSortChange: (sort: 'recent' | 'popular') => void;
}

const PostSearchFilter = ({ sortBy, onSortChange }: PostSearchFilterProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-1 mb-3 border-b border-border/8 pb-2">
      {[
        { id: 'recent' as const, label: t("postsearchfilter_en_son_473654", 'Ən son') },
        { id: 'popular' as const, label: 'Populyar' },
      ].map((option) => (
        <button
          key={option.id}
          onClick={() => onSortChange(option.id)}
          className={`relative px-3.5 py-1.5 text-[11px] font-bold transition-colors ${
            sortBy === option.id
              ? 'text-foreground'
              : 'text-muted-foreground/35'
          }`}
        >
          {option.label}
          {sortBy === option.id && (
            <motion.div
              layoutId="sort-underline"
              className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-primary"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default PostSearchFilter;
