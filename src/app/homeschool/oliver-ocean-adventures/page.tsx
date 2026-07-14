import fs from 'fs/promises'
import path from 'path'
import type { Metadata } from 'next'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Waves, BookOpen } from 'lucide-react'
import { Container } from '@/lib/design-system/components'

export const metadata: Metadata = {
  title: "Oliver's Ocean Adventures | Homeschool",
  description:
    'Personalized play-based homeschool curriculum for Oliver, broken into weekly lesson plans.',
}

export const dynamic = 'force-dynamic'

const CURRICULUM_DIR = path.join(
  process.cwd(),
  'homeschool',
  'oliver-ocean-adventures'
)

interface Section {
  slug: string
  title: string
  content: string
}

async function loadSections(): Promise<Section[]> {
  const files = (await fs.readdir(CURRICULUM_DIR))
    .filter((f) => f.endsWith('.md'))
    .sort()

  return Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(
        path.join(CURRICULUM_DIR, file),
        'utf-8'
      )
      const firstHeading = content.match(/^#\s+(.+)$/m)?.[1] ?? file
      return {
        slug: file.replace(/\.md$/, ''),
        title: firstHeading,
        content,
      }
    })
  )
}

const markdownComponents = {
  h1: (props: React.ComponentProps<'h1'>) => (
    <h1 className="text-3xl font-bold text-white mb-6 pb-4 border-b-2 border-[#333]" {...props} />
  ),
  h2: (props: React.ComponentProps<'h2'>) => (
    <h2 className="text-xl font-bold text-[#00FFFF] mt-10 mb-4" {...props} />
  ),
  h3: (props: React.ComponentProps<'h3'>) => (
    <h3 className="text-lg font-semibold text-white mt-6 mb-3" {...props} />
  ),
  p: (props: React.ComponentProps<'p'>) => (
    <p className="text-neutral-300 leading-relaxed mb-4" {...props} />
  ),
  ul: (props: React.ComponentProps<'ul'>) => (
    <ul className="list-disc list-outside pl-6 mb-4 space-y-1.5 text-neutral-300" {...props} />
  ),
  ol: (props: React.ComponentProps<'ol'>) => (
    <ol className="list-decimal list-outside pl-6 mb-4 space-y-1.5 text-neutral-300" {...props} />
  ),
  li: (props: React.ComponentProps<'li'>) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: (props: React.ComponentProps<'strong'>) => (
    <strong className="font-semibold text-white" {...props} />
  ),
  a: (props: React.ComponentProps<'a'>) => (
    <a
      className="text-[#39FF14] underline underline-offset-2 hover:text-[#5FFF3E]"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: (props: React.ComponentProps<'blockquote'>) => (
    <blockquote className="border-l-4 border-[#39FF14] pl-4 italic text-neutral-400 my-4" {...props} />
  ),
  hr: () => <hr className="border-[#333] my-8" />,
  table: (props: React.ComponentProps<'table'>) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse" {...props} />
    </div>
  ),
  th: (props: React.ComponentProps<'th'>) => (
    <th className="text-left font-semibold text-white bg-[#1a1a1a] border border-[#333] px-3 py-2" {...props} />
  ),
  td: (props: React.ComponentProps<'td'>) => (
    <td className="text-neutral-300 border border-[#333] px-3 py-2 align-top" {...props} />
  ),
  input: (props: React.ComponentProps<'input'>) =>
    props.type === 'checkbox' ? (
      <input
        {...props}
        disabled
        className="mr-2 h-4 w-4 accent-[#39FF14] align-middle"
      />
    ) : (
      <input {...props} />
    ),
  code: (props: React.ComponentProps<'code'>) => (
    <code className="bg-[#1a1a1a] text-[#00FFFF] rounded px-1.5 py-0.5 text-sm" {...props} />
  ),
}

export default async function OceanAdventuresPage() {
  const sections = await loadSections()

  return (
    <div className="min-h-screen bg-black">
      <Container size="lg" className="px-6 py-12">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Waves className="w-10 h-10 text-[#00FFFF]" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Oliver&apos;s Ocean Adventures
            </h1>
          </div>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Personalized homeschool curriculum for Oliver (Age 6). Play-based,
            hands-on, interest-led, and child-centered — broken into four
            weekly lesson plans.
          </p>
        </header>

        <nav className="mb-12">
          <div className="flex flex-wrap justify-center gap-3">
            {sections.map((section) => (
              <a
                key={section.slug}
                href={`#${section.slug}`}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#333] px-5 py-2 text-sm text-neutral-300 transition-all duration-300 hover:border-[#39FF14] hover:text-white hover:-translate-y-0.5"
              >
                <BookOpen className="w-4 h-4 text-[#39FF14]" />
                {section.title.replace(/ — .*$/, '')}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-12">
          {sections.map((section) => (
            <section
              key={section.slug}
              id={section.slug}
              className="scroll-mt-24 rounded-2xl border-2 border-[#333] bg-[#0d0d0d] p-6 md:p-10"
            >
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {section.content}
              </Markdown>
            </section>
          ))}
        </div>

        <footer className="mt-12 text-center text-sm text-neutral-500">
          Edit the markdown files in <code className="text-neutral-400">homeschool/oliver-ocean-adventures/</code>{' '}
          and refresh this page to see changes.
        </footer>
      </Container>
    </div>
  )
}
