import { ScriptTitle } from '@/lib/design-system/components/typography/ScriptTitle'

/** Poppins title with one Indie Flower word, same pairing as the homepage. */
export function BeginTitle({ text, accent }: { text: string; accent: string }) {
  return <ScriptTitle text={text} accent={accent} />
}
