import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio Designer',
};

export default function AudioDesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

