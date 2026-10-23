'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'

const components = {
  p: (props: React.ComponentProps<'p'>) => <p className="mb-3 last:mb-0" {...props} />,
  h1: (props: React.ComponentProps<'h1'>) => <h3 className="mb-2 mt-4 text-lg font-semibold text-white first:mt-0" {...props} />,
  h2: (props: React.ComponentProps<'h2'>) => <h3 className="mb-2 mt-4 text-base font-semibold text-white first:mt-0" {...props} />,
  h3: (props: React.ComponentProps<'h3'>) => <h4 className="mb-1.5 mt-3 font-semibold text-white first:mt-0" {...props} />,
  h4: (props: React.ComponentProps<'h4'>) => <h4 className="mb-1.5 mt-3 font-semibold text-white first:mt-0" {...props} />,
  ul: (props: React.ComponentProps<'ul'>) => <ul className="mb-3 list-outside list-disc space-y-1.5 pl-5 last:mb-0" {...props} />,
  ol: (props: React.ComponentProps<'ol'>) => <ol className="mb-3 list-outside list-decimal space-y-1.5 pl-5 last:mb-0" {...props} />,
  strong: (props: React.ComponentProps<'strong'>) => <strong className="font-semibold text-white" {...props} />,
  em: (props: React.ComponentProps<'em'>) => <em className="italic" {...props} />,
  blockquote: (props: React.ComponentProps<'blockquote'>) => <blockquote className="mb-3 border-l-2 border-white/20 pl-3 italic" {...props} />,
  a: (props: React.ComponentProps<'a'>) => (
    <a className="text-[#39FF14] underline underline-offset-2 [overflow-wrap:anywhere]" target="_blank" rel="noreferrer" {...props} />
  ),
}

/**
 * Text members wrote or saved (Journal, Stories) shown with its formatting:
 * bold, italics, headings and lists render instead of showing ** or ##.
 * Plain text without marks looks the same as before (line breaks kept).
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('leading-relaxed [overflow-wrap:anywhere]', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
