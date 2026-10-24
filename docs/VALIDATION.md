# Validação desta versão

Executada em 24/10/2026 no ambiente de desenvolvimento Linux, com Node 24, Chromium e Docker.

| Verificação | Resultado |
| --- | --- |
| `npm test` | 6 testes passaram; nenhum ignorado |
| `npm run test:e2e` | 7 testes passaram; nenhum ignorado |
| `npm run test:live` | 14 verificações reais de autenticação, dados e RLS passaram |
| `npm run test:live:browser` | 9 verificações passaram na interface conectada |
| `BASE_URL=http://127.0.0.1:4173 npm run test:live:browser` | As mesmas 9 verificações passaram no build de produção |
| `npm run build` | Build web concluído |
| Reiniciar backend e configurar novamente | Migrações e configuração preservadas |
| Backend em banco novo isolado | Bootstrap, migrações, cadastro e perfil passaram; recursos temporários removidos |
| Cordova Android | Requisitos e compilação debug passaram; APK validado com `apksigner`, SDK mínimo 24 e alvo 35 |
| Proteção do empacotamento | Endpoint local rejeitado; APK de demonstração sem conexão aceito |

Os testes conectados utilizaram serviços reais de desenvolvimento local, não respostas simuladas. As contas temporárias e seus dados foram removidos. A confirmação automática de e-mail é exclusiva desse backend local.

O APK de demonstração foi compilado com as variáveis Supabase vazias para não apontar o celular ao loopback do computador. A aplicação conectada e o protótipo compartilham a interface; os dados da demonstração são fictícios e ficam no aparelho.

Não foram executados testes em aparelho/emulador Android, entrega de e-mails nem integração com um projeto hospedado. Não há publicação em loja, assinatura de release ou implantação de produção.
