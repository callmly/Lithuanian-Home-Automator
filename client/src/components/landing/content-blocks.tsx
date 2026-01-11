import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContentBlock } from "@shared/schema";

export function ContentBlocksSection() {
  const { data: blocks = [], isLoading } = useQuery<ContentBlock[]>({
    queryKey: ["/api/content-blocks"],
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="space-y-8">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (blocks.length === 0) {
    return null;
  }

  return (
    <>
      {blocks.map((block) => (
        <section 
          key={block.id} 
          id={block.slug || `block-${block.id}`}
          className="py-16 bg-muted/30" 
          data-testid={`content-block-${block.id}`}
        >
          <div className="container mx-auto px-4 lg:px-8">
            <article className="space-y-4">
              {block.titleLt && (
                <h2 className="text-2xl font-bold text-foreground">
                  {block.titleLt}
                </h2>
              )}
              {block.isHtml ? (
                <div
                  className="prose prose-slate dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: block.contentLt ?? "" }}
                />
              ) : (
                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {block.contentLt}
                </div>
              )}
            </article>
          </div>
        </section>
      ))}
    </>
  );
}
