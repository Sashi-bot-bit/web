-- Homepage content managed from admin. Safe to re-run.
DO $$ BEGIN
  CREATE TYPE "BannerTheme" AS ENUM ('VIOLET', 'DARK', 'LIGHT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "HomeContent" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "announcement" TEXT,
    "announcementLink" TEXT,
    "heroEyebrow" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL,
    "heroHighlight" TEXT NOT NULL,
    "heroSubtitle" TEXT NOT NULL,
    "heroCtaLabel" TEXT NOT NULL,
    "heroImage1" TEXT,
    "heroImage2" TEXT,
    "heroImage3" TEXT,
    "cravingsTitle" TEXT NOT NULL,
    "showCravings" BOOLEAN NOT NULL DEFAULT true,
    "postersTitle" TEXT NOT NULL,
    "restaurantsTitle" TEXT NOT NULL,
    "showHowItWorks" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomeContent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HomeContent_singleton" CHECK ("id" = 1)
);

CREATE TABLE IF NOT EXISTS "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "ctaLabel" TEXT,
    "linkUrl" TEXT,
    "imageUrl" TEXT,
    "theme" "BannerTheme" NOT NULL DEFAULT 'VIOLET',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Banner_dates_ordered" CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "startsAt" < "endsAt")
);
CREATE INDEX IF NOT EXISTS "Banner_isActive_sortOrder_idx" ON "Banner"("isActive", "sortOrder");

-- Default copy (matches the launch design), so the site works before anyone edits it.
INSERT INTO "HomeContent" ("id", "heroEyebrow", "heroTitle", "heroHighlight", "heroSubtitle", "heroCtaLabel", "cravingsTitle", "postersTitle", "restaurantsTitle", "updatedAt")
VALUES (
  1,
  'Hatfield restaurants, delivered to campus',
  'Hungry? Your favourite local food,',
  'brought to campus.',
  'Fried chicken, curries, pizza and more from local Hatfield restaurants. Order before the cutoff, collect at your drop point and pay when you pick up.',
  'Order now',
  'What are you craving?',
  'Offers and news',
  'Restaurants near campus',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
