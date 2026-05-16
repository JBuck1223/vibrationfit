import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Tokens',
    default: 'Tokens',
  },
};

export default function TokensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

