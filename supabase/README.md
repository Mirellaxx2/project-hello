# Supabase — Vendas Mih

## Local setup

1. Install the Supabase CLI and Docker.
2. Copy `.env.example` to `.env.local` for the frontend's public URL and anon/publishable key.
3. Run `supabase start`.
4. Apply migrations with `supabase db reset` locally or `supabase db push` to a linked project after reviewing the migration.
5. Configure email/password authentication and redirect URLs in the Supabase dashboard.
6. Deploy Edge Functions only after their provider adapters are implemented and tested.

## Secrets

Never put a Supabase service-role key, Live Pix secret, or WhatsApp access token in `VITE_*` variables. Store server secrets in Supabase Edge Function secrets.

## Current limitations

- `livepix-webhook` is a safe placeholder and returns HTTP 501. It does not confirm payments.
- `whatsapp-send` authenticates the user but returns HTTP 501 until an official messaging provider adapter is implemented.
- Review and test RLS policies with a non-owner user before production.
- Do not enable real payment processing until the provider's current official webhook specification and verification method are implemented.
