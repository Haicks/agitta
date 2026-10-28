# Agitta

O próximo rolê de Brasília começa aqui. **Webapp instalável (PWA)** em HTML, CSS e JavaScript, com layout para celular e computador e Supabase para contas e eventos compartilhados. Versão **0.2.0**.

O app abre no navegador e pode ser adicionado à tela inicial, sem baixar APK. A versão atual substitui a integração Cordova; os APKs antigos ficam apenas como histórico em `downloads/`.

![Agitta no navegador em tela de computador](docs/screenshots/webapp-desktop.png)

## O que dá para fazer

- Criar conta, entrar com e-mail e senha, confirmar e-mail e sair.
- Descobrir eventos, buscar e filtrar por categoria.
- Consultar horário de Brasília, endereço, classificação etária e mapa.
- Publicar eventos, guardar favoritos e acessar o perfil.
- Explorar uma demonstração navegável com eventos fictícios, sem cadastro.
- Instalar pela opção **Instalar Agitta** ou pelo menu do navegador.
- Reabrir a demonstração sem internet depois do primeiro acesso ao build publicado.
- Acompanhar o tema claro/escuro do aparelho, com fundo preto quando não houver preferência clara disponível.

Login e eventos compartilhados exigem internet e um Supabase configurado. O cache offline guarda somente os arquivos públicos do app; não guarda respostas da API nem tokens. Os dados da demonstração ficam no armazenamento local do navegador. Atualizações pedem um toque em **Atualizar**, sem recarregar formulários automaticamente.

## Rodar

No seu computador, instale Node.js 24 LTS (inclui npm) e Git. Se ainda não tiver o projeto:

```sh
git clone https://github.com/Haicks/agitta.git
cd agitta
```

Na pasta do projeto:

```sh
npm ci
npm run dev
```

Deixe o terminal aberto e acesse no navegador o endereço informado pelo Vite (porta padrão 5173). **Explorar demonstração** funciona sem backend. Veja o [passo a passo para rodar no seu computador](docs/RODAR_NO_COMPUTADOR.md), incluindo Windows e dúvidas comuns. Para contas reais de desenvolvimento, com Docker/Compose:

```sh
npm run backend:start
npm run backend:configure
npm run dev
```

## Build e publicação

```sh
npm run build
npm run preview
```

A pasta `dist/` contém o site completo. Para publicar, use `npm run build:public`, que rejeita um backend apontando para o computador. Hospede todos os arquivos em HTTPS. Sem variáveis Supabase, o site oferece a demonstração; com URL e chave pública de um projeto hospedado, habilita contas compartilhadas.

O [workflow de publicação no GitHub Pages](.github/workflows/pages.yml) está pronto para execução manual. Habilite **Settings → Pages → GitHub Actions** e execute **Actions → Publicar webapp → Run workflow**. O endereço será exibido pelo GitHub após uma publicação bem-sucedida. Veja [o passo a passo](docs/SETUP.md).

## Verificação

```sh
npm test
npm run test:e2e
npm run test:web
npm run test:live
npm run test:live:browser
```

`test:web` testa o build real servido em `/agitta/`, incluindo CSS, manifesto, cache offline e atualização. Os dois testes `live` exigem o backend local; o teste de interface também exige o Vite em execução. Os navegadores usam Playwright; instale Chromium com `npx playwright install chromium` se não houver um disponível.

## Estrutura

```text
src/                         interface, navegação e acesso aos dados
public/                      manifesto, ícones e recuperação de inicialização
scripts/web-app.mjs          geração do cache offline versionado
supabase/migrations/         esquema SQL e políticas de acesso
web-tests/                   testes da PWA no build de produção
tests/                       validação e navegação do aplicativo
.github/workflows/pages.yml  publicação manual no GitHub Pages
dist/                        site gerado; não versionado
```

[Prévia visual das telas](docs/PREVIA_VISUAL.md) · [Relatório completo do projeto](docs/RELATORIO_PROJETO.md) · [Captura mobile](docs/screenshots/webapp-mobile.png) · [Captura desktop](docs/screenshots/webapp-desktop.png) · [Validação](docs/VALIDATION.md) · [Próximas etapas](docs/ROADMAP.md).
