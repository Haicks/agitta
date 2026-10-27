# Validação do webapp 0.2.0

Executada em 27/10/2026 no ambiente Linux com Node 24, Chromium e Docker.

| Verificação | Resultado |
| --- | --- |
| `npm test` | 10 testes de regras, dados locais e proteção das variáveis passaram |
| `npm run test:e2e` | 14 testes de navegação, formulários, sessão, favoritos e recuperação passaram |
| `npm run test:web` | 5 testes da PWA no build real, servido em `/agitta/`, passaram |
| `npm run test:live` | 16 verificações reais de autenticação, dados e RLS passaram |
| `BASE_URL=http://127.0.0.1:4173 npm run test:live:browser` | 12 verificações da interface de produção conectada ao backend local passaram |
| `npm run build:public` | Demonstração em `/agitta/` gerada; backend local rejeitado para publicação |
| `npm run build` | Gerou HTML, JavaScript, CSS, manifesto, ícones e service worker em `dist/` |
| Chromium em perfil comum | `Page.getInstallabilityErrors` retornou lista vazia; sem erros de JavaScript/console |
| `npm audit` | Nenhuma vulnerabilidade reportada |

A suíte da PWA verifica a aparência com CSS carregado e sem transbordamento em celular/desktop, manifesto válido, escopo da subpasta, reabertura offline, favoritos e publicações locais offline, isolamento do cache em relação às APIs, instruções de instalação, convite de instalação e atualização escolhida pelo usuário. Uma versão nova mantém o formulário aberto até a ação do usuário. O teste fecha o formulário antes de acionar a atualização.

Depois de `npm ci`, o servidor Vite já aberto ainda apontava para dependências otimizadas removidas (HTTP 504). A rodada afetada foi interrompida, o servidor reiniciado e a suíte executada novamente. Ao reinstalar dependências, reinicie os servidores.

Os contextos isolados do Playwright usam modo privado; somente a restrição `in-incognito` é desconsiderada na verificação de instalação dessa suíte. Uma verificação adicional em perfil comum do Chromium retornou zero impedimentos de instalação. O convite nativo é simulado em um dos testes; não houve instalação na tela inicial de um telefone físico.

Os testes conectados usam o Supabase local real e removem suas próprias contas temporárias. A confirmação automática é exclusiva desse backend. Entrega de e-mail, projeto Supabase hospedado e instalação em Android/iPhone físicos ainda precisam de validação.

As capturas em `docs/screenshots/webapp-login.png`, `webapp-mobile.png` e `webapp-desktop.png` foram feitas no build de produção; o feed mostrado é a demonstração com eventos fictícios.

A conversão remove a inicialização Cordova e a cadeia Android do projeto ativo. O build anterior com compatibilidade nativa descartava o CSS; o build web agora gera a folha de estilo e recusa gerar cache offline se o HTML ou CSS estiver ausente. Os APKs em `downloads/` são históricos e não correspondem ao webapp atual.

O workflow de GitHub Pages está preparado para execução manual. Esta validação não representa publicação pública: não foi possível administrar Pages pela API disponível no ambiente (`Forbidden`). A ativação em Settings → Pages e a execução do workflow ficam no GitHub. Nenhuma URL pública foi anunciada como disponível.
