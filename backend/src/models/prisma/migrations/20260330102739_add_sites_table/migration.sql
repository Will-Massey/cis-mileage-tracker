-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postcode" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "radius" INTEGER NOT NULL DEFAULT 100,
    "first_visit_date" DATETIME NOT NULL,
    "last_visit_date" DATETIME,
    "visit_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "sites_user_id_idx" ON "sites"("user_id");

-- CreateIndex
CREATE INDEX "sites_user_id_is_active_idx" ON "sites"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "sites_user_id_name_key" ON "sites"("user_id", "name");
