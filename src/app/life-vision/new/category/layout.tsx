import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Category',
    default: 'Category',
  },
};

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

