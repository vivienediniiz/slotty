# Publish Posts Edge Function

Esta é uma Edge Function do Supabase que publica posts agendados automaticamente.

## Como funciona

1. Roda a cada 5-10 minutos via Supabase Cron
2. Busca todos os posts com `status = SCHEDULED` e `scheduledFor <= agora`
3. Publica em cada plataforma (Facebook, Instagram, LinkedIn, Threads)
4. Atualiza o status para `PUBLISHED` ou `FAILED`

## Deploy

### Local (testing)

```bash
supabase functions serve
```

### Production

```bash
supabase functions deploy publish-posts
```

## Configurar Cron

1. No Supabase Dashboard
2. Vá para **Edge Functions** → **publish-posts**
3. Clique em **Cron**
4. Configure para rodar a cada 5 minutos:
   ```
   */5 * * * *
   ```

## Variáveis de Ambiente

A função usa automaticamente:
- `SUPABASE_URL` - URL do projeto
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço (já disponível)
- `NEXT_PUBLIC_APP_URL` - URL da app (opcional)

Nenhuma configuração adicional necessária!
