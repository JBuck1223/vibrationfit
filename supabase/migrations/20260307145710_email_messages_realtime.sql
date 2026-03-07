-- Enable Supabase Realtime on email_messages so CRM clients get
-- instant push notifications when replies arrive via the SES inbound webhook.

ALTER PUBLICATION supabase_realtime ADD TABLE public.email_messages;
