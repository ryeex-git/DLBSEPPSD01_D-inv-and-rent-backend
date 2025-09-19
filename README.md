# Inventar- & Ausleihverwaltung – Backend (NestJS, Prisma, SQLite)

REST-API für Inventar, Ausleihen und Reservierungen.  
DB mit **Prisma** und **SQLite** (einfach lokal betreibbar). Swagger ist aktiviert.

## Features / Endpunkte (Auszug)

### Items
- `GET /items` – Liste mit Pagination/Filter/Sortierung  
  Query: `page, pageSize, sortBy=name|status|categoryName, sortDir=asc|desc, search, categoryId, status`
- `GET /items/:id` – Detail
- `POST /items` – anlegen
- `PUT /items/:id` – updaten
- `DELETE /items/:id` – entfernen
- `GET /items/:id/history` – Historie (Audit)
- `GET /items/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD`  
  → Array von Zeitspannen:  
  `{ start, end, type: 'LOAN'|'RESERVATION', status?: 'PENDING'|'APPROVED'|'CANCELLED', label? }`

### Reservations
- `GET /reservations` – Liste mit Pagination/Filter/Sortierung  
- `POST /reservations` – anlegen `{ itemId, start, end, note?, userName? }`
- `POST /reservations/:id/approve` – genehmigen (Admin)
- `POST /reservations/:id/cancel` – stornieren (Admin)

### Loans
- `POST /loans/issue` – Ausleihe starten `{ itemId, dueAt, note?, userName? }` (Admin)
- `POST /loans/return` – Rückgabe `{ itemId }` (Admin)

### Categories
- `GET /categories` – alle Kategorien
- `POST /categories` – **anlegen** (Admin) `{ name: string }`
- `DELETE /categories/:id` – **löschen** (Admin)

**Validierung & Verhalten**
- `name` ist Pflicht (min. 2 Zeichen), DB-seitig i. d. R. **unique**.  
- Löschen: Entweder
  - **RESTRICT** (Standard vieler DBs): Löschen schlägt fehl, wenn Items noch referenzieren, **oder**
  - **SET NULL**: `categoryId` der verknüpften Items wird auf `NULL` gesetzt.  
  Die Einstellung erfolgt in `schema.prisma` an der Relation, z. B.:
  ```prisma
  model Item {
    id         Int      @id @default(autoincrement())
    name       String
    categoryId Int?
    category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull) // ← SetNull/Restrict
  }

  model Category {
    id   Int    @id @default(autoincrement())
    name String @unique
    items Item[]
  }
  ```

**Swagger**: Endpunkte sind unter **/api → Categories** dokumentiert.  
**Admin**: `POST` und `DELETE` erfordern den Header `x-admin-pin`.

Beispiele:
```bash
# Liste
curl http://localhost:3000/categories

# Anlegen (Admin)
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" -H "x-admin-pin: 1234" \
  -d '{"name":"Allgemein"}'

# Löschen (Admin)
curl -X DELETE http://localhost:3000/categories/3 -H "x-admin-pin: 1234"
```

### Admin
- `GET /admin/ping` – prüft Admin-PIN (Header), Response: `{ ok: true }`

> **Admin-Prüfung:** Alle Admin-Aktionen erwarten den Header `x-admin-pin: <PIN>`.  
> Der Vergleich erfolgt serverseitig mit `ADMIN_PIN` aus `.env`.

## Tech-Stack

- NestJS
- Prisma ORM
- SQLite (Datei `prisma/dev.db`)
- Swagger (OpenAPI) unter `/api`

## Voraussetzungen

- Node.js **≥ 20**
- npm **≥ 9**

## Setup

```bash
# Pakete installieren
npm install

# .env anlegen
cp .env.example .env
# Inhalte z. B.:
# PORT=3000
# DATABASE_URL="file:./dev.db"
# ADMIN_PIN=1234
# CORS_ORIGIN=http://localhost:4200

# Prisma vorbereiten
npx prisma generate
npx prisma migrate dev --name init
# optional Demodaten
npx ts-node prisma/seed.ts   # oder: npx prisma db seed (falls script hinterlegt)
```

## Entwicklung starten

```bash
npm run start:dev
# API: http://localhost:3000
# Swagger: http://localhost:3000/api
```

## Validierung

Global aktivierte `ValidationPipe` mit `transform: true` + `enableImplicitConversion`.  
Dadurch werden Query-Parameter wie `page=0` korrekt nach `number` konvertiert.

## Datenmodell (Auszug)

- **Item**: `id, name, inventoryNo, status('OK'|'DEFECT'|'OUT'), condition, tagsCsv, categoryId?`
- **Category**: `id, name`
- **Loan**: `id, itemId, issuedAt, dueAt, returnedAt?, note?`
- **Reservation**: `id, itemId, startAt, endAt, status('PENDING'|'APPROVED'|'CANCELLED'), userName?, note?`
- Optionale **Audit-Logs**: `itemId, action, actor, createdAt`

## Beispiel-Requests

```bash
# Items durchsuchen
curl "http://localhost:3000/items?page=0&pageSize=10&search=Ak"

# Reservierung anlegen
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{"itemId":1,"start":"2025-09-16T18:00:00.000Z","end":"2025-09-16T19:00:00.000Z","userName":"user"}'

# Reservierung genehmigen (Admin)
curl -X POST http://localhost:3000/reservations/1/approve \
  -H "x-admin-pin: 1234"

# Ausleihe starten (Admin)
curl -X POST http://localhost:3000/loans/issue \
  -H "x-admin-pin: 1234" -H "Content-Type: application/json" \
  -d '{"itemId":1,"dueAt":"2025-09-30T12:00:00.000Z","note":"Bedarf Team"}'

# Verfügbarkeit
curl "http://localhost:3000/items/1/availability?from=2025-09-15&to=2025-10-06"
```

## Nützliche Dev-Kommandos

```bash
# Prisma Studio (DB-Viewer)
npx prisma studio

# Datenbank neu aufsetzen (Achtung: zerstörerisch)
rm -f prisma/dev.db
npx prisma migrate reset
```
