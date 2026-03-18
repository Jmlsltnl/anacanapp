import { motion } from 'framer-motion';

interface PostSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'recent' | 'popular';
  onSortChange: (sort: 'recent' | 'popular') => void;
}

const PostSearchFilter = ({ sortBy, onSortChange }: PostSearchFilterProps) => {
  return (
    <div className="flex gap-1 mb-3">
      {[
        { id: 'recent' as const, label: 'Ən son' },
        { id: 'popular' as const, label: 'Populyar' },
      ].map((option) => (
        <motion.button
          key={option.id}
          onClick={() => onSortChange(option.id)}
          className={`px-3 py-[5px] rounded-lg text-[10px] font-bold transition-all ${
            sortBy === option.id
              ? 'gradient-primary text-primary-foreground shadow-sm'
              : 'bg-muted/20 text-muted-foreground/40 active:bg-muted/35'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {option.label}
        </motion.button>
      ))}
    </div>
  );
};

export default PostSearchFilter;
