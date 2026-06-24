import { Metadata } from 'next'
import { ProjectsLayoutClient } from '@/components/projects/ProjectsLayoutClient'

export const metadata: Metadata = {
  title: 'Projects',
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <ProjectsLayoutClient>{children}</ProjectsLayoutClient>
}
