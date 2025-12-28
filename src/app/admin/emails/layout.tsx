import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Emails',
    default: 'Emails',
  },
};

export default function EmailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

