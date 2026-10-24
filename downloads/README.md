# APK de demonstração

[Baixar agitta-demo-0.1.1.apk](https://github.com/Haicks/agitta/raw/refs/heads/main/downloads/agitta-demo-0.1.1.apk)

Se o navegador não iniciar o download, abra o arquivo no GitHub e use **Download raw file** (ícone de download). Se o repositório for privado, entre na conta do GitHub que tem acesso a ele.

O arquivo tem aproximadamente 3,5 MB, usa assinatura de desenvolvimento e requer Android 7.0/API 24 ou superior. A versão **0.1.1 / código 101** corrige a compatibilidade com WebViews antigos. Foi instalada e testada em emulador Android 11, com WebView 83, incluindo login visual, feed, detalhes, publicação e salvos. Não houve teste em aparelho físico.

Se você já instalou a versão 0.1.0, abra o novo arquivo e escolha **Atualizar**. A assinatura é a mesma; não é necessário desinstalar nem apagar os dados da demonstração. O nome com versão evita baixar a cópia antiga do cache. O arquivo `agitta-demo-debug.apk` continua disponível como alias da versão atual.

Abra **Explorar demonstração** para navegar por eventos fictícios e publicar dados locais. O login com contas compartilhadas exige conectar um Supabase hospedado e gerar outro APK; esse backend não está incluído na demonstração.

O APK corresponde ao código do commit `e42146a84834419c227d181300a0dfab0baa5434`. O hash está em [SHA256SUMS](SHA256SUMS). Para verificar em Linux:

```sh
cd downloads
sha256sum -c SHA256SUMS
```

Ao gerar uma nova versão, atualize o APK, o hash e a referência do código juntos. Não coloque chaves administrativas no pacote.
