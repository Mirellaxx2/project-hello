# Vendas Mih

Painel web responsivo da Shop Mih, com identidade visual escura e rosa, interface em português brasileiro e acesso ao painel protegido por autenticação Supabase.

## Tecnologias

- React + TypeScript
- Vite e TanStack Router
- Tailwind CSS 4
- Supabase Auth e cliente Supabase
- Lucide React

## Executar localmente

Requisitos: Node.js e npm.

```bash
git clone https://github.com/Mirellaxx2/project-hello.git
cd project-hello
npm install
cp .env.example .env.local
npm run dev
```

No Windows PowerShell, caso `cp` não funcione, use:

```powershell
Copy-Item .env.example .env.local
```

## Configurar o login

1. Crie um projeto no Supabase.
2. Em Authentication, habilite o provedor Email.
3. Em Project Settings / API, copie a Project URL e a chave publicável (anon/publishable).
4. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em `.env.local` no ambiente local ou nas variáveis de ambiente do serviço de hospedagem.
5. Crie ou convide a conta autorizada em Supabase Authentication. O site não oferece cadastro público.
6. Reinicie o servidor de desenvolvimento ou faça novo deploy após definir as variáveis.

O painel agora exige uma sessão válida do Supabase para exibir o dashboard. Sem as variáveis do Supabase, o acesso permanece bloqueado e a tela explica a configuração pendente.

## Segurança importante

- Este repositório é público: todo o código versionado pode ser visto por qualquer pessoa.
- Nunca comite senhas, tokens, chaves de serviço ou credenciais de provedores.
- Somente a chave pública/anon do Supabase pode ser usada no frontend.
- Configure Row Level Security (RLS) em todas as tabelas e políticas que restrinjam os dados aos usuários autorizados.
- Para permitir somente a proprietária, controle os usuários permitidos e aplique autorização no banco; ocultar páginas no frontend, sozinho, não protege os dados.
- O login não significa que todas as integrações estão prontas para produção.

## Estado atual

O dashboard inclui navegação e estados vazios para vendas, Live Pix, notificações, clientes, produtos, entregas, mensagens, relatórios e configurações. A tela de login e o encerramento de sessão usam Supabase Auth.

A persistência de vendas depende da configuração do Supabase e das políticas de segurança. As Edge Functions de Live Pix e envio de mensagens ainda são placeholders que retornam HTTP 501; não confirmam pagamentos nem enviam mensagens.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — análise estática
- `npm test` — testes automatizados

Build, lint e testes ainda precisam ser executados antes de considerar o projeto pronto para produção.


## Banco de dados e LivePix

A estrutura inicial está em `supabase/migrations/`. As migrações foram aplicadas ao projeto Supabase conectado. O webhook nunca confia somente no corpo recebido: consulta o pagamento diretamente à API LivePix e compara moeda e valor antes de confirmar uma venda.

### Segredos das Edge Functions

No painel Supabase, abra **Edge Functions → Secrets** e cadastre os seguintes valores no servidor (não no `.env.local`, no frontend ou no GitHub):

- `LIVEPIX_CLIENT_ID`: ID da aplicação criada na conta LivePix.
- `LIVEPIX_CLIENT_SECRET`: segredo privado dessa aplicação.
- `LIVEPIX_SCOPE`: escopos OAuth autorizados na aplicação LivePix, separados por espaço. O padrão no código é `account:read wallet:read webhooks`; confirme no painel LivePix que os escopos também permitem criar e consultar pagamentos.
- `LIVEPIX_REDIRECT_URL`: URL HTTPS para a qual o cliente volta após o checkout.
- `APP_ORIGIN`: origem HTTPS do site publicado, para restringir CORS na função de criação de cobrança.

As variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são disponibilizadas normalmente no ambiente das Edge Functions do Supabase. Nunca publique a chave service-role.

URL de webhook para cadastrar no LivePix: `https://dnbeexvimotigwiilhmc.supabase.co/functions/v1/livepix-webhook`.

Funções implantadas: `livepix-create-payment` (exige sessão autenticada) e `livepix-webhook` (entrada do provedor; verifica o pagamento consultando a API). A integração só poderá ser testada de ponta a ponta depois de cadastrar as credenciais e confirmar os escopos da aplicação LivePix.

Consulte a documentação oficial: https://docs.livepix.gg/api
