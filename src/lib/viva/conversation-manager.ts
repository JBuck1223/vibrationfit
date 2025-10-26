// src/lib/viva/conversation-manager.ts
import { SupabaseClient } from '@supabase/supabase-js'

export interface ConversationTurn {
  id?: string
  cycle_number: number
  viva_prompt: string
  user_response?: string
  created_at?: string
}

export interface ConversationSession {
  category: string
  session_id: string
  turns: ConversationTurn[]
  isComplete: boolean
}

/**
 * Manages VIVA conversation storage and retrieval
 */
export class ConversationManager {
  private supabase: SupabaseClient
  private userId: string

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase
    this.userId = userId
  }

  /**
   * Creates a new conversation session for a category
   */
  async createSession(category: string): Promise<string> {
    const sessionId = `viva_${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return sessionId
  }

  /**
   * Adds a conversation turn to the session
   */
  async addTurn(
    sessionId: string, 
    category: string, 
    cycleNumber: number, 
    vivaPrompt: string, 
    userResponse?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('viva_conversations')
      .insert({
        user_id: this.userId,
        category,
        session_id: sessionId,
        cycle_number: cycleNumber,
        viva_prompt: vivaPrompt,
        user_response: userResponse
      })

    if (error) {
      console.error('Error saving conversation turn:', error)
      throw new Error('Failed to save conversation')
    }
  }

  /**
   * Updates the user response for the latest turn
   */
  async updateUserResponse(sessionId: string, userResponse: string): Promise<void> {
    const { error } = await this.supabase
      .from('viva_conversations')
      .update({ user_response: userResponse })
      .eq('user_id', this.userId)
      .eq('session_id', sessionId)
      .is('user_response', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error updating user response:', error)
      throw new Error('Failed to update response')
    }
  }

  /**
   * Gets conversation history for a session
   */
  async getSessionHistory(sessionId: string): Promise<ConversationTurn[]> {
    const { data, error } = await this.supabase
      .from('viva_conversations')
      .select('*')
      .eq('user_id', this.userId)
      .eq('session_id', sessionId)
      .order('cycle_number', { ascending: true })

    if (error) {
      console.error('Error fetching conversation history:', error)
      return []
    }

    return data || []
  }

  /**
   * Gets conversation history for a category
   */
  async getCategoryHistory(category: string): Promise<ConversationTurn[]> {
    const { data, error } = await this.supabase
      .from('viva_conversations')
      .select('*')
      .eq('user_id', this.userId)
      .eq('category', category)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching category history:', error)
      return []
    }

    return data || []
  }

  /**
   * Gets the latest conversation session for a category
   */
  async getLatestSession(category: string): Promise<ConversationSession | null> {
    const { data, error } = await this.supabase
      .from('viva_conversations')
      .select('*')
      .eq('user_id', this.userId)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return null
    }

    const latestTurn = data[0]
    const sessionHistory = await this.getSessionHistory(latestTurn.session_id)

    return {
      category,
      session_id: latestTurn.session_id,
      turns: sessionHistory,
      isComplete: sessionHistory.length >= 3 // Assuming 3 cycles for completion
    }
  }

  /**
   * Checks if a category conversation is complete
   */
  async isCategoryComplete(category: string): Promise<boolean> {
    const session = await this.getLatestSession(category)
    return session ? session.isComplete : false
  }

  /**
   * Gets conversation context for vision generation
   */
  async getConversationContext(category: string): Promise<string> {
    const session = await this.getLatestSession(category)
    if (!session || session.turns.length === 0) {
      return ''
    }

    const context = session.turns
      .map(turn => {
        let context = `VIVA: ${turn.viva_prompt}`
        if (turn.user_response) {
          context += `\nUser: ${turn.user_response}`
        }
        return context
      })
      .join('\n\n')

    return context
  }

  /**
   * Clears conversation history for a category (for testing/reset)
   */
  async clearCategoryHistory(category: string): Promise<void> {
    const { error } = await this.supabase
      .from('viva_conversations')
      .delete()
      .eq('user_id', this.userId)
      .eq('category', category)

    if (error) {
      console.error('Error clearing conversation history:', error)
      throw new Error('Failed to clear history')
    }
  }
}
