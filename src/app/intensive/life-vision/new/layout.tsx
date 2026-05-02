import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | New Vision',
    default: 'New Vision',
  },
};

export default function IntensiveNewVisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
