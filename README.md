# snipflow

Um CLI pequeno para guardar e recuperar snippets sem abrir editor, nota, gist ou bloco de texto solto.

A ideia é ser simples: você salva um trecho com um nome, encontra depois pelo nome e copia de volta quando precisar.

## Instalação local

```bash
npm install
npm run build
npm link
```

Depois disso, o comando `snip` fica disponível no terminal:

```bash
snip list
```

Para rodar sem instalar globalmente durante o desenvolvimento:

```bash
npm run dev -- list
```

## Uso rápido

Salvar um snippet direto pelo terminal:

```bash
snip save hello "console.log('hello')"
```

Salvar um snippet que já está no clipboard:

```bash
snip save meu-snippet
```

Salvar um snippet usando pipe:

```bash
cat exemplo.ts | snip save exemplo --stdin
```

Ver o conteúdo sem mexer no clipboard:

```bash
snip show hello
```

Copiar um snippet de volta para o clipboard:

```bash
snip get hello
```

Buscar por nome:

```bash
snip search hel
```

Listar tudo:

```bash
snip list
```

## Exemplo real

```bash
snip save orderform "await fetch('/api/checkout/pub/orderForm').then(r => r.json())"
snip show orderform
snip get orderform
```

Se quiser substituir um snippet que já existe, use `--force`:

```bash
snip save orderform "await fetch('/api/checkout/pub/orderForm').then(r => r.json())" --force
```

## Comandos

```bash
snip save <name> [content]
snip save <name> --stdin
snip save <name> --force
snip get <name>
snip show <name>
snip search <term>
snip list
```

## Onde os snippets ficam salvos?

O arquivo é criado automaticamente em:

```bash
~/.snipflow/snippets.json
```

Cada item salvo tem este formato:

```json
{
  "name": "orderform",
  "content": "await fetch('/api/checkout/pub/orderForm').then(r => r.json())",
  "createdAt": "2026-05-01T00:00:00.000Z"
}
```

## Desenvolvimento

```bash
npm install
npm run dev -- list
npm run check
```

Gerar build:

```bash
npm run build
```

Rodar o build:

```bash
npm start -- list
```
