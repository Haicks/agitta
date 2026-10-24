# Configuração do Agitta

## Desenvolvimento web

Requisitos: Node.js 24 LTS e npm. O ambiente de nuvem já é isolado: utilize o checkout existente; não crie outro worktree para iniciar o aplicativo.

```sh
cd /workspace/agitta
npm ci
npm run dev
```

Fora do ambiente de nuvem, execute os mesmos comandos na raiz onde clonou o repositório. Se o cache padrão do npm não for gravável, use `npm ci --cache /tmp/agitta-npm`.

Na tela inicial, **Explorar demonstração** abre o protótipo navegável sem depender de serviços externos. Os eventos são fictícios, e alterações ficam somente no navegador/aparelho atual. Não use esse modo como prova de autenticação ou persistência no servidor.

## Contas e dados reais: Supabase

### Desenvolvimento local

Use Docker com o plugin Compose. Na raiz do projeto:

```sh
npm run backend:start
npm run backend:configure
npm run dev
```

O primeiro comando sobe PostgreSQL, Supabase Auth (GoTrue), PostgREST e Kong, aguarda as APIs e aplica as migrações uma vez. Uma nova execução preserva contas e eventos no volume Docker. Mudanças em migrações já aplicadas são rejeitadas; adicione outra migração. A API é publicada somente em `127.0.0.1:54321`. Não é uma instalação de produção nem inclui Studio, Storage ou Realtime.

Credenciais locais são geradas em `.tools/supabase-local/`, ignorado pelo Git. `backend:configure` grava **somente URL e chave pública** em `.env.local` e se recusa a sobrescrever configurações diferentes. Não apague `.tools/` mantendo o volume do banco: as credenciais precisam continuar consistentes. A confirmação de e-mail é automática **somente no backend de desenvolvimento**, sem envio de e-mails.

```sh
npm run test:live
# Com o Vite em execução, já conectado à configuração local:
npm run test:live:browser
npm run backend:stop
```

Os testes conectados criam contas temporárias, exercitam autenticação e banco e removem seus próprios dados ao terminar. Eles recusam destinos hospedados. Para reiniciar, use `npm run backend:start`; não remova os volumes para parar o serviço.

### Projeto hospedado

1. Crie um projeto Supabase ou use um existente destinado ao Agitta.
2. No SQL Editor, execute o arquivo completo `supabase/migrations/001_initial.sql`. O esquema cria as tabelas, índices e políticas RLS. Não desative RLS para corrigir erros de acesso.
3. Em Authentication, habilite o provedor de e-mail/senha. Mantenha a confirmação de e-mail habilitada. Configure o Site URL e os redirecionamentos permitidos conforme o endereço usado no desenvolvimento/deploy. Nesta versão, confirme pelo link recebido e depois entre no aplicativo com e-mail e senha; não é necessário abrir uma sessão por deep link.
4. Copie `.env.example` para `.env.local`, sem substituir um arquivo local existente. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e a chave **pública** anon/publishable do projeto.
5. Reinicie o servidor Vite. Para Cordova, gere o build novamente após qualquer mudança dessas variáveis.

Não coloque a chave `service_role`, chaves `sb_secret_`, senha do banco ou credenciais administrativas no frontend. Variáveis `VITE_*` são incorporadas no JavaScript distribuído. A autorização dos dados depende das políticas RLS do SQL, não do sigilo da chave pública.

No ambiente de nuvem, forneça os dois valores em **configurações do ambiente**. Se a rede for restrita, adicione o hostname exato do projeto, por exemplo `seu-projeto.supabase.co`, aos domínios permitidos. A instalação das dependências precisa de `registry.npmjs.org`; o acesso Git usa a autenticação já fornecida pela plataforma.

### Validação de ponta a ponta com Supabase

Após aplicar o SQL e configurar as variáveis:

1. Cadastre uma conta com e-mail válido; confirme o e-mail e faça login.
2. Publique um evento futuro com título, categoria, local, endereço e classificação etária.
3. Atualize o aplicativo e confirme que o evento continua no feed.
4. Salve o evento, faça logout e entre novamente; confira os salvos.
5. Com uma segunda conta, confira o evento compartilhado e que os salvos da primeira conta não aparecem.
6. Confira no Supabase que um cliente sem sessão não consegue inserir eventos ou consultar os salvos de outros usuários.

A validação local não verifica o envio de e-mail, as configurações nem o acesso ao projeto hospedado. Faça esse roteiro antes da distribuição pública.

## Testes e build web

```sh
npm test
npm run test:e2e
npm run build
npm run preview
```

O teste de navegador usa Playwright. Se não houver Chromium disponível no sistema, instale o navegador com `npx playwright install chromium`, preservando a verificação TLS. Consulte o arquivo de configuração do Playwright para a seleção do executável. A saída do build fica em `www/`; dependências, processos em execução e builds gerados não são versionados.

## Android com Cordova

A plataforma está fixada em `cordova-android@14.0.1`:

| Ferramenta | Versão esperada |
| --- | --- |
| Node.js | 24 LTS (plataforma exige pelo menos 20.5) |
| JDK | 17 |
| Android SDK Platform | 35 |
| Android SDK Build Tools | 35.0.0 |
| Gradle | 8.13, utilizado pelo wrapper da plataforma |
| Android mínimo | 7.0 / API 24 |

No ambiente Linux x86_64, o instalador abaixo prepara ferramentas isoladas em `/workspace/.cache/agitta-android`, com downloads oficiais e checksums verificados. Ele aceita as licenças padrão do SDK ao instalar os pacotes. Requer Bash, curl, Python 3, unzip, dpkg-deb e Node. `AGITTA_ANDROID_HOME` pode escolher outro diretório gravável. Em outras plataformas, instale as ferramentas oficiais e configure `JAVA_HOME`, `ANDROID_HOME` e `PATH`.

```sh
npm run android:setup
. scripts/android-env.sh
npm run android:add
npx cordova requirements android
npm run android:prepare
npm run android:build
```

Adicione a plataforma apenas uma vez por checkout. Após um build bem-sucedido, o APK de desenvolvimento fica em `platforms/android/app/build/outputs/apk/debug/`. Para instalar em um aparelho com depuração USB ou emulador configurado, execute `npx cordova run android`.

A preparação web ou a geração dos arquivos da plataforma não provam que o APK foi compilado. Compilação e teste no aparelho exigem a cadeia Android acima. Assinatura de release, publicação em loja e suporte iOS ainda não estão configurados.

O backend local usa loopback e não é acessível por outro aparelho. Para um APK com contas compartilhadas, use a URL HTTPS e a chave pública do projeto hospedado antes do build. Para gerar um APK portátil apenas com a demonstração:

```sh
. scripts/android-env.sh
VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' npm run android:build
```

Esse APK abre as telas de login e permite navegar por **Explorar demonstração**, sem fingir uma autenticação real. Teste a instalação, o teclado e a navegação em um Android físico antes de distribuir.

`android:build` rejeita a configuração local antes de empacotar e aceita somente um projeto HTTPS `*.supabase.co` com chave pública ou a demonstração sem conexão. Domínios personalizados exigem ajustar explicitamente essa validação, a CSP e a allowlist do Cordova.
