import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Refine',
    default: 'Refine',
  },
};

export default function LifeVisionRefineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

