import { Metadata } from 'next';
import { IntensiveStepProvider } from '@/components/intensive-studio/IntensiveStepContext';

export const metadata: Metadata = {
  title: 'Intensive',
};

export default function IntensiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IntensiveStepProvider>{children}</IntensiveStepProvider>;
}

