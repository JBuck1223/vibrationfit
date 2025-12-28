import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Refine',
    default: 'Refine',
  },
};

export default function RefineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

