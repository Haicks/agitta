**Agitta — relatório geral e contexto para continuar o projeto**

Referência de contexto: 28/10/2026, horário de Brasília. Este documento registra o estado do produto, as decisões tomadas e propostas para os próximos passos. As propostas comerciais e de evolução não representam funcionalidades implementadas nem decisões já aprovadas.

O projeto está no repositório [Haicks/agitta](https://github.com/Haicks/agitta), branch `main`. O último marco funcional conferido para este relatório é `1169484679ae5c443fc65fc1275b5f4513477bb7`, que implementa o tema automático com padrão escuro. Commits documentais posteriores podem existir; use a versão mais recente da `main` e preserve mudanças locais. Não faça reset para esse marco apenas por ele estar citado aqui.

**O objetivo continua sendo ajudar pessoas a descobrir e divulgar eventos em Brasília e no Distrito Federal.** O criador é de Brasília e identificou uma divulgação fragmentada dos eventos locais. A ideia inicial tinha inspiração em um feed de comunidade semelhante ao X/Twitter. O recorte implementado concentra-se em eventos com informações estruturadas, publicação por usuários, descoberta e favoritos.

O público inicial imaginado é de jovens de 15 a 25 anos. Ainda não foram apresentados nesta conversa dados de pesquisa de mercado, base de usuários reais, tráfego, receita, contratos comerciais ou validação de disposição a pagar. Essas informações precisam ser levantadas, não presumidas.

As decisões e preferências que devem acompanhar o projeto são:

- Nome: **Agitta**. Foco inicial em Brasília/DF, com prioridade para uso no celular.
- A tecnologia começou como Cordova/HTML/CSS/JavaScript. O usuário depois pediu explicitamente a conversão para **webapp instalável/PWA**, que é o produto ativo.
- Preservar o trabalho existente; continuar a partir do código atual, sem recriar o aplicativo do zero ou voltar automaticamente para Cordova.
- O visual acompanha o tema do aparelho. A paleta padrão é escura/preta quando não há preferência clara disponível; o tema claro é respeitado quando informado pelo sistema.
- O usuário autorizou commits diretamente no Git. As mudanças realizadas foram enviadas à `main`.
- Comunicação em português, clara, objetiva e com tom jovem, oferecendo instruções executáveis. Não presumir que ferramentas de desenvolvimento estejam instaladas no computador do usuário.
- Antes de decisões técnicas ou estruturais importantes, apresentar de duas a três alternativas com recomendação e consequências. Essa preferência não exige interromper correções rotineiras já autorizadas.
- O usuário quer ver o site real e suas telas, não apenas diagramas ou descrições do código. As capturas atuais estão em `docs/screenshots/` e em [PREVIA_VISUAL.md](PREVIA_VISUAL.md).

O histórico principal está resumido nesta ordem:

| Etapa | Entrega |
| --- | --- |
| Base e ambiente | Estrutura do projeto, Node/npm, Vite, dependências fixadas, documentação e preparação da nuvem; inicialmente com Cordova |
| MVP | Cadastro, login, feed, busca, filtros, detalhes, publicação, favoritos e perfil |
| Protótipo | Demonstração navegável com cinco eventos fictícios e persistência no navegador |
| Backend | Supabase local com Docker, PostgreSQL, Auth, API, migrações e políticas RLS |
| Revisão | Correções de sessão, concorrência, formulários, favoritos, datas e dados locais |
| Android histórico | APKs de demonstração, download corrigido e compatibilidade investigada em emulador |
| Conversão web | PWA, manifesto, ícones, instalação, offline, atualização e build `dist/` |
| Visual e continuidade | CSS do build corrigido, capturas reais, relatórios e instruções de execução |
| Tema automático | Interface clara/escura, contraste nos controles principais, barra do navegador adaptável e preservação de formulário ao trocar tema |

Commits de referência: `469dd79` criou o MVP; `2435fba` reuniu correções de estabilidade; `e42146a` e `806e8d2` pertencem à etapa Android; `c5cb6d9` converteu para PWA; `d7f0475` adicionou o relatório detalhado; `957f1b2` adicionou a prévia visual; `1169484` implementou o tema automático e o guia para computador.

Na etapa Android, o download foi corrigido e a tela vazia foi investigada. Foi reproduzido `Object.hasOwn is not a function` em WebView antigo; foram feitos ajustes de compatibilidade e inicialização Cordova. O APK foi exercitado em emulador Android 11/WebView 83 por CDP, com limitações de emulação por software. Não houve teste em telefone físico. Os arquivos em `downloads/` são históricos e não correspondem à PWA atual. Não instalar SDK Android para tarefas comuns do webapp.

**O produto atual é um MVP funcional, versão 0.2.0, com demonstração e integração real de desenvolvimento.** Seu estado não deve ser confundido com um serviço público já lançado.

| Função | Comportamento atual |
| --- | --- |
| Cadastro e login | Supabase Auth com nome, e-mail e senha; confirmação quando exigida pelo backend |
| Sessão | Persistência no navegador, renovação pelo SDK e logout daquele navegador |
| Feed | Eventos futuros em ordem de realização; consulta inicial de até 100 eventos |
| Busca | Título, descrição, local, endereço e região; ignora acentos e caixa; atua sobre eventos carregados |
| Categorias | Música, Cultura, Gastronomia e Esporte |
| Detalhes | Descrição, autor, horário de Brasília, local, endereço, preço e classificação |
| Mapa | Link externo para busca do endereço no Google Maps; sem GPS ou cálculo de distância |
| Publicação | Evento estruturado; autoria conferida pela sessão e data futura exigida |
| Favoritos | Particulares por usuário, persistidos no banco no modo conectado |
| Perfil | Identificação, favoritos, contagem de publicações carregadas e saída |
| Demo | Cinco exemplos fictícios, publicações e favoritos somente no navegador atual |
| PWA | Instalação nos navegadores compatíveis, cache dos arquivos públicos e atualização escolhida pelo usuário |
| Tema | Preferência do aparelho, fundo escuro como padrão e troca sem recarregar formulários |

Publicações exigem título de 3–100 caracteres, descrição de 10–2.000, local de 2–100, região de 2–60 e endereço de 5–240. O preço aceita R$ 0 a R$ 100.000; zero aparece como grátis. As classificações são Livre, 16 e 18. A classificação é informativa: o aplicativo ainda não verifica idade nem bloqueia conteúdo por idade.

O preço do evento é uma informação de divulgação; não existe checkout ou venda de ingressos no aplicativo. As artes dos cartões são ilustrações da categoria, não upload de fotos dos organizadores. Eventos passados deixam o feed usual, mas não são apagados automaticamente do banco. A contagem de publicações do perfil considera os eventos carregados, não uma consulta estatística completa ao histórico.

No modo demonstração, sair não apaga automaticamente os dados fictícios. Limpar dados do site pode removê-los. Domínio, porta, navegador e aparelho diferentes têm armazenamento separado. Os exemplos vencidos são renovados para manter a demo utilizável, preservando as publicações locais do usuário.

O service worker guarda HTML, CSS, JavaScript, ícones e manifesto. Não guarda respostas de Auth/API nem tokens nesse cache. O SDK de autenticação mantém a sessão no armazenamento do navegador separadamente. A demo pode ser reaberta offline após a primeira carga online do build de produção; login e operações compartilhadas exigem conexão. Não existe fila de publicação real offline nem salvamento automático de rascunho.

O aplicativo avisa quando há atualização e aguarda a escolha do usuário. O clique em atualizar recarrega a página; o usuário deve terminar ou copiar um formulário antes. O service worker não é registrado no servidor de desenvolvimento. A PWA exige contexto seguro para instalação, normalmente HTTPS, com a exceção de localhost para testes.

**As funções abaixo ainda não foram implementadas:** recuperação de senha; edição/exclusão de perfil e conta; edição/cancelamento/exclusão de evento pela interface; fotos; comentários e avaliações; notificações; lembretes; denúncias e painel de moderação; pagamento; destaque patrocinado; assinatura de organizador; métricas comerciais; seguidores de organizadores; filtros próprios por preço/data/região; paginação completa; páginas públicas por evento preparadas para SEO e prévia individual nas redes sociais.

Embora a API permita leitura pública dos eventos, a interface atual abre o feed por uma sessão real ou pela demonstração. Não foi implementado um modo público anônimo com eventos reais. Não confundir classificação etária com avaliação do evento.

**A base técnica é HTML/CSS/JavaScript sem framework de interface, Vite e Supabase.** Dependências atuais: `@supabase/supabase-js` 2.118.0, Vite 8.3.5 e Playwright 1.64.1. O projeto declara Node >=22.12; a preparação e as validações usaram Node 24. Na inspeção deste relatório, o runtime da nuvem era Node 24.19.0 e npm 11.9.0.

| Local | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura, metadados, política de conteúdo e tela inicial de recuperação |
| `src/main.js` | Templates, estado, rotas e ações |
| `src/style.css` | Layout, componentes e paletas clara/escura |
| `src/domain.js` | Regras, datas, busca, escape e formatação |
| `src/data.js` | Adaptadores `liveBackend()` e `demoBackend()` |
| `src/web-app.js` | Instalação, conexão e atualização |
| `public/startup.js` | Recuperação de inicialização e cor da barra do navegador |
| `public/manifest.webmanifest` | Nome, ícones, escopo e abertura da PWA |
| `scripts/web-app.mjs` | Cache versionado dos arquivos públicos após o build |
| `scripts/frontend-config.mjs` | Validação de URL e chave pública |
| `scripts/build-public.mjs` | Build que rejeita backend local para publicação |
| `supabase/migrations/` | Esquema e políticas de acesso |
| `supabase/local/` | Serviços locais em Docker |
| `tests/` e `web-tests/` | Regras, interface e PWA |
| `.github/workflows/pages.yml` | Publicação manual pelo GitHub Actions |

As rotas usam hash: `#login`, `#signup`, `#feed`, `#saved`, `#profile`, `#create` e `#event/identificador`. Isso simplifica hospedagem estática. Um efeito importante é que compartilhamento/SEO individual por evento ainda requer solução: o fragmento depois de `#` não é enviado ao servidor e os robôs de prévia normalmente recebem o HTML inicial genérico.

O banco usa `profiles`, `events` e `saved_events`, com nomes públicos separados dos dados de autenticação. RLS permite publicar com a própria autoria e acessar somente os próprios favoritos. A interface escapa texto de usuários e há uma CSP restrita. Isso não representa uma auditoria completa de segurança ou acessibilidade.

As migrações atuais são `001_initial.sql` e `002_finite_event_dates.sql`; a segunda rejeita datas PostgreSQL não renderizáveis. O backend local guarda checksums de migrações aplicadas. Novas mudanças de esquema devem entrar em novas migrações; não editar uma migração já aplicada para contornar um erro.

O Supabase local inclui PostgreSQL, GoTrue/Auth, PostgREST e Kong. Não é um ambiente de produção nem inclui Studio. A API fica no loopback da máquina, porta 54321. A confirmação local de e-mail é automática e não envia mensagens.

**A configuração do frontend usa apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.** O valor de chave deve ser público anon/publishable. Nunca colocar `service_role`, `sb_secret_`, senhas do banco ou credenciais administrativas no app, no relatório ou na conversa. O validador aceita projetos HTTPS `*.supabase.co` e loopback local de desenvolvimento; custom domains precisam de adaptação explícita. O build público rejeita loopback.

Arquivos `.env.local` e `.tools/supabase-local/` são ignorados pelo Git. As credenciais locais e o volume Docker correspondente precisam ser preservados juntos. Não copiar valores secretos para a nova conversa. Um clone novo não traz esses arquivos nem o banco do computador anterior.

Para conhecer a demo em um computador novo:

```sh
git clone https://github.com/Haicks/agitta.git
cd agitta
npm ci
npm run dev
```

Instalar Node.js 24 LTS e Git antes. Se o repositório já existe, usar a pasta existente, verificar mudanças locais e atualizar com cuidado. Abrir o endereço informado pelo terminal no navegador do próprio computador; porta padrão 5173. Clicar em **Explorar demonstração**. Manter o terminal aberto e parar com Ctrl+C.

Para contas reais locais, com Docker/Compose instalado e iniciado:

```sh
npm run backend:start
npm run backend:configure
npm run dev
```

`backend:start` verifica as APIs e aplica migrações pendentes preservando os dados. `backend:configure` grava somente configuração pública local e recusa sobrescrever uma configuração diferente. Se mudar `.env.local`, reiniciar Vite. Depois de `npm ci`, reiniciar o servidor para evitar dependências otimizadas antigas e HTTP 504. Para parar os serviços, usar `npm run backend:stop`, preservando volumes.

Para conferir produção local:

```sh
npm run build
npm run preview
```

O build fica em `dist/`, e o preview usa porta 4173. Não gerar outro build nessa pasta durante verificações que a usam. `npm run build:public` é o caminho de publicação, com backend hospedado ou as duas variáveis Supabase vazias para demo. `AGITTA_BASE_PATH` define a subpasta; o padrão é `/` e o workflow do repositório usa `/agitta/`.

O usuário está tentando executar no Windows/PowerShell. O último impedimento mostrado foi **`git` não reconhecido**. Foi orientado a instalar Git com `winget install --id Git.Git -e --source winget` ou pelo instalador oficial, reiniciar o terminal/VS Code e conferir `git --version`. Não houve confirmação posterior de que o problema foi resolvido. A instalação local de Node e o funcionamento no computador do usuário também não foram confirmados. Se PowerShell bloquear `npm.ps1`, usar Prompt de Comando ou `npm.cmd`. Se a pasta já tiver `package.json` e o código, não exigir outro clone.

**A última validação funcional registrada é esta, não uma nova execução feita para escrever o relatório:**

| Verificação | Resultado registrado | Referência |
| --- | --- | --- |
| `npm test` | 10 testes passaram | 28/10/2026 |
| `npm run test:e2e` | 17 testes passaram | 28/10/2026 |
| `npm run test:web` | 5 testes passaram | 28/10/2026 |
| Build | Site compilado com CSS, manifesto, ícones e worker | 28/10/2026 |
| `npm run test:live` | 16 verificações reais de Auth/banco/RLS passaram | 27/10/2026 |
| Interface conectada no build | 12 verificações passaram | 27/10/2026 |
| `npm audit` | Zero vulnerabilidades reportadas naquela execução | 27/10/2026 |

São 32 testes de regras/interface/PWA e 28 verificações de integração. A integração não foi repetida na mudança de tema, que não alterou o backend. Não anunciar esses números como uma execução nova sem rodar as suítes.

Os testes de tema conferem contraste de textos/controles principais, mudança sem perda de formulário e recuperação escura. Os de PWA cobrem subpasta, CSS, manifesto, offline escuro, isolamento da API e atualização. O teste de atualização troca bytes do worker na mesma URL, restaura o artefato ao terminar e exige execução sequencial da suíte web, pois modifica o preview compartilhado em `.tools/web-test-dist`.

Os testes conectados recusam projetos hospedados e removem suas próprias contas temporárias. Para navegador, instalar Chromium com `npx playwright install chromium` se não houver um executável disponível. O projeto aceita `/usr/bin/chromium` ou `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

**Não há lançamento público confirmado na conversa.** O workflow Pages existe e roda manualmente após habilitar Settings → Pages → GitHub Actions. Ele testa, compila e publica `dist/`. Um push na `main` não executa automaticamente esse deploy. Para contas públicas, configurar Supabase hospedado e as duas variáveis públicas no GitHub Actions; sem ambas, o resultado é demo.

O ambiente retornou `Forbidden` ao tentar administrar Pages pela API; a consulta ao domínio Pages também foi bloqueada pelo proxy. Isso não prova que o usuário não tenha publicado fora da sessão. Na próxima conversa, verificar o estado atual antes de afirmar que há ou não um site disponível. Nenhum Supabase hospedado, entrega real de e-mails ou instalação da PWA em telefone físico foi validado aqui.

Na inspeção desta passagem de contexto, os servidores das portas 5173 e 4173 não estavam respondendo e o Compose não listou serviços locais ativos. Isso exige reiniciar os serviços quando necessário; não representa uma nova falha funcional identificada. Não é preciso iniciar serviços apenas para ler este relatório.

**A oportunidade de negócio é conectar duas necessidades:** pessoas querem descobrir eventos relevantes a tempo; organizadores querem divulgação local que gere interesse mensurável. A recomendação inicial é manter descoberta e publicação básica gratuitas, e testar receita com organizadores depois de formar oferta real e audiência útil. Essa é uma proposta, não uma política comercial já definida.

Três opções de receita a comparar antes de implementar:

| Modelo | O que poderia ser vendido | Vantagem | Condição e trabalho adicional |
| --- | --- | --- | --- |
| Destaque de eventos e patrocínio local | Campanha por período, categoria ou região, identificada como publicidade | Pode começar com um piloto comercial pequeno | Precisa de audiência relevante, regras de exibição, métricas, cobrança e entrega definida |
| Plano de organizador | Ferramentas recorrentes, calendário, gestão e relatórios agregados | Possibilidade de receita recorrente | Exige uso frequente, benefício contínuo e gestão de assinatura; essas ferramentas não existem hoje |
| Comissão/parceria com ingressos | Encaminhamento ou venda via parceiro, se houver acordo | Receita ligada a uma transação | Depende de parceiro, rastreamento e regras de pagamento/cancelamento; não existe integração atual |

A recomendação para o primeiro experimento é **destaque pago com operação simples**, depois de comprovar interesse de organizadores e usuários. Uma campanha não deve prometer público ou venda garantidos. Conteúdo pago deve ser claramente identificado e seguir as mesmas regras de veracidade, classificação e moderação. Pagamento não deve comprar um selo de verificação ou autorizar informação enganosa.

Hipóteses de preço para entrevistas e teste, não preços aprovados: R$ 49 por campanha de sete dias; em etapa posterior, avaliar R$ 99/mês para organizadores que demonstrem necessidade recorrente. Não implementar os dois modelos automaticamente nem assumir que existe disposição de pagamento. A comissão de ingressos depende de negociação; não inventar taxa ou parceria.

Um exemplo puramente matemático para entender as contas:

| Item hipotético de um mês | Valor |
| --- | --- |
| 30 campanhas a R$ 49 | R$ 1.470,00 de receita bruta |
| Taxa de cobrança suposta de 5% | R$ 73,50 |
| Operação técnica fixa suposta | R$ 300,00 |
| Saldo parcial | R$ 1.096,50 |

Esse saldo é **antes** de impostos, trabalho da equipe, aquisição de clientes, criação de material, suporte, estornos e outros custos. Não é lucro líquido nem previsão. A taxa de 5% e o custo de R$ 300 são suposições didáticas, não cotações de serviços ou valores já contratados. Não há receita atual comprovada. No modelo de ingressos, receita da Agitta seria a comissão contratada, não o valor integral movimentado pelos ingressos.

Ao planejar orçamento, levantar domínio, hospedagem, banco/Auth, e-mails, imagens/armazenamento, monitoramento, cobrança, marketing e horas de curadoria/suporte. Verificar limites e preços atuais dos fornecedores quando houver decisão de contratação. Não assumir que planos gratuitos resolvem custos indefinidamente nem contratar serviços a partir deste relatório.

**A melhoria de produto mais urgente é conseguir uma agenda real, confiável e útil.** Cinco exemplos fictícios servem para validar a interface; o uso contínuo exige eventos reais atualizados. Recomenda-se um piloto territorial ou de categoria com acesso fácil a organizadores, em vez de tentar cobrir todo o DF imediatamente.

Sugestões para esse piloto:

- Escolher um recorte, por exemplo eventos culturais/gratuitos, universitários ou uma pequena seleção de regiões. A escolha depende de acesso e pesquisa, não de uma preferência já aprovada.
- Conversar com cinco a dez organizadores sobre como divulgam hoje, esforço, orçamento e quais resultados consideram úteis.
- Reunir uma agenda inicial verificável, com autorização para materiais de terceiros e origem das informações registrada.
- Convidar cerca de vinte a trinta pessoas para testar tarefas concretas: encontrar um evento adequado, salvar e voltar em outra semana. Esses números são desenho de piloto, não participantes existentes.
- Observar erros, tempo para encontrar um evento, regiões sem oferta, eventos vencidos/cancelados e motivos de abandono.
- Testar uma proposta comercial somente depois de haver uma entrega compreensível. Não há contatos ou campanhas enviados em nome do usuário nesta conversa.

Para aquisição e comunidade, explorar parcerias com produtores locais, coletivos, centros acadêmicos, espaços culturais e estabelecimentos. Conteúdo editorial como agenda semanal pode ajudar a trazer audiência antes de uma rede de usuários existir. Instagram, TikTok e WhatsApp são canais a experimentar, não integrações prontas nem garantia de crescimento.

O diferencial a buscar é relevância local, atualização e confiança: saber o que acontece, quando, onde, para qual público e quanto custa. A plataforma não precisa reproduzir todos os recursos de uma rede social para entregar esse valor. Evitar adicionar muitas funções sem validar se resolvem o problema principal.

Também vale comparar o percurso do usuário em perfis de Instagram, grupos de WhatsApp, plataformas de ingresso e agendas locais: quais informações faltam, quanto tempo leva para encontrar um evento adequado e por que alguém voltaria ao Agitta. Essa pesquisa competitiva ainda não foi realizada; não assumir que os canais existentes não atendem nenhuma parte da necessidade.

**As melhorias de desenvolvimento sugeridas têm esta ordem de prioridade:**

| Prioridade | Proposta | Por que vem nessa etapa |
| --- | --- | --- |
| Primeiro piloto utilizável | Publicação HTTPS, Supabase hospedado, e-mail, recuperação de senha e testes físicos | Permitir uso real e retorno do usuário |
| Confiança e operação | Correção/cancelamento de eventos, denúncia, moderação inicial e fluxo de exclusão de conta/dados | Manter a agenda utilizável e reduzir problemas de suporte |
| Descoberta e aquisição | Avaliar feed público real sem login, compartilhamento por evento e filtros por região/data/preço | Facilitar encontrar e compartilhar algo relevante |
| Crescimento de dados | Paginação e busca no backend; estatísticas de perfil por consulta própria | Superar o limite atual de eventos carregados |
| Qualidade contínua | CI automático em push/PR, acessibilidade ampliada, observabilidade, backup e recuperação testada | Tornar falhas visíveis e mudanças previsíveis |
| Organização interna | Separar templates e responsabilidades de `main.js` à medida que crescer | Facilitar manutenção sem exigir reescrita completa |
| Após validar valor | Fotos, organizadores, notificações, métricas e monetização escolhida | Investir conforme necessidade e benefício demonstrados |

Não há razão técnica demonstrada para migrar agora todo o app para outro framework. Se surgir uma necessidade real de SEO, rotas públicas ou equipe maior, comparar duas ou três alternativas antes de decidir. Melhorias de arquitetura devem preservar os fluxos e testes já existentes.

Para experiência de uso, conferir telas de 320 px, teclado móvel, foco/teclado, leitores de tela, mensagens de erro, estados vazios, conexão lenta, troca de tema e atualização com formulário aberto. A legibilidade de vários controles foi testada, mas a auditoria completa de acessibilidade continua pendente.

Para confiança, operação e privacidade, definir quem pode corrigir/cancelar eventos, como lidar com denúncia, contato de suporte, prazo de resposta e regras de conteúdo. Implementar exclusão de conta e mapear dados coletados/retidos. Como o público inclui menores de 18 anos e a classificação atual é informativa, a política de conteúdo e publicidade precisa orientar as funcionalidades; não assumir bloqueio de idade já existente.

Para identidade e comercial, validar posicionamento, nome, disponibilidade de domínio e eventual registro de marca. Não foi verificada titularidade de marca/domínio. Definir também responsável pela operação, formalização, emissão de documentos e tratamento de cobranças/cancelamentos conforme o modelo escolhido.

Métricas propostas para acompanhar depois de implementar uma coleta adequada: eventos futuros válidos por região/categoria; pessoas que conseguem encontrar um evento; abertura de detalhes; favoritos; cliques no mapa/site de ingresso; retorno semanal; organizadores que voltam a publicar; interessados que aceitam um piloto pago; receita por campanha e custo de operação/aquisição. Nenhuma dessas métricas de negócio está sendo anunciada como já coletada.

Usar dados agregados quando suficientes, distinguir organizador e público, não confundir cliques com presença real e não apresentar identificação individual dos interessados aos anunciantes sem base e transparência adequadas. Visitas sozinhas não comprovam valor comercial.

Um roadmap sugerido, sem prazo contratado:

1. **Retomar e publicar o piloto.** Confirmar execução no Windows, estado do GitHub, backend hospedado e dispositivos. Critério: duas contas conseguem publicar/ver eventos, sair/entrar e manter favoritos privados.
2. **Validar utilidade e abastecimento.** Definir recorte, agenda real e rotina de atualização. Critério: usuários encontram algo relevante e organizadores conseguem publicar com pouco suporte.
3. **Medir e testar receita.** Escolher um modelo e uma oferta simples, com regras claras. Critério: pagamento real por uma entrega acordada e interesse em repetir, sem prometer resultados que não podem ser medidos.
4. **Investir conforme os sinais.** Priorizar ferramentas de organizador, distribuição, automação e infraestrutura usando dados do piloto. Critério: retenção e receita justificam o próximo custo.

**Para levar o projeto a outra conversa, o Git preserva o código; o resumo preserva decisões e contexto.** A nova conversa precisa ter o repositório vinculado ou receber os arquivos. Colar este texto não transfere automaticamente credenciais, `.env.local`, volume Docker, processos, acesso a ferramentas ou todo o histórico desta conversa.

Na nuvem, o checkout é `/workspace/agitta`. Usar o checkout existente e não criar worktree salvo pedido explícito. A configuração de instalação já contempla `npm ci`, backend local, geração de `.env.local` e build. As instruções de início devem reiniciar processos e verificar comportamento; não presumir servidores ativos. A referência do repositório no rascunho da nuvem precisa conter o tema automático e este documento; uma referência anterior a `1169484` não representa esse estado. Salvar rascunho não publica o ambiente. Para reutilizar o snapshot, o usuário deve revisar/salvar e publicar pelo painel; essa operação também não publica o site no Pages.

Documentos para a próxima conversa ler: [README](../README.md), este arquivo, [SETUP.md](SETUP.md), [VALIDATION.md](VALIDATION.md), [RODAR_NO_COMPUTADOR.md](RODAR_NO_COMPUTADOR.md), [PREVIA_VISUAL.md](PREVIA_VISUAL.md) e [RELATORIO_PROJETO.md](RELATORIO_PROJETO.md). O relatório mais antigo é uma fotografia do projeto antes de algumas melhorias; este documento e o código atual prevalecem para a continuidade.

Mensagem sugerida para abrir a próxima conversa:

```text
Quero continuar o Agitta, sem reiniciar o projeto.
Vincule/abra o repositório Haicks/agitta, branch main, e leia
docs/CONTINUIDADE.md, README.md, docs/SETUP.md e docs/VALIDATION.md.

O produto atual é uma PWA versão 0.2.0 em HTML/CSS/JavaScript,
Vite e Supabase. O marco funcional 1169484 já inclui tema automático
com padrão escuro. Use a main atual, que também contém documentação
posterior; preserve alterações locais e não faça reset para esse marco.

Já existem login, cadastro, feed, busca, publicação, favoritos, perfil,
demonstração fictícia, instalação, offline da demo e atualização escolhida.
O backend real foi validado localmente; hospedagem pública, e-mails e
instalação em telefone físico ainda precisam ser confirmados.

Foram registrados 32 testes da app/PWA e 28 verificações de integração.
Não trate esses resultados como execuções novas.

O foco é divulgação de eventos em Brasília/DF para jovens de 15 a 25 anos.
Quero respostas em português, claras, práticas e com tom jovem.
Apresente duas ou três opções antes de decisões técnicas/estruturais
importantes. Já autorizei commits diretos no Git.

As ideias de receita são propostas a validar, sem cobrança implementada:
destaque pago, plano de organizador ou comissão com parceiro de ingressos.

Meu último problema local foi o PowerShell não reconhecer git;
a correção foi orientada, mas ainda não foi confirmada nesta conversa.
Comece conferindo o estado real e esse ponto. Depois recomende o próximo
recorte para publicar e validar o piloto, aproveitando o que já existe.
```
