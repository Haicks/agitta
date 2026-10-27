**Relatório do Agitta — versão 0.2.0**

Situação conferida em 27/10/2026. Código analisado: commit [`c5cb6d9`](https://github.com/Haicks/agitta/commit/c5cb6d9b7930043ea3e62203d994be98a19ebef3), na branch `main` do repositório [Haicks/agitta](https://github.com/Haicks/agitta).

O Agitta é um aplicativo para descobrir e divulgar eventos de Brasília e do Distrito Federal. A proposta inicial foi uma experiência de comunidade inspirada em um feed social, voltada principalmente a jovens de 15 a 25 anos: alguém descobre um rolê, publica as informações e outras pessoas conseguem encontrá-lo e salvá-lo.

Hoje o projeto tem um **MVP funcional em formato de webapp instalável, também chamado de PWA**. MVP significa a primeira versão utilizável, com as funções centrais para experimentar a ideia. O app abre no navegador, adapta o layout ao celular e ao computador e pode ser adicionado à tela inicial nos navegadores compatíveis.

O código da interface, da integração com o backend e da instalação web já está no Git. Até a última validação, não havia publicação pública confirmada. O projeto está preparado para hospedagem, mas disponibilizar um endereço público e conectar um Supabase hospedado são etapas próprias.

O trabalho aconteceu nesta sequência:

1. **Preparação do projeto e da nuvem.** Foi organizada a base com HTML, CSS, JavaScript e Vite, dependências fixadas no arquivo de lock, configuração de desenvolvimento e instruções reutilizáveis para instalação e início do ambiente. A primeira abordagem incluía Cordova para Android.
2. **Construção do MVP e do protótipo.** Foram implementadas as telas de cadastro, login, feed, detalhes, publicação, favoritos e perfil. Foi criado um modo de demonstração com cinco eventos fictícios, acessível sem cadastro. A integração com Supabase permite autenticação e dados compartilhados quando configurada.
3. **Backend de desenvolvimento.** Foram preparados PostgreSQL, Supabase Auth, PostgREST e Kong em Docker, migrações SQL, criação automática de perfis e políticas de acesso. Foram adicionados comandos para iniciar, configurar, testar e parar esses serviços sem apagar os dados.
4. **Revisão e correções.** Foram corrigidos problemas de restauração de sessão, respostas assíncronas antigas, perda de formulários durante carregamentos, favoritos concorrentes, eventos fora da primeira página, armazenamento local corrompido e validação de datas e configuração.
5. **Etapa Android e APK.** Foram gerados APKs de demonstração, corrigidos os links de download e investigada a tela vazia. A falha de compatibilidade `Object.hasOwn is not a function` foi reproduzida em WebView antigo. A versão 0.1.1 recebeu ajustes de compatibilidade e inicialização Cordova. O APK foi exercitado em emulador Android 11/WebView 83, por CDP; não houve validação em telefone físico. A emulação por software apresentou ANRs e limitações de teclado.
6. **Conversão para webapp.** A versão 0.2.0 removeu a inicialização nativa e as dependências Cordova do projeto ativo. Foram adicionados manifesto, ícones, instalação, cache offline, aviso de conexão, atualização por escolha do usuário e publicação manual pelo GitHub Pages. A saída passou a ser `dist/`.
7. **Correção da entrega visual.** O build anterior de compatibilidade nativa removia a folha de estilo. O build web passou a gerar o CSS corretamente, e a geração do cache recusa um resultado sem HTML ou CSS. Foram verificadas as telas em celular e desktop e produzidas capturas reais do build.

Os APKs em `downloads/` são arquivos históricos da versão Cordova. Eles não recebem as alterações atuais da PWA. Dados de demonstração criados dentro de um APK não migram automaticamente para o navegador, pois cada ambiente usa seu próprio armazenamento.

As capturas disponíveis são [login](screenshots/webapp-login.png), [celular](screenshots/webapp-mobile.png) e [computador](screenshots/webapp-desktop.png). Os eventos mostrados são fictícios.

A estrutura técnica atual funciona assim:

| Componente | Função no projeto |
| --- | --- |
| HTML | Estrutura da página e tela inicial de recuperação |
| CSS | Identidade visual, layout responsivo, formulários e navegação |
| JavaScript | Telas, ações, validações, busca, favoritos e integração |
| Vite 8.3.5 | Servidor de desenvolvimento e geração do site para hospedagem |
| Supabase JS 2.118.0 | Comunicação do aplicativo com autenticação e dados |
| Supabase Auth | Cadastro, login, sessão e logout de contas reais |
| PostgreSQL | Armazenamento de perfis, eventos e favoritos |
| PostgREST | API que permite consultar e gravar dados respeitando permissões |
| Kong | Entrada única para as APIs do backend local |
| Service worker e manifesto | Instalação, arquivos offline e atualização da PWA |
| Playwright | Testes da interface no navegador |
| Git e GitHub | Histórico, código e preparação da publicação |

O frontend usa JavaScript sem um framework de interface como React. O Supabase fornece os serviços de backend; não foi criado um sistema próprio de armazenamento de senhas no JavaScript do app.

Para entender onde os dados ficam, considere estes três modos:

| Modo | Como entrar | Onde ficam os dados | Precisa de Docker? |
| --- | --- | --- | --- |
| Demonstração | Botão **Explorar demonstração** | No navegador/aparelho atual | Não |
| Contas reais em desenvolvimento local | Cadastro ou login, após configurar o backend local | No banco Docker desta máquina | Sim |
| Contas reais para o público | Cadastro ou login, após conectar um projeto hospedado | No Supabase hospedado | Não no dispositivo do usuário |

O mesmo visual é usado nesses modos. O destino dos dados e a forma de autenticação mudam conforme o modo escolhido.

**Cadastro, login e sessão funcionam com o Supabase Auth.** No cadastro, a pessoa informa nome, e-mail e senha. O nome aceita de 2 a 60 caracteres, e a senha exige pelo menos 8. Em um projeto hospedado com confirmação habilitada, o app informa que é necessário confirmar o e-mail. Depois de confirmar, a pessoa volta e entra com e-mail e senha.

O backend local confirma os e-mails automaticamente para facilitar os testes; nenhuma mensagem é enviada. Esse comportamento é exclusivo do desenvolvimento. A entrega de e-mails de um projeto hospedado ainda precisa de configuração e validação.

Uma sessão válida é mantida pelo SDK no armazenamento do navegador, com renovação de token habilitada. Por isso, normalmente não é preciso entrar novamente a cada recarregamento. O logout encerra a sessão daquele navegador; outros dispositivos não são desconectados automaticamente. O modo demonstração não cria uma conta real nem valida senha.

**O feed mostra os próximos eventos.** No modo conectado, a consulta inicial carrega até 100 eventos futuros, do mais próximo para o mais distante. O cartão apresenta autor, região, categoria, título, descrição, arte da categoria, data, horário, local, preço, classificação etária e botão de salvar.

As categorias são Música, Cultura, Gastronomia e Esporte. A busca procura em título, descrição, local, endereço e região; ignora diferenças entre maiúsculas/minúsculas e acentos. Por exemplo, `aguas claras` encontra `Águas Claras`. A categoria e o texto de busca funcionam juntos. A busca atua sobre os eventos carregados, e ainda não existe rolagem infinita para percorrer todos os eventos do banco.

Os horários são interpretados e exibidos no fuso de Brasília. Eventos passados deixam de aparecer nas consultas usuais do feed, mas não são apagados automaticamente do banco. Ainda não há uma tela de histórico de eventos concluídos.

**Os detalhes reúnem as informações do rolê.** Ao tocar em um evento, abre-se uma janela com descrição completa, data, horário, endereço, autor, preço, classificação e ação para salvar. O botão **Abrir no mapa** abre o Google Maps com uma busca pelo endereço informado pelo autor.

O aplicativo ainda não solicita GPS nem calcula distância. As regiões exibidas na interface vêm dos eventos carregados. A classificação etária é uma informação fornecida na publicação; o app ainda não verifica a idade do usuário.

**Publicar significa cadastrar um evento com informações estruturadas.** A pessoa autenticada toca em **Publicar rolê**, preenche o formulário e envia. Na demonstração, o mesmo fluxo cria apenas um evento fictício local.

| Campo | Regra atual |
| --- | --- |
| Título | De 3 a 100 caracteres |
| Descrição | De 10 a 2.000 caracteres |
| Categoria | Música, Cultura, Gastronomia ou Esporte |
| Data e horário | Válidos e no futuro; interpretados no horário de Brasília |
| Local | De 2 a 100 caracteres |
| Região do DF | De 2 a 60 caracteres |
| Endereço | De 5 a 240 caracteres |
| Preço | De R$ 0 a R$ 100.000; zero aparece como **Grátis** |
| Classificação | Livre, 16 ou 18 anos |

A validação rejeita datas inexistentes, horários inválidos, valores negativos e campos incompletos. O preço é informativo; o aplicativo não processa pagamentos nem vende ingressos. O banco também aplica restrições essenciais, incluindo autoria da sessão e data futura na inserção.

Depois de salvar com sucesso, o app abre os detalhes do evento. No modo conectado, a publicação fica no banco e pode ser vista por outras contas que usem o mesmo backend. A versão atual ainda não oferece edição ou exclusão de publicações pela interface.

**Salvar um evento cria um favorito particular.** O primeiro toque em **Salvar rolê** guarda a associação entre usuário e evento; o próximo toque remove. No modo conectado, os favoritos ficam no banco e voltam quando a pessoa entra na mesma conta. Na demonstração, ficam apenas no navegador atual.

As operações de salvar são organizadas em sequência para evitar que toques rápidos deixem a interface com um resultado antigo. Se um favorito futuro estiver fora dos primeiros 100 eventos do feed, o app busca esse evento separadamente. Links diretos para detalhes também podem consultar um evento que não estava no primeiro carregamento.

**O perfil reúne identificação, contagens e saída.** Ele mostra nome, e-mail da própria conta quando conectado, região, quantidade de favoritos e publicações atribuídas ao usuário entre os eventos carregados. Essa contagem de publicações considera o conjunto carregado no feed. Ainda não há edição de perfil, redefinição de senha ou exclusão de conta pela interface.

**A demonstração permite experimentar o produto sem backend.** Ela começa com cinco eventos fictícios e permite navegar, buscar, filtrar, abrir detalhes, publicar, salvar e consultar o perfil de visitante. Os exemplos vencidos são renovados em acessos posteriores para manter o protótipo utilizável, preservando as publicações locais do usuário.

Sair da demonstração volta à tela de entrada e não apaga automaticamente os dados fictícios. Limpar os dados do site pode remover esse conteúdo. Outro navegador, outro aparelho, outro domínio ou outra porta possui armazenamento separado. Assim, uma publicação fictícia feita no desenvolvimento pode não aparecer no preview de produção, mesmo no mesmo computador.

**A instalação web depende do navegador.** O manifesto informa nome, ícones, ponto de entrada e modo de abertura. Em Android com navegador compatível, o botão **Instalar Agitta** pode abrir o convite do navegador. Quando o convite não está disponível, o app mostra instruções. No iPhone/iPad, o fluxo indicado é abrir no Safari e usar **Compartilhar → Adicionar à Tela de Início**.

Em HTTPS e após a primeira abertura online bem-sucedida do build de produção, o service worker guarda os arquivos públicos necessários para reabrir o app: HTML, CSS, JavaScript, ícones e manifesto. O service worker não guarda respostas de autenticação ou do banco nem tokens nesse cache. A persistência da sessão pelo Supabase usa o armazenamento do navegador separadamente.

A demonstração pode continuar offline com seus dados locais. Login e operações compartilhadas exigem conexão; não há fila para enviar publicações reais depois que a internet voltar. Links externos, como o mapa, também dependem de conexão.

Uma versão nova mostra **Nova versão disponível · Atualizar**. O app aguarda o toque, sem recarregar automaticamente um formulário em edição. A atualização escolhida recarrega a página: termine ou copie o formulário antes. Ainda não existe salvamento automático de rascunhos.

O service worker é registrado apenas no build de produção, para não guardar código de desenvolvimento em cache. A instalação exige um contexto seguro, normalmente HTTPS; o navegador permite exceção para localhost em testes locais. O alvo do build é Chrome 83 e Safari 15.4, e o comportamento final nesses aparelhos ainda exige conferência física.

O banco está organizado em três tabelas principais:

| Tabela | O que representa |
| --- | --- |
| `profiles` | Identificador e nome público do autor |
| `events` | Eventos, autoria e informações da publicação |
| `saved_events` | Associação particular entre uma conta e seus favoritos |

As contas e os dados de autenticação ficam no serviço Auth. Ao criar uma conta, uma função no banco cria o perfil. O e-mail não faz parte da tabela pública de perfis.

As políticas de acesso usam **RLS**, que são regras aplicadas pelo banco a cada registro. Elas permitem leitura pública dos eventos e nomes, publicação autenticada com a própria autoria e leitura/gravação/remoção apenas dos próprios favoritos. A interface atual abre o feed por uma sessão real ou pela demonstração; a permissão pública de leitura da API não representa uma tela pública anônima já implementada.

Também foram implementados escape de texto para reduzir risco de execução de HTML enviado por usuários, política de conteúdo do navegador e validação da configuração antes de iniciar ou compilar. Uma chave pública anon/publishable pode entrar no frontend; chaves administrativas `service_role`, `sb_secret_` e senhas do banco não podem.

Para rodar o aplicativo, primeiro escolha se quer apenas conhecer a interface ou usar contas reais. **O caminho mais rápido é a demonstração.** Você precisa de Node.js 24 LTS, npm, um navegador e, para obter o código por clone, Git. O projeto declara Node a partir de 22.12; a preparação e as validações usaram Node 24.

Confira as ferramentas no terminal:

```sh
node --version
npm --version
git --version
```

Em um computador onde o projeto ainda não existe, obtenha-o e entre na pasta:

```sh
git clone https://github.com/Haicks/agitta.git
cd agitta
```

No ambiente de nuvem já preparado, use a pasta existente `/workspace/agitta`; não é necessário clonar de novo nem criar outro worktree. Nos comandos seguintes, o terminal deve estar na raiz do repositório.

Instale e inicie:

```sh
npm ci
npm run dev
```

`npm ci` instala as versões registradas em `package-lock.json`. `npm run dev` inicia o Vite e mantém o terminal ocupado enquanto o app estiver disponível. Abra no navegador do seu computador o endereço informado pelo terminal, na porta padrão **5173**, e toque em **Explorar demonstração**.

Para uma cópia nova usada somente como demo, não é necessário criar `.env.local`. O arquivo `.env.example` contém exemplos de configuração, não valores prontos para autenticar. Caso haja variáveis Supabase configuradas, a demonstração continua acessível pelo botão próprio.

Para parar o servidor, use **Ctrl+C** no terminal. Ao reinstalar dependências, pare e reinicie o Vite; um processo antigo pode tentar carregar dependências otimizadas que foram substituídas.

**Para testar cadastro, login e dados reais na sua máquina**, instale e inicie Docker com suporte a Compose. Confira:

```sh
docker --version
docker compose version
```

Depois, na raiz do repositório:

```sh
npm ci
npm run backend:start
npm run backend:configure
npm run dev
```

`backend:start` prepara os serviços oficiais, aguarda as APIs de autenticação e eventos e aplica as migrações pendentes. `backend:configure` grava em `.env.local` somente a URL e a chave pública do backend local. Ele preserva um arquivo diferente e avisa sobre o conflito, em vez de sobrescrever sua configuração.

Nesse modo, entre em **Criar conta**, preencha os dados e experimente publicar e salvar um evento. Os dados ficam no volume Docker. Encerrar o Vite não apaga essas contas. Em uma sessão futura, basta iniciar novamente o backend e o servidor; só reinstale dependências quando necessário.

Para parar o backend:

```sh
npm run backend:stop
```

Preserve `.tools/supabase-local/` junto com o volume Docker: esse diretório guarda a configuração correspondente aos serviços locais e é ignorado pelo Git. Não é preciso apagar volumes para parar o aplicativo. O backend local é uma instalação de desenvolvimento e não inclui um painel Supabase Studio.

**Para testar o site compilado**, execute:

```sh
npm run build
npm run preview
```

O primeiro comando gera `dist/`; o segundo serve essa pasta na porta padrão **4173**. Esse é o fluxo para conferir o comportamento da PWA em produção local. Abra pelo servidor, usando o endereço exibido; abrir `index.html` por duplo clique não reproduz uma hospedagem web.

O preview é local e não publica o projeto na internet. Também não compartilha automaticamente o armazenamento de uma página aberta na porta 5173. Evite gerar outro build em `dist/` enquanto estiver verificando o preview que usa essa pasta.

**Para disponibilizar contas reais no celular de outras pessoas**, conecte um Supabase hospedado:

1. Crie ou selecione um projeto destinado ao Agitta.
2. Execute no SQL Editor, uma vez cada e na ordem, `001_initial.sql` e `002_finite_event_dates.sql`, de `supabase/migrations/`. Em um banco já preparado, aplique somente as pendentes.
3. Configure o provedor de e-mail/senha, confirmação de e-mail, envio de mensagens, Site URL e redirecionamentos para o endereço final do webapp.
4. Na configuração do frontend, informe `VITE_SUPABASE_URL` com a URL HTTPS do projeto e `VITE_SUPABASE_ANON_KEY` com a chave pública anon/publishable. Em desenvolvimento, use `.env.local`, baseado no exemplo e preservando qualquer arquivo existente.
5. Reinicie o Vite quando mudar variáveis. Para uma versão hospedada, gere e publique outro build: essas variáveis entram nos arquivos distribuídos.

Nunca use valores de exemplo como credenciais reais. O build aceita projetos HTTPS `*.supabase.co`; domínios personalizados exigem ajustar a validação e a política de conteúdo. Os testes locais não comprovam que o envio de e-mail do projeto hospedado funciona.

O backend local usa `127.0.0.1:54321`. No telefone, `127.0.0.1` aponta para o próprio telefone. Por isso, abrir o frontend no celular não torna automaticamente o banco do computador acessível. Para contas compartilhadas nessa situação, use o backend hospedado e publique o frontend em HTTPS.

**A publicação no GitHub Pages já tem um workflow preparado.** Ela é manual e não acontece apenas por fazer commit:

1. Abra [Settings → Pages](https://github.com/Haicks/agitta/settings/pages) e escolha **GitHub Actions** como fonte.
2. Se quiser contas reais, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Settings → Secrets and variables → Actions → Variables**. Use somente valores públicos do Supabase hospedado. Sem ambas as variáveis, a publicação será da demonstração.
3. Abra [Actions → Publicar webapp](https://github.com/Haicks/agitta/actions/workflows/pages.yml), clique em **Run workflow** e selecione `main`.
4. Aguarde os testes, o build, o envio do artefato e o deploy. Use o endereço informado pelo GitHub depois que a publicação concluir com sucesso.

O workflow prepara a base `/agitta/`, instala as dependências, executa os testes e publica a pasta `dist/`. O GitHub Pages hospeda o frontend; o Supabase hospedado fornece autenticação e banco. Não foi confirmada uma URL pública no ambiente: a administração pela API retornou `Forbidden`, e uma consulta ao domínio Pages foi bloqueada pelo proxy. Esses bloqueios não demonstram o estado atual de uma publicação feita manualmente fora da sessão.

Para outra hospedagem estática HTTPS, configure o backend hospedado e use:

```sh
npm run build:public
```

Esse comando rejeita o backend local para evitar publicar um site que tente usar o computador do desenvolvedor. Em um clone sem configuração Supabase, gera a demonstração. Em Bash/Linux/macOS, para gerar deliberadamente uma demo mesmo com configuração local existente, é possível executar:

```sh
VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' npm run build:public
```

Essa sintaxe de variáveis é de Bash; no Windows, use a configuração do ambiente/serviço de build ou o workflow do GitHub. Para hospedagem em uma subpasta, configure `AGITTA_BASE_PATH` no ambiente do build; o padrão é `/`, e o workflow existente usa `/agitta/`. Envie o conteúdo completo de `dist/`, preservando os caminhos. As rotas com `#` dispensam reescrita do servidor.

**Os testes cobrem regras, interface, PWA e integração real.** Os resultados registrados na última validação foram:

| Comando ou verificação | Resultado registrado | Requisito |
| --- | --- | --- |
| `npm test` | 10 testes passaram | Dependências instaladas |
| `npm run test:e2e` | 14 testes passaram | Chromium/Playwright; inicia ou reutiliza Vite na porta 5173 |
| `npm run test:web` | 5 testes passaram | Chromium/Playwright; gera e serve build isolado na porta 4175 |
| `npm run test:live` | 16 verificações passaram | Backend local iniciado |
| `npm run test:live:browser` | 12 verificações passaram; o build de produção foi validado com a variável `BASE_URL` | Backend local e frontend configurado em execução |
| `npm run build` | Site completo gerado | Dependências e configuração válida |
| `npm run build:public` | Demo em subpasta gerada; backend local rejeitado como esperado | Configuração pública apropriada |
| `npm audit` | Nenhuma vulnerabilidade reportada na execução registrada | Consulta ao registro npm |

São **29 testes automatizados de regras/interface/PWA e 28 verificações de integração**. Este relatório documenta as execuções anteriores registradas; a redação do relatório não representa uma nova execução dessas suítes.

Se não houver Chromium disponível, instale o navegador usado pelos testes:

```sh
npx playwright install chromium
```

Depois, execute conforme o que deseja validar:

```sh
npm test
npm run test:e2e
npm run test:web
```

Para integração, com backend iniciado, e com o Vite rodando para o teste de interface:

```sh
npm run test:live
npm run test:live:browser
```

Os testes conectados criam e removem suas próprias contas temporárias e recusam projetos hospedados. Eles verificam autenticação verdadeira, autoria, persistência e isolamento dos favoritos. O teste web usa um build de demonstração isolado em `.tools/web-test-dist`, sem substituir `.env.local` ou o build normal.

O Chromium também foi verificado em perfil comum e retornou zero impedimentos de instalação. Parte dos testes de instalação usa um convite simulado. Não houve instalação física da PWA em Android/iPhone, nem validação de entrega de e-mail ou de um Supabase hospedado. A preparação de um workflow não equivale à sua execução remota.

Os principais arquivos estão distribuídos desta forma:

```text
agitta/
  index.html                  página inicial, metadados e recuperação
  src/
    main.js                   telas, rotas e ações do usuário
    style.css                 visual e adaptação a diferentes telas
    data.js                   Supabase e demonstração local
    domain.js                 regras, busca, datas e formatação
    web-app.js                instalação, conexão e atualização
  public/
    manifest.webmanifest      configuração da PWA
    startup.js                recuperação de falha ao iniciar
    icons/                    ícones de instalação
  scripts/
    web-app.mjs               geração do cache offline versionado
    build-public.mjs          build com proteção para publicação
    start-local-backend.mjs   inicialização dos serviços locais
    configure-local.mjs       configuração pública local
  supabase/
    migrations/               tabelas, restrições e políticas de acesso
    local/                    serviços Docker de desenvolvimento
  tests/                      regras e navegação
  web-tests/                  PWA no build real
  .github/workflows/pages.yml publicação manual
  docs/                       instruções, validação, capturas e relatório
  downloads/                  APKs históricos
  dist/                       site gerado; ignorado pelo Git
```

As rotas principais são `#login`, `#signup`, `#feed`, `#saved`, `#profile`, `#create` e `#event/identificador`. O JavaScript acompanha essas mudanças e atualiza a interface. Os botões de voltar e avançar do navegador foram incluídos nos testes.

Também foi salva uma **configuração reutilizável da nuvem**. O script de instalação executa `npm ci`, inicia o backend, gera a configuração local e faz o build. As instruções de início explicam como reiniciar os serviços, verificar o app e proteger credenciais. Os processos precisam ser iniciados novamente em tarefas futuras. Essa configuração foi salva como rascunho; revisão, salvamento pelo painel e publicação do ambiente são ações separadas. Publicar o ambiente de desenvolvimento também não equivale a publicar o site no GitHub Pages.

Se algo não funcionar, estes são os diagnósticos iniciais úteis:

| Sintoma | O que conferir |
| --- | --- |
| `node` ou `npm` não encontrado | Instalar Node.js 24 LTS e reabrir o terminal |
| Aviso de contas não conectadas | Configurar backend; para conhecer a interface, usar a demonstração |
| Docker não responde | Iniciar Docker e verificar Compose antes de `backend:start` |
| `.env.local` já existe | Preservar o arquivo e verificar a configuração escolhida; o helper evita sobrescrevê-lo |
| HTTP 504 após `npm ci` | Parar e reiniciar o Vite para renovar as dependências otimizadas |
| App sem estilo ou arquivos ausentes | Gerar build novamente e servir a pasta completa; conferir a base da hospedagem |
| Tela de recuperação ao abrir | Repetir com conexão e navegador atualizado; consultar os detalhes exibidos |
| Login funciona no computador, mas falha no celular | Verificar se o build aponta para loopback; usar Supabase hospedado |
| Build público rejeitado | Conferir se há backend local configurado; usar hospedado ou as duas variáveis vazias para demo |
| Demo parece vazia em outro endereço | Conferir navegador, domínio e porta; o armazenamento local é separado por origem |
| Atualização disponível com formulário aberto | Terminar ou copiar o conteúdo antes de tocar em Atualizar |

Continuam planejadas as avaliações e comentários, upload de fotos, notificações, lembretes, filtros próprios por região/preço/data e acompanhamento de organizadores. Também faltam recuperação de senha, edição/exclusão de conteúdo e conta, denúncia/moderação e as definições de termos e privacidade para o lançamento público.

O próximo passo prático para usar com outras pessoas é publicar o frontend em HTTPS, conectar um Supabase hospedado e validar em telefones reais. Antes de disponibilizar para um público maior, o roteiro recomendado é: cadastrar duas contas, confirmar e-mails, publicar com uma, localizar o evento com a outra, salvar em cada conta e conferir que os favoritos continuam particulares após sair e entrar novamente.

As referências complementares são [configuração](SETUP.md), [resultados de validação](VALIDATION.md), [próximas etapas](ROADMAP.md) e o [README principal](../README.md).
