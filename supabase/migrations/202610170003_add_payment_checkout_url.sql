-- Add the LivePix checkout URL to each sale so the UI can display the payment link.
alter table public.sales add column if not exists payment_checkout_url text;
