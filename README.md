# Vendas Mih

Painel web responsivo para organizar a operação da Shop Mih, com identidade visual escura, rosa vibrante e interface em português brasileiro.

## Tecnologias

- React + TypeScript
- Vite e TanStack Router
- Tailwind CSS 4
- Lucide React
- Recharts está disponível no projeto para gráficos futuros

## Executar localmente

Requisitos: Node.js e npm.

\`\`\`bash
git clone https://github.com/Mirellaxx2/project-hello.git
cd project-hello
npm install
npm run dev
\`\`\`

Abra o endereço local informado pelo Vite no terminal.

## Estado atual

A interface inclui dashboard responsivo, navegação entre seções, estados vazios sem dados inventados, páginas de configuração, orientação de segurança para o Live Pix e um formulário de rascunho de venda que não declara nem registra pagamento.

**Ainda não está pronto para produção.** Autenticação, persistência Supabase, políticas RLS, webhook autenticado do Live Pix, eventos em tempo real e envio oficial de mensagens precisam ser implementados e testados com as contas/credenciais reais da proprietária. Nenhuma chave secreta deve ser colocada no frontend.

## Próximos passos para produção

1. Configurar Supabase Auth, PostgreSQL e políticas RLS.
2. Criar esquema e migrações para clientes, produtos, vendas, pagamentos, entregas, notificações e auditoria.
3. Implementar uma Edge Function/endpoint server-side para eventos Live Pix, conforme a documentação oficial disponível, com validação e idempotência.
4. Adicionar Realtime para atualizar o painel com dados persistidos.
5. Configurar um provedor oficial de mensagens, respeitando consentimento, modelos aprovados e confirmação de status.
6. Executar lint, testes, build e testes de integração antes da publicação.

## Scripts

- \`npm run dev\` — servidor de desenvolvimento
- \`npm run build\` — build de produção
- \`npm run lint\` — análise estática
- \`npm test\` — testes automatizados


## Backend scaffolding added

The `supabase/` directory contains an initial PostgreSQL schema with RLS, a local Supabase configuration, and guarded Edge Function placeholders. The `src/lib` and `src/services` directories contain Supabase setup, auth helpers, CRUD/query services, realtime subscriptions, report helpers, formatting, and delivery/message workflows.

### Connect Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in the project URL and public anon/publishable key.
3. Install dependencies with `npm install`.
4. Apply the migration after reviewing it: `supabase db push` for a linked project, or `supabase db reset` for local development.
5. Enable and test authentication, then sign in before creating records.

### Not yet production-ready

The Live Pix webhook and message-sending Edge Functions intentionally return HTTP 501 until their official provider adapters are implemented and verified. They do not confirm payments or send messages. The remaining UI sections are scaffolds; complete CRUD pages, auth screens/route guards, provider-specific integration, and automated tests still need to be finished.
