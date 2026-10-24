# APK de demonstração

[Baixar agitta-demo-debug.apk](https://github.com/Haicks/agitta/raw/refs/heads/main/downloads/agitta-demo-debug.apk)

Se o navegador não iniciar o download, abra o arquivo no GitHub e use **Download raw file** (ícone de download). Se o repositório for privado, entre na conta do GitHub que tem acesso a ele.

O arquivo tem aproximadamente 3,4 MB, usa assinatura de desenvolvimento e requer Android 7.0/API 24 ou superior. Sua assinatura e a integridade do ZIP foram verificadas; a instalação em aparelho físico ainda não foi testada.

Abra **Explorar demonstração** para navegar por eventos fictícios e publicar dados locais. O login com contas compartilhadas exige conectar um Supabase hospedado e gerar outro APK; esse backend não está incluído na demonstração.

O APK corresponde ao código do commit `2435fba430f481b29b23622e3c7673e0023b4641`. O hash está em [SHA256SUMS](SHA256SUMS). Para verificar em Linux:

```sh
cd downloads
sha256sum -c SHA256SUMS
```

Ao gerar uma nova versão, atualize o APK, o hash e a referência do código juntos. Não coloque chaves administrativas no pacote.
