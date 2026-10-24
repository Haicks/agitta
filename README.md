# Agitta

O próximo rolê de Brasília começa aqui. MVP mobile em **Cordova, HTML, CSS e JavaScript**, com Supabase para contas e dados compartilhados.

[Baixar APK de demonstração para Android](https://github.com/Haicks/agitta/raw/refs/heads/main/downloads/agitta-demo-debug.apk) · [Instruções de download](downloads/README.md)

## O que esta versão inclui

- Cadastro por e-mail e senha, login, confirmação de e-mail e logout.
- Feed de eventos, busca e filtros por categoria.
- Detalhes com data, endereço, classificação etária e localização no mapa.
- Publicação de eventos por usuários autenticados.
- Eventos salvos e perfil.
- Protótipo navegável separado, com eventos **fictícios** e dados locais, acessível por **Explorar demonstração**. A demonstração não cria contas nem publica no Supabase.

As contas usam Supabase Auth. Para desenvolver sem contratar serviços, o projeto inclui um backend local com os serviços oficiais de autenticação e API. Para disponibilizar o app a outras pessoas, conecte um projeto Supabase hospedado. A demonstração funciona sem backend.

## Começar

Use Node.js 24 LTS e npm. Na raiz do repositório:

```sh
npm ci
npm run backend:start
npm run backend:configure
npm run dev
```

O backend local exige Docker com Compose. As contas de desenvolvimento ficam apenas nesta máquina; nele, o e-mail é confirmado automaticamente e nenhuma mensagem é enviada. Abra no navegador o endereço informado pelo Vite. Para hospedagem e Android, siga [Configuração do Supabase e Android](docs/SETUP.md).

```sh
npm test
npm run test:e2e
npm run test:live
npm run test:live:browser
npm run build
```

O build gera `www/`, usado pelo Cordova. Testes de navegador precisam do Chromium indicado em [SETUP](docs/SETUP.md).

## Estrutura

```text
src/                         interface, regras e acesso aos dados
supabase/migrations/         esquema SQL e políticas de acesso
tests/                       testes automatizados
docs/                        configuração e próximas etapas
config.xml                   aplicativo Cordova
www/                         saída gerada; não versionada
```

[Prévia mobile](docs/screenshots/prototipo-mobile.png) · [Validação executada](docs/VALIDATION.md) · [Próximas etapas](docs/ROADMAP.md). Distribuição em loja, assinatura de release, notificações, comentários e avaliações ficam para etapas posteriores.
