/**
 * Poppins title with one Indie Flower word in electric lime.
 * Same pairing as the homepage. Defaults to the last word.
 */
export function ScriptTitle({ text, accent }: { text: string; accent?: string }) {
  const parts = splitAccent(text, accent)
  if (!parts) return <>{text}</>

  return (
    <>
      {parts.before}
      <span className="hp-display inline-block text-[1.25em] leading-none text-[#39FF14]">
        {parts.word}
      </span>
      {parts.after}
    </>
  )
}

function splitAccent(
  text: string,
  accent?: string,
): { before: string; word: string; after: string } | null {
  if (accent) {
    const index = text.toLowerCase().indexOf(accent.toLowerCase())
    if (index < 0) return null
    return {
      before: text.slice(0, index),
      word: text.slice(index, index + accent.length),
      after: text.slice(index + accent.length),
    }
  }

  const match = text.match(/^(.*?)(\S+)(\s*)$/)
  if (!match?.[2]) return null
  return { before: match[1], word: match[2], after: match[3] }
}
