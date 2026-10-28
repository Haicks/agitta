# Configuração do Agitta webapp

## Desenvolvimento

Para instalar e executar pela primeira vez no seu próprio computador, siga [Rodar o Agitta no seu computador](RODAR_NO_COMPUTADOR.md).

Use Node.js 24 LTS e npm. No ambiente de nuvem, use o checkout existente em `/workspace/agitta`, sem criar outro worktree.

```sh
npm ci
npm run dev
```

A demonstração abre pelo botão **Explorar demonstração**. Os eventos são fictícios; publicações e favoritos desse modo ficam somente no navegador atual. O service worker é registrado apenas no build de produção, para não guardar código de desenvolvimento em cache.

## Login e dados locais

Use Docker com Compose:

```sh
npm run backend:start
npm run backend:configure
npm run dev
```

O backend inclui PostgreSQL, Supabase Auth, PostgREST e Kong. A inicialização aguarda as APIs e aplica migrações pendentes sem apagar dados. Não altere migrações já aplicadas; adicione outra. A API fica em `127.0.0.1:54321`, disponível somente nesta máquina. O loopback do computador não funciona no telefone.

Credenciais de desenvolvimento são geradas em `.tools/supabase-local/`, ignorado pelo Git. O helper grava somente URL e chave pública em `.env.local`, recusando sobrescrever uma configuração diferente. Preserve esse diretório junto com o volume Docker. Nesse backend, a confirmação de e-mail é automática e nenhuma mensagem é enviada.

```sh
npm run test:live
# Com o Vite iniciado e conectado ao backend local:
npm run test:live:browser
npm run backend:stop
```

Os testes criam e removem suas próprias contas temporárias e recusam destinos hospedados. Parar os serviços não exige apagar os volumes.

## Supabase hospedado

1. Crie um projeto Supabase destinado ao Agitta.
2. Aplique as migrações de `supabase/migrations/` em ordem numérica, uma vez cada: `001_initial.sql` e `002_finite_event_dates.sql`. Em projeto existente, execute somente as pendentes. Preserve RLS.
3. Em Authentication, habilite e-mail/senha, confirmação de e-mail e configure entrega de mensagens. Defina Site URL e redirecionamentos permitidos para a URL final do webapp, incluindo `/agitta/` se usar GitHub Pages. Confirme pelo link recebido e depois entre com e-mail e senha.
4. Para desenvolver, copie `.env.example` para `.env.local` sem substituir um arquivo existente; preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Para publicar pelo GitHub Actions, configure esses mesmos nomes em **Settings → Secrets and variables → Actions → Variables**. Ambas são públicas e entram no JavaScript distribuído.
5. Reinicie Vite após mudar variáveis; para produção, gere e publique outro build.

Use apenas URL HTTPS `*.supabase.co` e chave pública **anon/publishable**. Nunca coloque `service_role`, `sb_secret_`, senha do banco ou credenciais administrativas no frontend. A proteção dos dados depende de RLS. O Vite rejeita configurações incompletas, chaves administrativas e URLs incompatíveis sem imprimir seus valores.

Se a rede da nuvem for restrita, permita o hostname exato do projeto. No aplicativo dos usuários, o navegador se conecta diretamente ao Supabase hospedado.

## Publicar no GitHub Pages

O repositório inclui `.github/workflows/pages.yml`. A publicação é manual, não acontece ao fazer commit.

1. Em **Settings → Pages**, escolha **GitHub Actions** como fonte.
2. Para contas compartilhadas, configure as duas variáveis públicas do Supabase como descrito acima. Sem ambas, será publicado o protótipo de demonstração.
3. Abra **Actions → Publicar webapp → Run workflow** e selecione `main`.
4. O workflow instala dependências, testa a interface e a PWA, gera o build com base `/agitta/`, envia `dist/` e publica. Use a URL exibida na etapa `deploy` somente depois de ela concluir.

Não é necessário instalar Android SDK, Java ou Cordova. O endereço do repositório não é o endereço do aplicativo; a ativação do Pages e a execução do workflow ainda são necessárias.

## Outras hospedagens estáticas

Use todos os arquivos de `dist/` em um serviço HTTPS. Não envie `.env.local`, `.tools/` ou credenciais de administração.

```sh
npm run build:public
```

Esse comando rejeita o backend local, que não funciona no celular nem em um site HTTPS. Deixe as duas variáveis Supabase vazias para gerar somente a demonstração. Para hospedar em uma subpasta, defina `AGITTA_BASE_PATH=/agitta/` no ambiente do build; na raiz, o padrão é `/`. As rotas usam `#`, dispensando reescrita do servidor.

Para ver o build local conectado ao Supabase local, use `npm run build` e `npm run preview`. Esse build é exclusivo para testes nesta máquina. Não gere outro build em `dist/` enquanto o preview estiver sendo testado.

## Instalação, offline e atualização

- Android: abra em Chrome/Edge e toque em **Instalar Agitta** ou na opção de instalação do menu.
- iPhone/iPad: abra no Safari, toque em **Compartilhar → Adicionar à Tela de Início** e, se oferecido, ative **Abrir como App**.
- Computador: use o botão de instalação na barra de endereço ou o menu do navegador.

A disponibilidade da instalação depende do navegador. HTTPS é necessário; localhost é a exceção para testes. O site continua acessível pelo navegador sem instalação. O suporte mínimo considerado pelo build é Chrome 83 e Safari 15.4; a instalação e a aparência final precisam de conferência em aparelhos reais.

Após uma primeira abertura online bem-sucedida, os arquivos públicos ficam disponíveis offline. O modo demonstração permite explorar, salvar e publicar eventos fictícios locais. Contas e dados compartilhados precisam de conexão: não há fila de publicação offline nem cache da API de autenticação/dados. As configurações de sessão e a demonstração continuam usando o armazenamento local do navegador.

Quando houver uma versão nova, **Nova versão disponível · Atualizar** permite aplicá-la. Termine ou copie o formulário antes de tocar: a atualização escolhida recarrega a página. Enquanto você não tocar, o formulário permanece aberto. O cache é isolado por escopo de instalação e versão; sua limpeza não remove os dados locais da demonstração.

## Testes

```sh
npm test
npm run test:e2e
npm run test:web
```

Se necessário, instale Chromium: `npx playwright install chromium`. `test:web` gera um build de demonstração isolado em `.tools/web-test-dist`, serve em `/agitta/` na porta 4175 e testa CSS, instalação, offline, cache e atualização. Não altera `.env.local` nem o build normal.

Antes de abrir para usuários, valide com duas contas em um projeto hospedado: confirmação de e-mail, login, publicação compartilhada, persistência dos favoritos, isolamento entre usuários e RLS. Os testes locais não verificam entrega de e-mail nem a configuração do provedor de hospedagem.
