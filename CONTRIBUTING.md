# Como contribuir

Obrigado pelo interesse. Este é um projeto pequeno e mantido por uma pessoa só — o processo abaixo existe para tornar a revisão rápida, não para criar burocracia.

## Antes de abrir um PR

Para **correção de bug**, pode mandar direto. Inclua um teste que falhe sem a correção.

Para **feature nova**, abra uma issue antes. Pode ser que o escopo não caiba na proposta do projeto, e é melhor descobrir isso antes de você escrever o código.

## Ambiente

```bash
git clone https://github.com/Samuelf27/node-api-starter.git
cd node-api-starter
npm install
```

## Antes de enviar

```bash
npm test
```

O CI roda o mesmo conjunto a cada push e pull request. PR com CI vermelho não é revisado até ficar verde.

## Commits

Este repositório usa [Conventional Commits](https://www.conventionalcommits.org/pt-br/), com a descrição em português:

```
feat: adiciona validação de inscrição estadual
fix: corrige DV de CPF com entrada mascarada
docs: documenta a suíte de testes
test: cobre caso de borda em lista vazia
chore(deps): atualiza vitest
```

O prefixo importa mais que o idioma — é o que permite ler o histórico e gerar changelog sem trabalho manual.

## O que ajuda a aprovar rápido

- **Um assunto por PR.** Correção e refatoração juntas dobram o tempo de revisão.
- **Teste junto com a mudança.** Sem teste, não há garantia de que o problema não volta.
- **Descrição com o porquê.** O código mostra o *o quê*; a descrição precisa mostrar o *por quê*.
- **Sem dependência nova** sem justificativa. Este projeto valoriza ter poucas.

## Segurança

Vulnerabilidade **não** vai em issue pública. Veja o [SECURITY.md](SECURITY.md).


## Branches

Duas branches permanentes, e só duas:

| Branch | O que é |
| --- | --- |
| **`dev`** | Onde o trabalho acontece. É a branch **padrão** — mande seu PR para cá. |
| **`main`** | O que está publicado (npm / GitHub Pages). Só recebe merge de PR vindo da `dev`. |

**Contribuindo de fora?** Abra o PR contra a `dev`. Como ela é a branch padrão, é
o alvo que o GitHub já sugere.

`main` é protegida: push direto, force push e exclusão estão bloqueados, e todo
merge exige PR. Um PR para `main` vindo de qualquer branch que não seja `dev` é
reprovado por
[`.github/workflows/fluxo-de-branches.yml`](.github/workflows/fluxo-de-branches.yml).

Branch temporária é exceção, não fluxo: nasce de `dev`, volta para `dev`, e é
apagada no merge. Ela nunca fala com `main`.

### Publicar uma versão

```bash
gh pr create --base main --head dev --title "Release: <o que vai sair>"
# com o CI verde, mergeie — e depois traga a main de volta para a dev:
git checkout dev && git merge main && git push origin dev
```

O último passo não é opcional. O merge de promoção cria um commit que só existe na
`main`, e eles acumulam até esconder alguma coisa de verdade no meio do ruído.
