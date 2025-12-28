import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Generate',
    default: 'Generate',
  },
};

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

