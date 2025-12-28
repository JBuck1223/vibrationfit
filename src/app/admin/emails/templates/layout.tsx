import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Templates',
    default: 'Templates',
  },
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

