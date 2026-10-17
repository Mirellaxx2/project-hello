import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { signIn, signOut, getCurrentSession } from "@/services/auth";
import { createSaleDraft } from "@/services/sales";
import {
  Activity, ArrowUpRight, Bell, Boxes, CalendarDays, Check, ChevronDown,
  CircleDollarSign, ClipboardList, CreditCard, Download, ExternalLink, FileBarChart,
  Headphones, LayoutDashboard, LifeBuoy, Menu, MessageCircle, Package, Plus, Search,
  Settings, ShieldCheck, ShoppingBag, Sparkles, Users, Wallet, X, Zap
} from "lucide-react";

type Section = "Dashboard" | "Vendas" | "Live Pix" | "Notificações" | "Clientes" | "Produtos" | "Entregas" | "Mensagens automáticas" | "Relatórios" | "Configurações";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Vendas", icon: ShoppingBag },
  { label: "Live Pix", icon: Zap },
  { label: "Notificações", icon: Bell },
  { label: "Clientes", icon: Users },
  { label: "Produtos", icon: Package },
  { label: "Entregas", icon: Boxes },
  { label: "Mensagens automáticas", icon: MessageCircle },
  { label: "Relatórios", icon: FileBarChart },
  { label: "Configurações", icon: Settings },
] as const;

const metrics = [
  { label: "Vendas hoje", icon: ShoppingBag, value: "—", note: "Aguardando conexão", tone: "pink" },
  { label: "Faturamento hoje", icon: CircleDollarSign, value: "—", note: "Dados não conectados", tone: "purple" },
  { label: "Faturamento do mês", icon: Wallet, value: "—", note: "Dados não conectados", tone: "blue" },
  { label: "Pix confirmados", icon: ShieldCheck, value: "—", note: "Live Pix não configurado", tone: "green" },
];

const pageCopy: Record<Exclude<Section, "Dashboard">, { title: string; subtitle: string; icon: typeof ShoppingBag; empty: string }> = {
  "Vendas": { title: "Suas vendas", subtitle: "Acompanhe pedidos, pagamentos e entregas em um só lugar.", icon: ShoppingBag, empty: "Suas vendas aparecerão aqui depois que o banco de dados estiver conectado." },
  "Live Pix": { title: "Integração Live Pix", subtitle: "Configure e acompanhe eventos de pagamento com segurança.", icon: Zap, empty: "Conecte o Live Pix pelo backend para receber eventos reais de pagamento." },
  "Notificações": { title: "Central de notificações", subtitle: "Veja atualizações importantes do seu negócio.", icon: Bell, empty: "Você ainda não tem notificações. Eventos reais aparecerão aqui após a integração." },
  "Clientes": { title: "Seus clientes", subtitle: "Organize contatos e acompanhe o histórico de compras.", icon: Users, empty: "Nenhum cliente cadastrado. Seus clientes aparecerão aqui quando forem registrados." },
  "Produtos": { title: "Catálogo de produtos", subtitle: "Gerencie os produtos e serviços da sua loja.", icon: Package, empty: "Seu catálogo está vazio. Cadastre produtos quando o banco estiver conectado." },
  "Entregas": { title: "Central de entregas", subtitle: "Organize pedidos pagos e acompanhe cada etapa.", icon: Boxes, empty: "Nenhuma entrega aguardando. As vendas pagas aparecerão aqui após a integração." },
  "Mensagens automáticas": { title: "Mensagens automáticas", subtitle: "Prepare modelos e acompanhe mensagens enviadas aos clientes.", icon: MessageCircle, empty: "Configure um provedor oficial de mensagens para ativar os envios." },
  "Relatórios": { title: "Relatórios", subtitle: "Analise faturamento, vendas e desempenho do negócio.", icon: FileBarChart, empty: "Seus relatórios serão gerados com dados reais após conectar o banco." },
  "Configurações": { title: "Configurações", subtitle: "Gerencie conexões, segurança e preferências do sistema.", icon: Settings, empty: "Configure as integrações necessárias para colocar o Vendas Mih em produção." },
};

