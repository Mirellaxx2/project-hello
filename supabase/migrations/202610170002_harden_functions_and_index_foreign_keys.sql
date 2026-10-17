-- Harden function search paths, restrict profile-trigger RPC execution, and index foreign keys.
alter function public.guard_payment_confirmation() set search_path = '';
alter function public.set_updated_at() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create index if not exists message_templates_user_id_idx on public.message_templates(user_id);
create index if not exists notifications_sale_id_idx on public.notifications(sale_id);
create index if not exists sales_customer_id_idx on public.sales(customer_id);
create index if not exists sales_product_id_idx on public.sales(product_id);
create index if not exists sent_messages_customer_id_idx on public.sent_messages(customer_id);
create index if not exists sent_messages_sale_id_idx on public.sent_messages(sale_id);
