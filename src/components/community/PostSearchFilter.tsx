import { motion } from 'framer-motion';

interface PostSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'recent' | 'popular';
  onSortChange: (sort: 'recent' | 'popular') => void;
}

const PostSearchFilter = ({ sortBy, onSortChange }: PostSearchFilterProps) => {
  return (
    <div className="flex gap-1.5 mb-4">
      {[
        { id: 'recent' as const, label: 'Ən son' },
        { id: 'popular' as const, label: 'Populyar' },
      ].map((option) => (
        <motion.button
          key={option.id}
          onClick={() => onSortChange(option.id)}
          className={`px-4 py-[7px] rounded-2xl text-[11px] font-bold transition-all duration-250 ${
            sortBy === option.id
              ? 'gradient-primary text-primary-foreground shadow-[0_2px_10px_-3px_hsl(var(--primary)/0.35)]'
              : 'bg-muted/25 text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground'
          }`}
          whileTap={{ scale: 0.94 }}
        >
          {option.label}
        </motion.button>
      ))}
    </div>
  );
};

export default PostSearchFilter;
