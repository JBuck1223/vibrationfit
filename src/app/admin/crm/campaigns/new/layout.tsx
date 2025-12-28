import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New',
};

export default function NewCampaignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

