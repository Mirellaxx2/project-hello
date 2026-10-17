export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Não foi possível carregar o Vendas Mih</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0c0b10" />
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0c0b10; color: #f8f5fa; }
      * { box-sizing: border-box; }
      body { display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 24px; background: radial-gradient(ellipse at top, #321326 0%, #100b12 42%, #08070a 100%); }
      .card { width: 100%; max-width: 440px; padding: 32px; border: 1px solid #382334; border-radius: 22px; background: rgba(20, 14, 22, .96); text-align: center; box-shadow: 0 24px 80px rgba(0,0,0,.38); }
      .brand { margin: 0 0 24px; font-size: 20px; font-weight: 800; letter-spacing: -.6px; }
      .brand span { color: #f472b6; }
      .mark { display: grid; place-items: center; width: 46px; height: 46px; margin: 0 auto 14px; border-radius: 14px; background: linear-gradient(135deg, #f472b6, #be185d); font-size: 22px; font-weight: 900; }
      h1 { margin: 0 0 10px; font-size: 24px; letter-spacing: -.5px; }
      p { margin: 0 0 24px; color: #b8aab8; font-size: 14px; line-height: 1.65; }
      a { display: inline-flex; justify-content: center; padding: 12px 18px; border-radius: 10px; background: linear-gradient(90deg, #db2777, #ec4899); color: #fff; font-size: 14px; font-weight: 750; text-decoration: none; }
      a:focus-visible { outline: 3px solid #f9a8d4; outline-offset: 3px; }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="mark" aria-hidden="true">M</div>
      <div class="brand">vendas <span>mih</span></div>
      <h1>Não foi possível carregar a página</h1>
      <p>Ocorreu um erro inesperado ao abrir o painel. Tente voltar ao início ou atualizar a página.</p>
      <a href="/">Voltar ao início</a>
    </main>
  </body>
</html>`;
}
