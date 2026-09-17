export type VivaJournalTag = 'vision' | 'win' | 'wobble'

export function composeVivaJournalContent(input: {
  journalTag: VivaJournalTag | null
  content: string
  wobbleSummary?: string | null
  clarity?: string | null
  chosenTruth?: string | null
  conversationId?: string | null
}): string {
  const chatLink = input.conversationId
    ? `[Open the chat](/viva?thread=${input.conversationId})`
    : ''

  if (input.journalTag === 'wobble') {
    const parts: string[] = []
    const wobble = (input.wobbleSummary || input.content || '').trim()
    if (wobble) parts.push(`**The Wobble**\n\n${wobble}`)
    if (input.clarity?.trim()) parts.push(`**What Became Clear**\n\n${input.clarity.trim()}`)
    if (input.chosenTruth?.trim()) parts.push(`**What I Choose**\n\n${input.chosenTruth.trim()}`)
    if (chatLink) parts.push(`**From This Conversation**\n\n${chatLink}`)
    return parts.join('\n\n')
  }

  const body = input.content.trim()
  if (chatLink) {
    return body
      ? `${body}\n\nFrom this conversation: ${chatLink}`
      : `From this conversation: ${chatLink}`
  }
  return body
}
