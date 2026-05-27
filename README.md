# LeadAnalist

Sistema de gestão de leads com **separação por cargas** (cada importação de planilha é uma carga isolada).

## Login

Acesso protegido em `/login`. Configure no `.env.local`:

```env
AUTH_SECRET="string-aleatoria-minimo-32-caracteres"
ADMIN_EMAIL="seu@email.com"
ADMIN_PASSWORD_HASH="hash-bcrypt"
```

Gerar hash da senha:

```bash
npx tsx scripts/hash-password.ts "sua-senha"
```

## Como funciona

1. Faça login.
2. Importe uma planilha `.xlsx`, `.xls` ou `.csv`.
3. Cada importação cria uma **carga** isolada (Kanban, filtros e gráficos por carga).

## Deploy na Vercel

1. Importe o repositório no [Vercel](https://vercel.com).
2. Adicione as variáveis de ambiente:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Postgres pooler (porta 6543, `pgbouncer=true`) |
| `DIRECT_URL` | Postgres direto (porta 5432) |
| `AUTH_SECRET` | Segredo JWT (32+ caracteres) |
| `ADMIN_EMAIL` | E-mail do administrador |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt da senha |

3. Build: `prisma generate && next build` (já configurado em `vercel.json`).
4. Se o banco estiver vazio, rode localmente: `npm run db:push` apontando para o Supabase.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
# preencha DATABASE_URL, DIRECT_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH
npm run db:push
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).