function EmptyState({ title, description, icon: Icon = ClipboardList }: { title: string; description: string; icon?: typeof ClipboardList }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={24} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const [active, setActive] = useState<Section>("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [toast, setToast] = useState("");
  const [period, setPeriod] = useState("Últimos 7 dias");
  const [saleName, setSaleName] = useState("");
  const [saleProduct, setSaleProduct] = useState("");
  const [saleValue, setSaleValue] = useState("");

  const filteredNav = useMemo(() => navigation.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())), [search]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3600);
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSupabaseConfigured) {
      try {
        await createSaleDraft({
          customer_name: saleName.trim(),
          product_name: saleProduct.trim(),
          amount: Number(saleValue),
        });
        setShowSaleModal(false);
        setSaleName("");
        setSaleProduct("");
        setSaleValue("");
        notify("Venda registrada como pagamento pendente no banco de dados.");
        return;
      } catch (error) {
        notify(error instanceof Error ? error.message : "Não foi possível salvar. Confira sua sessão e as políticas do banco.");
        return;
      }
    }
    setShowSaleModal(false);
    setSaleName("");
    setSaleProduct("");
    setSaleValue("");
    notify("Rascunho preparado apenas nesta sessão. Configure o Supabase para salvar a venda permanentemente.");
  }

  function selectPage(label: string) {
    setActive(label as Section);
    setMobileOpen(false);
  }

  return (
    <div className="mih-app">
      {mobileOpen && <button className="mobile-scrim" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} />}
      <aside className={"sidebar " + (mobileOpen ? "sidebar-open" : "")}>
        <div className="brand">
          <div className="brand-mark"><span>M</span><i /></div>
          <div><div className="brand-name">vendas <b>mih</b></div><div className="brand-caption">PAINEL DE CONTROLE</div></div>
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
        </div>
        <div className="workspace-switch">
          <div className="workspace-avatar">M</div>
          <div className="workspace-text"><strong>Shop Mih</strong><span>Plano proprietário</span></div>
          <ChevronDown size={15} className="muted-icon" />
        </div>
        <div className="nav-label">MENU PRINCIPAL</div>
        <div className="nav-search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar página..." aria-label="Buscar página" /></div>
        <nav className="main-nav">
          {filteredNav.map(({ label, icon: Icon }) => (
            <button key={label} className={"nav-item " + (active === label ? "nav-active" : "")} onClick={() => selectPage(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === "Notificações" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card"><div className="support-icon"><Headphones size={17} /></div><strong>Precisa de ajuda?</strong><p>Veja como configurar sua loja.</p><button onClick={() => notify("Central de ajuda: configure primeiro as integrações em Configurações.")}>Acessar central <ExternalLink size={13} /></button></div>
          <button className="nav-item logout-item" onClick={onSignOut}><LifeBuoy size={18} /><span>Sessão e acesso</span></button>
          <div className="profile-row"><div className="profile-avatar">M</div><div className="profile-info"><strong>Proprietária</strong><span>Shop Mih</span></div><button className="icon-button" aria-label="Opções do perfil" onClick={() => selectPage("Configurações")}><Settings size={17} /></button></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button><div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div></div>
          <div className="topbar-actions"><div className="system-status"><span className="status-pulse" /> Ambiente não conectado</div><button className="icon-button notification-button" aria-label="Notificações" onClick={() => selectPage("Notificações")}><Bell size={19} /><i /></button><div className="top-avatar">M</div></div>
        </header>

        <div className="page-content">
          {active === "Dashboard" ? (
            <>
              <div className="welcome-row">
                <div><div className="eyebrow"><Sparkles size={13} /> VISÃO GERAL DA LOJA</div><h1>Seu negócio, <span>em foco.</span></h1><p>Acompanhe o desempenho da Shop Mih em um só lugar.</p></div>
                <button className="primary-button" onClick={() => setShowSaleModal(true)}><Plus size={17} /> Nova venda</button>
              </div>
              <div className="integration-alert"><div className="alert-icon"><ShieldCheck size={19} /></div><div className="alert-copy"><strong>Vamos preparar sua loja para operar</strong><p>Os dados ainda não estão conectados. Configure o Supabase e o Live Pix para acompanhar vendas e pagamentos reais.</p></div><button onClick={() => selectPage("Configurações")}>Configurar agora <ArrowUpRight size={15} /></button><button className="alert-dismiss" aria-label="Dispensar aviso" onClick={(e) => e.currentTarget.closest(".integration-alert")?.classList.add("alert-hidden")}><X size={16} /></button></div>
              <div className="section-heading"><div><h2>Resumo do negócio</h2><p>Indicadores atualizados a partir dos dados conectados</p></div><button className="filter-button" onClick={() => notify("Os filtros de período serão aplicados quando houver dados reais.")}><CalendarDays size={15} /> Hoje <ChevronDown size={14} /></button></div>
              <div className="metrics-grid">
                {metrics.map(({ label, icon: Icon, value, note, tone }) => <div className="metric-card" key={label}><div className="metric-top"><span>{label}</span><div className={"metric-icon " + tone}><Icon size={18} /></div></div><div className="metric-value">{value}</div><div className="metric-foot"><span className="metric-neutral"><Activity size={13} /> {note}</span></div></div>)}
              </div>
              <div className="analytics-grid">
                <section className="panel revenue-panel"><div className="panel-header"><div><h2>Visão de faturamento</h2><p>Entradas confirmadas ao longo do tempo</p></div><button className="filter-button" onClick={() => setPeriod(period === "Últimos 7 dias" ? "Últimos 30 dias" : "Últimos 7 dias")}>{period} <ChevronDown size={14} /></button></div><div className="chart-placeholder"><div className="chart-grid-lines"><span /><span /><span /><span /></div><div className="chart-empty"><div className="chart-empty-icon"><Activity size={22} /></div><strong>Seu gráfico começa aqui</strong><p>Assim que os pagamentos confirmados forem registrados, você verá seu faturamento neste gráfico.</p></div><div className="chart-xlabels"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div></div></section>
                <section className="panel pix-panel"><div className="panel-header"><div><h2>Status dos pagamentos</h2><p>Visão geral das transações</p></div><div className="panel-mini-icon"><CreditCard size={17} /></div></div><div className="payment-empty"><div className="donut"><div className="donut-inner"><Wallet size={21} /><span>—</span></div></div><strong>Nenhuma transação conectada</strong><p>Os pagamentos serão organizados por status após configurar o Live Pix.</p></div><div className="payment-legend"><div><i className="legend-pink" />Confirmados <b>—</b></div><div><i className="legend-gray" />Pendentes <b>—</b></div><div><i className="legend-red" />Cancelados <b>—</b></div></div></section>
              </div>
              <section className="panel recent-panel"><div className="panel-header"><div><h2>Vendas recentes</h2><p>Acompanhe os pedidos mais recentes da sua loja</p></div><button className="text-button" onClick={() => selectPage("Vendas")}>Ver todas <ArrowUpRight size={15} /></button></div><div className="table-wrap"><table><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>PRODUTO</th><th>VALOR</th><th>PAGAMENTO</th><th>ENTREGA</th></tr></thead><tbody><tr><td colSpan={6}><EmptyState title="Ainda não há vendas" description="Suas vendas aparecerão aqui assim que você receber seus primeiros pagamentos." icon={ShoppingBag} /></td></tr></tbody></table></div></section>
              <div className="bottom-cards"><button className="quick-card" onClick={() => selectPage("Live Pix")}><div className="quick-icon pink-bg"><Zap size={19} /></div><div><strong>Conectar Live Pix</strong><span>Receba eventos de pagamento confirmados</span></div><ArrowUpRight size={17} /></button><button className="quick-card" onClick={() => selectPage("Mensagens automáticas")}><div className="quick-icon violet-bg"><MessageCircle size={19} /></div><div><strong>Configurar mensagens</strong><span>Prepare o fluxo de entrega para clientes</span></div><ArrowUpRight size={17} /></button><button className="quick-card" onClick={() => selectPage("Produtos")}><div className="quick-icon blue-bg"><Package size={19} /></div><div><strong>Organizar catálogo</strong><span>Prepare seus produtos e serviços</span></div><ArrowUpRight size={17} /></button></div>
            </>
          ) : (
            <PageSection active={active} onNotify={notify} onCreate={() => setShowSaleModal(true)} />
          )}
          <footer className="app-footer"><span>© 2026 Vendas Mih</span><span><i /> Seus dados devem permanecer protegidos.</span><button onClick={() => selectPage("Configurações")}>Central de configurações</button></footer>
        </div>
      </main>

      {showSaleModal && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowSaleModal(false); }}><section className="sale-modal" role="dialog" aria-modal="true" aria-labelledby="sale-title"><div className="modal-top"><div className="modal-icon"><Plus size={20} /></div><button className="icon-button" onClick={() => setShowSaleModal(false)} aria-label="Fechar"><X size={19} /></button></div><h2 id="sale-title">Preparar nova venda</h2><p>Preencha os dados para preparar um rascunho. Nenhum pagamento será confirmado por esta tela.</p><form onSubmit={saveDraft}><label>Nome do cliente<input value={saleName} onChange={(e) => setSaleName(e.target.value)} placeholder="Ex.: Maria Silva" required /></label><label>Produto ou serviço<input value={saleProduct} onChange={(e) => setSaleProduct(e.target.value)} placeholder="Ex.: Produto personalizado" required /></label><label>Valor (R$)<input type="number" min="0.01" step="0.01" value={saleValue} onChange={(e) => setSaleValue(e.target.value)} placeholder="0,00" required /></label><div className="modal-note"><ShieldCheck size={16} /><span>Este rascunho não será salvo no banco até a integração com Supabase ser configurada.</span></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowSaleModal(false)}>Cancelar</button><button type="submit" className="primary-button"><Check size={16} /> Preparar rascunho</button></div></form></section></div>}
      {toast && <div className="toast"><Check size={17} /><span>{toast}</span><button onClick={() => setToast("")} aria-label="Fechar aviso"><X size={15} /></button></div>}
    </div>
  );
}

