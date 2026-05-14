import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Create Vision',
    default: 'Create Vision',
  },
};

export default function IntensiveCreateVisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
