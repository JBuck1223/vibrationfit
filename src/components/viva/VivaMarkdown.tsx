'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { extractActionCards, VivaActionCard } from '@/components/viva/VivaActionCard'

const components = {
  p: (props: React.ComponentProps<'p'>) => (
    <p className="mb-4 last:mb-0 leading-relaxed text-neutral-100" {...props} />
  ),
  ul: (props: React.ComponentProps<'ul'>) => (
    <ul className="mb-4 last:mb-0 list-disc list-outside pl-5 space-y-2 text-neutral-100" {...props} />
  ),
  ol: (props: React.ComponentProps<'ol'>) => (
    <ol className="mb-4 last:mb-0 list-decimal list-outside pl-5 space-y-2 text-neutral-100" {...props} />
  ),
  li: (props: React.ComponentProps<'li'>) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: (props: React.ComponentProps<'strong'>) => (
    <strong className="font-semibold text-white" {...props} />
  ),
  em: (props: React.ComponentProps<'em'>) => (
    <em className="italic text-neutral-100" {...props} />
  ),
  a: (props: React.ComponentProps<'a'>) => (
    <a
      className="text-[#39FF14] underline underline-offset-2 hover:text-[#5FFF3E]"
      {...props}
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  h1: (props: React.ComponentProps<'h1'>) => (
    <h1 className="text-xl font-semibold text-white mt-6 mb-3 first:mt-0" {...props} />
  ),
  h2: (props: React.ComponentProps<'h2'>) => (
    <h2 className="text-lg font-semibold text-white mt-6 mb-3 first:mt-0" {...props} />
  ),
  h3: (props: React.ComponentProps<'h3'>) => (
    <h3 className="text-base font-semibold text-white mt-5 mb-2 first:mt-0" {...props} />
  ),
  blockquote: (props: React.ComponentProps<'blockquote'>) => (
    <blockquote className="border-l-2 border-neutral-600 pl-4 my-4 text-neutral-300 italic" {...props} />
  ),
  hr: () => <hr className="border-neutral-800 my-6" />,
}

export function VivaMarkdown({ children }: { children: string }) {
  const cards = extractActionCards(children)
  return (
    <div className="viva-markdown text-[15px] leading-relaxed text-neutral-100">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {children}
      </ReactMarkdown>
      {cards.length > 0 && (
        <div className="mt-4 space-y-2">
          {cards.map(card => (
            <VivaActionCard key={card.href} {...card} />
          ))}
        </div>
      )}
    </div>
  )
}
