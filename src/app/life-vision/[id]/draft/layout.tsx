import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Draft',
    default: 'Draft',
  },
};

export default function DraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

