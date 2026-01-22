import { useState } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PostSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'recent' | 'popular';
  onSortChange: (sort: 'recent' | 'popular') => void;
}

const PostSearchFilter = ({ searchQuery, onSearchChange, sortBy, onSortChange }: PostSearchFilterProps) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Postlarda axtar..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-11 rounded-xl bg-muted/50 border-border"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-11 w-11 rounded-xl border-border ${showFilters ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 p-3 bg-muted/30 rounded-xl">
              <span className="text-sm text-muted-foreground self-center">Sırala:</span>
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSortChange('recent')}
                className="rounded-lg"
              >
                Ən son
              </Button>
              <Button
                variant={sortBy === 'popular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSortChange('popular')}
                className="rounded-lg"
              >
                Populyar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results Count */}
      {searchQuery && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-foreground"
        >
          "{searchQuery}" üçün axtarış nəticələri
        </motion.p>
      )}
    </div>
  );
};

export default PostSearchFilter;
