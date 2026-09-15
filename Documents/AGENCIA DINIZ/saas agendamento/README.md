# Slotty — MVP

"Seu calendário no lugar certo, na hora certa, sem esforço."

## Stack

- Next.js 14 (App Router) + React + TypeScript
- Tailwind CSS
- Prisma ORM (PostgreSQL)
- NextAuth (CredentialsProvider + Prisma Adapter)

## Como rodar

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL e NEXTAUTH_SECRET
npx prisma migrate dev --name init
npm run dev
```

Acesse `http://localhost:3000` — você será redirecionado para `/login`.

Para testar o login, crie um usuário manualmente (com senha já hasheada em
bcrypt) via Prisma Studio (`npx prisma studio`) ou crie uma rota
`/api/register` simples que use `bcrypt.hash` — não incluída neste MVP para
manter o escopo enxuto.

## Design system

Todas as variáveis de marca vivem em [app/globals.css](app/globals.css), dentro do `:root`:

```css
:root {
  --color-rose-81603: #F4F0E3;
  --gradiente1: linear-gradient(135deg, #B780E7 22.67%, #F282B0 61.38%, #E56BB4 96.48%);
}
```

O [tailwind.config.ts](tailwind.config.ts) referencia essas variáveis (nunca duplica os valores):

- `bg-brand-bg` → fundo global (`var(--color-rose-81603)`)
- `bg-brand-gradient` → aplica o gradiente como background (usado em CTAs)
- `text-gradient-brand` (classe utilitária em `globals.css`, usa `background-clip: text`) → texto com o gradiente
- `font-brand` → `font-family: Quache` com fallback para `system-ui`

Troque os valores das variáveis em um único lugar (`globals.css`) para atualizar a marca em todo o app.

> A fonte "Quache" ainda não tem arquivo. Testando o layout descobrimos que
> `font-family: Quache, ...` sem um `@font-face` que a defina é arriscado:
> o navegador casa "Quache" com qualquer fonte **já instalada no sistema**
> com esse nome — e se coincidir com uma fonte de ícones/dingbats de outro
> app, letras e números viram glifos quebrados silenciosamente (reproduzimos
> esse bug ao testar). Por isso `globals.css` declara um `@font-face`
> "placeholder" que faz "Quache" sempre resolver para fontes de sistema
> seguras (`Segoe UI` / `Helvetica Neue` / `Arial`) em vez de depender da
> sorte. Quando tiver o arquivo real (`.woff2`), troque o `src`:
> ```css
> @font-face {
>   font-family: "Quache";
>   src: url("/fonts/quache.woff2") format("woff2");
>   font-weight: 400 700;
>   font-display: swap;
> }
> ```

## Estrutura

```
app/
  login/page.tsx                     — Tela de login (NextAuth Credentials)
  (dashboard)/layout.tsx             — Shell com navegação lateral
  (dashboard)/connections/page.tsx   — Painel de Conexões
  (dashboard)/schedule/page.tsx      — Painel de Agendamento (3 colunas)
  api/auth/[...nextauth]/route.ts    — Rota do NextAuth
components/
  ui/GradientButton.tsx
  connections/ConnectionCard.tsx
  schedule/ProfileSelector.tsx       — Coluna 1: dropdown de perfis
  schedule/PostTextArea.tsx          — Coluna 1: texto + contador + hashtags/emojis
  schedule/ChannelSelector.tsx       — Coluna 2: ícones das redes
  schedule/MediaDropzone.tsx         — Coluna 2: drag & drop de mídias
  schedule/DateTimePicker.tsx        — Coluna 2: data/hora
  schedule/PreviewPanel.tsx          — Coluna 3: preview ao vivo
  schedule/PlatformIcon.tsx          — Ícones SVG inline (Instagram/Facebook/LinkedIn/Threads)
prisma/
  schema.prisma                      — User, AuthAccount, Session, SocialAccount, Post, PostMedia, PostChannel
lib/
  auth.ts, prisma.ts
types/
  index.ts
```

## Próximos passos sugeridos

- Rotas de API para CRUD de `Post` e `SocialAccount` (hoje o painel de agendamento e conexões usam estado local mockado).
- Fluxo OAuth real por rede social (Instagram Graph API, Facebook Login, LinkedIn, Threads API) para popular `SocialAccount`.
- Job/queue (ex: BullMQ, cron) para efetivamente publicar os posts agendados na `scheduledFor`.
- Upload de mídia para um storage (S3/Cloudinary) em vez de `URL.createObjectURL` (hoje só local, para preview).
