import { cn } from '@/lib/utils';

interface HtmlContentProps {
  content: string;
  className?: string;
}

const HtmlContent = ({ content, className }: HtmlContentProps) => {
  // Detect if content is HTML or markdown
  const isHtml = content.trim().startsWith('<') || /<[a-z][\s\S]*>/i.test(content);
  
  if (isHtml) {
    return (
      <div 
        className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  
  // Fallback to simple rendering for plain text/markdown
  // Import MarkdownContent dynamically would be overkill, just render as-is
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap', className)}>
      {content}
    </div>
  );
};

export default HtmlContent;
