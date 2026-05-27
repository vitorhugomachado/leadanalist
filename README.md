# LeadAnalist

Sistema de gestão de leads com **separação por cargas** (cada importação de planilha é uma carga isolada).

## Como funciona

1. Importe uma planilha `.xlsx`, `.xls` ou `.csv` (botão **Importar planilha**).
2. O sistema cria uma carga com o nome do arquivo **sem extensão** (ex.: `leads55.xlsx` → carga **leads55**).
3. Todos os leads ficam vinculados à carga via `batchId` (obrigatório).
4. Leads de cargas diferentes **nunca se misturam** — Kanban, filtros e gráficos sempre filtram por `batchId`.

## Telas

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Resumo consolidado de todas as cargas |
| `/cargas` | Lista de cargas com estatísticas |
| `/cargas/[id]` | Workspace da carga: Kanban, gráficos e lista (somente leads daquela carga) |

## Banco de dados

- Tabela `lead_batches` — cargas de leads
- Campo `Lead.batchId` — FK obrigatória para a carga

## Desenvolvimento

```bash
npm install
npm run db:migrate
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Colunas reconhecidas na planilha

`nome`, `email`, `telefone`, `empresa`, `cidade`, `obs` (e variações em português).
