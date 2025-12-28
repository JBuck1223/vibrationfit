import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Members',
    default: 'Members',
  },
};

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

