# Validação desta versão

Executada em 24/10/2026 no ambiente de desenvolvimento Linux, com Node 24, Chromium e Docker.

| Verificação | Resultado |
| --- | --- |
| `npm test` | 10 testes passaram; nenhum ignorado |
| `npm run test:e2e` | 14 testes passaram; nenhum ignorado |
| `npm run test:android` | 8 verificações passaram no APK instalado em emulador Android 11/API 30, WebView 83.0.4103.120 |
| `npm run test:live` | 16 verificações reais de autenticação, dados e RLS passaram |
| `npm run test:live:browser` | 12 verificações passaram na interface conectada |
| `BASE_URL=http://127.0.0.1:4173 npm run test:live:browser` | As mesmas 12 verificações passaram no build de produção |
| `npm run build` | Build web concluído |
| Reiniciar backend e configurar novamente | Migrações e configuração preservadas |
| Backend em banco novo isolado | Bootstrap, migrações, cadastro e perfil passaram; recursos temporários removidos |
| Cordova Android | Requisitos e compilação debug passaram; APK validado com `apksigner`, SDK mínimo 24 e alvo 35 |
| Proteção do empacotamento | Endpoint local rejeitado; APK de demonstração sem conexão aceito |
| `npm audit` | Nenhuma vulnerabilidade reportada |

Os testes conectados utilizaram serviços reais de desenvolvimento local, não respostas simuladas. As contas temporárias e seus dados foram removidos. A confirmação automática de e-mail é exclusiva desse backend local.

A revisão inclui regressões para restauração lenta de sessão, preservação de formulários durante respostas em segundo plano, saída com armazenamento bloqueado, dados locais corrompidos/vencidos, publicação sem `crypto.randomUUID`, botão voltar do Android, favoritos concorrentes e eventos fora da primeira página. Datas PostgreSQL não renderizáveis são rejeitadas por uma nova migração. A validação de chaves públicas protege o build web e o APK. O comportamento do botão voltar foi simulado no navegador; isso não substitui teste no Android físico.

O APK de demonstração foi compilado com as variáveis Supabase vazias para não apontar o celular ao loopback do computador. A aplicação conectada e o protótipo compartilham a interface; os dados da demonstração são fictícios e ficam no aparelho.

A versão anterior foi instalada em emulador Android 11 (API 30), com WebView 83.0.4103.120, onde foi reproduzida a falha `Object.hasOwn is not a function`. A versão 0.1.1 elimina essa dependência, inclui bundle de compatibilidade e testa a recuperação quando o JavaScript não carrega. O pacote também inclui a lista de plugins necessária ao Cordova e aguarda a inicialização nativa.

O smoke test Android usa CDP para acionar os botões no WebView do aplicativo instalado. Verifica `deviceready`, o arquivo de plugins, a tela de login, o feed com cinco eventos, detalhes, publicação, salvos e saída da demonstração. Não substitui testes de toque, gestos e teclas físicas em um aparelho.

Este ambiente não tem KVM. Durante a emulação por software, o próprio sistema Android apresentou ANRs e comandos de teclado por ADB excederam o prazo. As oito verificações registradas foram concluídas por CDP; a apresentação da janela completa e a interação física ainda precisam de validação em aparelho ou emulador com aceleração.

Não foram executados testes em aparelho físico, entrega de e-mails nem integração com um projeto hospedado. Não há publicação em loja, assinatura de release ou implantação de produção.
