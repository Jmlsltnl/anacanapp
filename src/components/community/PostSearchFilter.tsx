import { motion } from 'framer-motion';
import { tr } from "@/lib/tr";

interface PostSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'recent' | 'popular';
  onSortChange: (sort: 'recent' | 'popular') => void;
}

const PostSearchFilter = ({ sortBy, onSortChange }: PostSearchFilterProps) => {
  return (
    <div className="a-tabs" style={{ marginBottom: 14 }}>
      {[
        { id: 'recent' as const, label: tr("postsearchfilter_en_son_473654", 'Ən son') },
        { id: 'popular' as const, label: tr("postsearchfilter_populyar", 'Populyar') },
      ].map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSortChange(option.id)}
          className={`a-tab${sortBy === option.id ? ' active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default PostSearchFilter;
