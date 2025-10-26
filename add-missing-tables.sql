-- Add missing tables from production

-- Create assessment_responses table
CREATE TABLE IF NOT EXISTS assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessment_results(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    question_text TEXT,
    category TEXT,
    response_value TEXT NOT NULL,
    response_text TEXT,
    response_emoji TEXT,
    green_line TEXT,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_custom_response BOOLEAN DEFAULT FALSE,
    ai_green_line TEXT,
    custom_response_value TEXT
);

-- Create assessment_insights table
CREATE TABLE IF NOT EXISTS assessment_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessment_results(id) ON DELETE CASCADE,
    insight_type TEXT,
    insight_content TEXT,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create membership_tiers table
CREATE TABLE IF NOT EXISTS membership_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    monthly_vibe_assistant_tokens INTEGER DEFAULT 0,
    monthly_vibe_assistant_cost_limit DECIMAL(10,4) DEFAULT 0,
    price_per_month DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tier_type TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB,
    viva_tokens_monthly INTEGER,
    max_visions INTEGER,
    is_popular BOOLEAN DEFAULT false,
    display_order INTEGER,
    stripe_product_id TEXT,
    stripe_price_id TEXT,
    annual_token_grant INTEGER,
    monthly_token_grant INTEGER,
    billing_interval TEXT
);

-- Create customer_subscriptions table
CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    membership_tier_id UUID REFERENCES membership_tiers(id),
    status TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES customer_subscriptions(id),
    stripe_payment_intent_id TEXT,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    status TEXT,
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create token_usage table
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT,
    model_used TEXT,
    tokens_used INTEGER DEFAULT 0,
    input_tokens INTEGER,
    output_tokens INTEGER,
    cost_estimate DECIMAL(10,4),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create token_transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT,
    token_amount INTEGER,
    balance_before INTEGER,
    balance_after INTEGER,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own assessment responses" ON assessment_responses FOR SELECT USING (
    EXISTS (SELECT 1 FROM assessment_results WHERE id = assessment_id AND user_id = auth.uid())
);

CREATE POLICY "Users can insert their own assessment responses" ON assessment_responses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM assessment_results WHERE id = assessment_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view their own assessment insights" ON assessment_insights FOR SELECT USING (
    EXISTS (SELECT 1 FROM assessment_results WHERE id = assessment_id AND user_id = auth.uid())
);

CREATE POLICY "Membership tiers are viewable by everyone" ON membership_tiers FOR SELECT USING (true);

CREATE POLICY "Users can view their own subscriptions" ON customer_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON customer_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment history" ON payment_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own token usage" ON token_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own token usage" ON token_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own token transactions" ON token_transactions FOR SELECT USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_assessment_responses_assessment_id ON assessment_responses(assessment_id);
CREATE INDEX idx_assessment_insights_assessment_id ON assessment_insights(assessment_id);
CREATE INDEX idx_customer_subscriptions_user_id ON customer_subscriptions(user_id);
CREATE INDEX idx_customer_subscriptions_stripe_customer_id ON customer_subscriptions(stripe_customer_id);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