function PageSection({ active, onNotify, onCreate }: { active: Section; onNotify: (message: string) => void; onCreate: () => void }) {
  if (active === "Dashboard") return null;
  const copy = pageCopy[active as Exclude<Section, "Dashboard">];
  const Icon = copy.icon;
  return (
    <div className="subpage">
      <div className="welcome-row"><div><div className="eyebrow"><Icon size={13} /> VENDAS MIH / {active.toUpperCase()}</div><h1>{copy.title}</h1><p>{copy.subtitle}</p></div>{active === "Vendas" || active === "Produtos" || active === "Clientes" ? <button className="primary-button" onClick={onCreate}><Plus size={17} /> {active === "Vendas" ? "Nova venda" : active === "Produtos" ? "Novo produto" : "Novo cliente"}</button> : null}</div>
      {active === "Live Pix" ? <div className="integration-detail panel"><div className="integration-detail-icon"><Zap size={24} /></div><div className="integration-detail-main"><span className="connection-pill"><i /> Não conectado</span><h2>Conexão com Live Pix</h2><p>A integração precisa ser feita no servidor para proteger suas credenciais. Nenhum pagamento será marcado como confirmado sem validação real do evento.</p><div className="setup-steps"><div><span>01</span><div><strong>Configurar credenciais no backend</strong><small>Use variáveis de ambiente seguras; nunca coloque tokens no navegador.</small></div></div><div><span>02</span><div><strong>Configurar webhook oficial</strong><small>Validar assinatura e rejeitar eventos inválidos ou repetidos.</small></div></div><div><span>03</span><div><strong>Testar antes de produção</strong><small>Confirmar a integração com eventos de teste suportados pelo provedor.</small></div></div></div><button className="primary-button" onClick={() => onNotify("Para ativar o Live Pix, configure as credenciais e o webhook no backend primeiro.")}>Ver requisitos <ArrowUpRight size={16} /></button></div><div className="integration-side"><div><ShieldCheck size={20} /><strong>Validação segura</strong><span>Confirmação no servidor</span></div><div><Activity size={20} /><strong>Eventos em tempo real</strong><span>Após configurar o webhook</span></div><div><Check size={20} /><strong>Proteção contra duplicidade</strong><span>Idempotência por transação</span></div></div></div> : active === "Configurações" ? <div className="settings-grid"><div className="panel settings-panel"><div className="settings-title"><div className="quick-icon pink-bg"><ShieldCheck size={19} /></div><div><h2>Integrações e segurança</h2><p>Conexões necessárias para operar em produção</p></div></div>{[{name:"Supabase Auth + PostgreSQL",desc:"Login, banco de dados e políticas de acesso",state:"Pendente"},{name:"Live Pix",desc:"Eventos oficiais e validação de pagamentos",state:"Pendente"},{name:"Mensagens oficiais",desc:"WhatsApp Business Platform ou canal escolhido",state:"Pendente"},{name:"Realtime",desc:"Atualização instantânea de notificações e painel",state:"Pendente"}].map((item) => <div className="setting-line" key={item.name}><div><strong>{item.name}</strong><span>{item.desc}</span></div><span className="pending-tag">{item.state}</span></div>)}</div><div className="panel security-note"><div className="security-shield"><ShieldCheck size={23} /></div><h2>Segurança em primeiro lugar</h2><p>Não compartilhe chaves secretas no frontend. Configure segredos apenas no backend e ative políticas RLS antes de armazenar dados de clientes.</p><button className="secondary-button" onClick={() => onNotify("Checklist de segurança exibido. A configuração técnica ainda precisa ser feita.")}> <ShieldCheck size={15} /> Revisar checklist</button></div></div> : <div className="panel generic-empty"><EmptyState title={active === "Notificações" ? "Tudo tranquilo por aqui" : "Nenhum registro encontrado"} description={copy.empty} icon={Icon} />{active === "Mensagens automáticas" && <button className="secondary-button" onClick={() => onNotify("O envio automático será ativado após configurar o provedor oficial e o consentimento do contato.")}>Ver requisitos de envio <ArrowUpRight size={15} /></button>}{active === "Relatórios" && <button className="secondary-button" onClick={() => onNotify("Não é possível exportar relatórios sem dados reais no banco.")}><Download size={15} /> Exportar CSV</button>}</div>}
      <div className="subpage-footnote"><ShieldCheck size={15} /> O painel não utiliza transações fictícias. Integrações e dados persistentes ainda precisam ser configurados.</div>
    </div>
  );
}


