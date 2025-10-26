-- Create conversation storage table
CREATE TABLE IF NOT EXISTS viva_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    session_id TEXT NOT NULL,
    cycle_number INTEGER NOT NULL,
    viva_prompt TEXT NOT NULL,
    user_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_viva_conversations_user_category ON viva_conversations(user_id, category);
CREATE INDEX IF NOT EXISTS idx_viva_conversations_session ON viva_conversations(session_id);

-- RLS policies
ALTER TABLE viva_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON viva_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON viva_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON viva_conversations
    FOR UPDATE USING (auth.uid() = user_id);
