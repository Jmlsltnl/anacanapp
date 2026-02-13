import { cn } from '@/lib/utils';

interface HtmlContentProps {
  content: string;
  className?: string;
}

const HtmlContent = ({ content, className }: HtmlContentProps) => {
  const isHtml = content.trim().startsWith('<') || /<[a-z][\s\S]*>/i.test(content);
  
  if (isHtml) {
    return (
      <div 
        className={cn(
          'prose prose-sm dark:prose-invert max-w-none',
          // Rich text editor output styling
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3',
          '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2',
          '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2',
          '[&_p]:my-2 [&_p]:leading-relaxed',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ul]:space-y-1',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_ol]:space-y-1',
          '[&_li]:text-sm [&_li]:leading-relaxed',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
          '[&_a]:text-primary [&_a]:underline [&_a]:hover:no-underline',
          '[&_img]:rounded-xl [&_img]:my-4 [&_img]:max-w-full',
          '[&_strong]:font-semibold',
          '[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
          '[&_hr]:my-6 [&_hr]:border-border',
          className
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap', className)}>
      {content}
    </div>
  );
};

export default HtmlContent;
