# Publish Posts Edge Function

Publica os posts agendados. Roda periodicamente e processa tudo que já venceu.

## Como funciona

1. Busca posts com `status = SCHEDULED` e `scheduledFor <= agora` (lote de 10)
2. Publica em cada canal conectado
3. Grava `PUBLISHED` ou `FAILED` por canal, com a mensagem de erro quando falha

## O que cada plataforma exige

| Plataforma | Alvo | Observação |
|---|---|---|
| Facebook | Página (`externalId`) | `/{pageId}/photos` com imagem, `/{pageId}/feed` sem. Perfil pessoal não é possível desde a remoção de `publish_actions` (2018) |
| Instagram | Conta Business/Creator (`externalId`) | Fluxo de duas etapas (`/media` → `/media_publish`). **Exige imagem**; só texto não é aceito |
| LinkedIn | URN do membro (`externalId`) | Precisa dos escopos `openid`/`profile` para resolver o URN |
| Threads | `externalId` | Precisa de `threads_content_publish` |

A imagem precisa estar numa URL pública — os servidores da Meta é que a baixam.
As URLs do Vercel Blob atendem isso.

## Deploy

```bash
supabase functions deploy publish-posts --project-ref <PROJECT_REF>
```

## Agendamento

O agendamento **não** é configurado no `config.toml` nem pelo painel de Edge
Functions. Ele vive no banco, com `pg_cron` disparando um HTTP POST via `pg_net`.

Rode uma única vez no **SQL Editor** do Supabase. Substitua `<SERVICE_ROLE_KEY>`
pela chave em Settings → API. **Não** comite a versão preenchida: é um segredo.

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'publish-posts',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/publish-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    )
  );
  $$
);
```

A função está com `verify_jwt = true`, por isso o header `Authorization` é
obrigatório. Sem ele o Cron recebe 401 e nada é publicado.

### Conferir

```sql
-- job registrado?
select jobid, jobname, schedule, active from cron.job;

-- últimas execuções
select status, return_message, start_time
from cron.job_run_details
order by start_time desc
limit 10;
```

## Variáveis de ambiente

Fornecidas automaticamente pelo Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
