**Rodar o Agitta no seu computador**

Para conhecer as telas, você precisa de Node.js, Git e um navegador. A demonstração funciona sem Docker e sem criar conta no Supabase. Os comandos abaixo servem para Windows, macOS e Linux.

1. Instale o [Node.js 24 LTS](https://nodejs.org/en/download) com npm e o [Git](https://git-scm.com/downloads). Reabra o terminal depois da instalação. No Windows, você pode usar o Terminal ou o Prompt de Comando; no macOS e Linux, use o Terminal.
2. Confira as ferramentas:

```sh
node --version
npm --version
git --version
```

3. Escolha a pasta onde quer guardar o projeto e execute:

```sh
git clone https://github.com/Haicks/agitta.git
cd agitta
```

Se já tiver clonado, abra o terminal na pasta existente e use `git pull` para obter as alterações, preservando suas mudanças locais. Não é necessário clonar novamente.

4. Dentro da pasta `agitta`, instale as dependências e inicie o site:

```sh
npm ci
npm run dev
```

5. Copie o endereço exibido pelo Vite e abra no navegador desse computador. A porta padrão é **5173**. Deixe o terminal aberto enquanto usa o site. Clique em **Explorar demonstração** para navegar pelos eventos fictícios, publicar exemplos locais e testar os favoritos.

O site acompanha a aparência do sistema: aparelho no tema escuro usa o visual preto; aparelho no tema claro usa o visual claro. O fundo padrão é preto quando não existe uma preferência clara disponível. Mudar o tema do sistema atualiza o site sem recarregar a página nem apagar um formulário em edição.

Para usar somente a demonstração em um clone novo, não é necessário criar `.env.local`. Os valores de `.env.example` são exemplos e precisam ser substituídos caso você configure um backend.

Para parar o site, pressione **Ctrl+C** no terminal. Para abrir novamente em outro dia, entre na pasta do projeto e execute `npm run dev`. Só repita `npm ci` quando for necessário instalar ou atualizar as dependências; pare o Vite antes e reinicie depois.

**Se quiser criar contas e testar login com banco real local**, instale e inicie o Docker com Compose e, na raiz do projeto, execute:

```sh
npm run backend:start
npm run backend:configure
npm run dev
```

Se o Vite já estiver aberto, pare-o antes com Ctrl+C. O backend local confirma os e-mails automaticamente, sem enviar mensagens. Os dados ficam no banco Docker; os dados da demonstração ficam no navegador.

Para parar o backend, use `npm run backend:stop`. Não apague volumes nem `.tools/supabase-local/` para apenas encerrar os serviços.

Para conferir o site compilado e a PWA, execute `npm run build` e depois `npm run preview`. O endereço exibido usa a porta padrão **4173**. O preview é um servidor local; publicar um site acessível a outras pessoas exige hospedagem HTTPS. Consulte [SETUP.md](SETUP.md) para GitHub Pages e Supabase hospedado.

Se algo não iniciar, confira:

| Situação | Como resolver |
| --- | --- |
| `node`, `npm` ou `git` não encontrado | Instale a ferramenta e reabra o terminal. |
| PowerShell bloqueia `npm.ps1` | Use o Prompt de Comando ou execute `npm.cmd ci` e `npm.cmd run dev`. |
| Erro de arquivo `package.json` não encontrado | Entre na pasta `agitta` antes de executar os comandos. |
| A porta 5173 já está ocupada | Confira se o projeto já está aberto em outro terminal; encerre essa execução se precisar reiniciar. |
| Aviso de contas não conectadas | Use a demonstração ou configure o backend. |
| `.env.local` diferente já existe | Preserve o arquivo e confira qual backend você quer usar; o helper evita sobrescrever sua configuração. |
| HTTP 504 depois de instalar dependências | Pare e reinicie o Vite. |

O endereço local se refere ao computador onde você executou os comandos. Para outras pessoas acessarem e usarem contas pelo telefone, siga as instruções de publicação e conecte um Supabase hospedado.
