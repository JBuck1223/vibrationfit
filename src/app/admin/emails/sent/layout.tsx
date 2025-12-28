import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sent',
};

export default function SentEmailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

