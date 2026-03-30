---
name: prisma-orm
description: Database management with Prisma ORM. Use when designing schemas, creating migrations, writing queries, seeding data, or optimizing database performance for PostgreSQL, MySQL, or SQLite.
---

# Prisma ORM

Database toolkit for Node.js and TypeScript.

## Quick Start

```bash
npm install prisma @prisma/client
npx prisma init
```

## Schema Design

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "sqlite", "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  trips     Trip[]
}

model Trip {
  id        String   @id @default(uuid())
  userId    String
  date      DateTime
  miles     Float
  amount    Float
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([date])
}
```

## Migrations

```bash
# Create migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Check status
npx prisma migrate status
```

## CRUD Operations

```javascript
// utils/prisma.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Create
const user = await prisma.user.create({
  data: { email: 'john@example.com', name: 'John' }
})

// Read with relations
const userWithTrips = await prisma.user.findUnique({
  where: { id: userId },
  include: { trips: true }
})

// Update
const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: 'Jane' }
})

// Delete
await prisma.user.delete({ where: { id: userId } })

// List with pagination
const users = await prisma.user.findMany({
  skip: 0,
  take: 10,
  where: { email: { contains: '@example.com' } },
  orderBy: { createdAt: 'desc' }
})
```

## Seeding

```javascript
// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin',
      trips: {
        create: [
          { date: new Date(), miles: 10, amount: 4.5 }
        ]
      }
    }
  })
}

main()
  .catch(e => { throw e })
  .finally(async () => await prisma.$disconnect())
```

```json
// package.json
{
  "scripts": {
    "db:seed": "node prisma/seed.js"
  }
}
```

## Transactions

```javascript
// Atomic operations
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: {...} })
  const trip = await tx.trip.create({ 
    data: { userId: user.id, ... } 
  })
  return { user, trip }
})
```

## Raw Queries

```javascript
// When Prisma can't do it
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email LIKE ${`%${search}%`}
`
```

## Best Practices

1. **Single Prisma instance:** Export from one file, import everywhere
2. **Connection pooling:** Set `connection_limit` in DATABASE_URL
3. **Index frequently queried fields:** `@@index([field])`
4. **Use transactions** for multi-table operations
5. **Soft deletes:** Add `deletedAt` field instead of hard delete

## Environment Variables

```bash
# .env
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
# or SQLite
DATABASE_URL="file:./dev.db"
```