/** Login gate: the dashboard is rendered only after Supabase confirms a session. */
export default function Index() {
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    getCurrentSession()
      .then((current) => { if (mounted) setSession(current); })
      .catch(() => { if (mounted) setSession(null); })
      .finally(() => { if (mounted) setCheckingSession(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, current) => {
      if (mounted) setSession(current);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível entrar. Confira seu e-mail e senha.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setSession(null);
    } catch {
      setErrorMessage("Não foi possível encerrar a sessão. Tente novamente.");
    }
  }

  if (checkingSession) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b090d", color: "#f8f4f8", fontFamily: "Inter, system-ui, sans-serif" }}>Carregando acesso seguro…</div>;
  }

  if (session) return <Dashboard onSignOut={handleSignOut} />;

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "radial-gradient(ellipse at top, #321326 0%, #100b12 42%, #08070a 100%)", color: "#f8f4f8", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: "420px", boxSizing: "border-box", padding: "36px", border: "1px solid #382334", borderRadius: "24px", background: "rgba(20, 14, 22, .96)", boxShadow: "0 24px 80px rgba(0,0,0,.38)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px" }}>
          <div style={{ width: "46px", height: "46px", display: "grid", placeItems: "center", borderRadius: "14px", background: "linear-gradient(135deg, #f472b6, #be185d)", color: "#fff", fontWeight: 900, fontSize: "22px" }}>M</div>
          <div><div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-.7px" }}>vendas <span style={{ color: "#f472b6" }}>mih</span></div><div style={{ marginTop: "3px", color: "#a99aa8", fontSize: "10px", letterSpacing: "2px" }}>ACESSO DA PROPRIETÁRIA</div></div>
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: "26px", letterSpacing: "-.6px" }}>Entre na sua conta</h1>
        <p style={{ margin: "0 0 26px", color: "#b8aab8", fontSize: "14px", lineHeight: 1.6 }}>Faça login para acessar seu painel de vendas e informações da Shop Mih.</p>
        {!isSupabaseConfigured ? (
          <div style={{ padding: "14px", borderRadius: "12px", border: "1px solid #7c3f61", background: "#2a1424", color: "#f9a8d4", fontSize: "13px", lineHeight: 1.6 }}>
            O login está bloqueado até configurar o Supabase. Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> nas variáveis de ambiente do site e habilite o Supabase Auth.
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: "grid", gap: "16px" }}>
            <label style={{ display: "grid", gap: "8px", color: "#e7dce7", fontSize: "13px", fontWeight: 600 }}>E-mail
              <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #493448", borderRadius: "10px", background: "#100c12", color: "#fff", outlineColor: "#f472b6" }} />
            </label>
            <label style={{ display: "grid", gap: "8px", color: "#e7dce7", fontSize: "13px", fontWeight: 600 }}>Senha
              <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #493448", borderRadius: "10px", background: "#100c12", color: "#fff", outlineColor: "#f472b6" }} />
            </label>
            {errorMessage && <p role="alert" style={{ margin: 0, color: "#fda4af", fontSize: "13px", lineHeight: 1.5 }}>{errorMessage}</p>}
            <button disabled={submitting} type="submit" style={{ marginTop: "4px", padding: "14px", border: 0, borderRadius: "10px", background: submitting ? "#8c3d68" : "linear-gradient(90deg, #db2777, #ec4899)", color: "white", fontSize: "14px", fontWeight: 800, cursor: submitting ? "wait" : "pointer" }}>{submitting ? "Entrando…" : "Entrar no painel"}</button>
          </form>
        )}
        <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #30232f", color: "#958695", fontSize: "11px", lineHeight: 1.6 }}>Área restrita. O cadastro público não está disponível; crie/autorize usuários pelo painel de autenticação do Supabase.</div>
      </section>
    </main>
  );
}


// Register the root page with TanStack Router. Without this export, the generated
// route tree imports an undefined route and the preview falls through to 404.
export const Route = createFileRoute("/")({
  component: Index,
});
