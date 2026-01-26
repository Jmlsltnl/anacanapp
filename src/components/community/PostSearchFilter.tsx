import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface PostSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'recent' | 'popular';
  onSortChange: (sort: 'recent' | 'popular') => void;
}

const PostSearchFilter = ({ sortBy, onSortChange }: PostSearchFilterProps) => {
  return (
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
  );
};

export default PostSearchFilter;
