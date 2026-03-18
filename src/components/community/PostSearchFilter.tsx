import { motion } from 'framer-motion';

interface PostSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'recent' | 'popular';
  onSortChange: (sort: 'recent' | 'popular') => void;
}

const PostSearchFilter = ({ sortBy, onSortChange }: PostSearchFilterProps) => {
  return (
    <div className="flex gap-1.5 mb-3">
      {[
        { id: 'recent' as const, label: 'Ən son' },
        { id: 'popular' as const, label: 'Populyar' },
      ].map((option) => (
        <motion.button
          key={option.id}
          onClick={() => onSortChange(option.id)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            sortBy === option.id
              ? 'gradient-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
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
