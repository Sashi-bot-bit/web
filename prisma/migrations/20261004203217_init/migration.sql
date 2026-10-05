-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Allergen" AS ENUM ('CELERY', 'GLUTEN', 'CRUSTACEANS', 'EGGS', 'FISH', 'LUPIN', 'MILK', 'MOLLUSCS', 'MUSTARD', 'TREE_NUTS', 'PEANUTS', 'SESAME', 'SOYA', 'SULPHITES');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('FLAT', 'PERCENT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'NOT_COLLECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAY_ON_DELIVERY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'COLLECTED', 'WAIVED');

-- CreateEnum
CREATE TYPE "CollectMethod" AS ENUM ('CASH', 'CARD');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('SYSTEM', 'CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ContactKind" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "BlockSource" AS ENUM ('AUTO_NO_SHOW', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "phone" TEXT,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "marketingOptInAt" TIMESTAMP(3),
    "anonymisedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricePence" INTEGER NOT NULL,
    "discountedPricePence" INTEGER,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "allergens" "Allergen"[],
    "mayContain" "Allergen"[],
    "allergensConfirmedAt" TIMESTAMP(3),
    "allergensConfirmedBy" TEXT,
    "kcal" INTEGER,
    "spiceLevel" INTEGER NOT NULL DEFAULT 0,
    "portionNote" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietaryTag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DietaryTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemDietaryTag" (
    "menuItemId" TEXT NOT NULL,
    "dietaryTagId" TEXT NOT NULL,

    CONSTRAINT "MenuItemDietaryTag_pkey" PRIMARY KEY ("menuItemId","dietaryTagId")
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderOpensMin" INTEGER NOT NULL,
    "orderClosesMin" INTEGER NOT NULL,
    "deliveryStartsMin" INTEGER NOT NULL,
    "deliveryEndsMin" INTEGER NOT NULL,
    "daysOfWeek" INTEGER[],
    "capacity" INTEGER NOT NULL,
    "closingSoonMinutes" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotRestaurantCap" (
    "slotId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "maxOrders" INTEGER NOT NULL,

    CONSTRAINT "SlotRestaurantCap_pkey" PRIMARY KEY ("slotId","restaurantId")
);

-- CreateTable
CREATE TABLE "SlotOccurrence" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "localDate" DATE NOT NULL,
    "orderOpensAt" TIMESTAMP(3) NOT NULL,
    "orderClosesAt" TIMESTAMP(3) NOT NULL,
    "deliveryStartsAt" TIMESTAMP(3) NOT NULL,
    "deliveryEndsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "restaurantCaps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosureDate" (
    "id" TEXT NOT NULL,
    "localDate" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClosureDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropPoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "directions" TEXT,
    "mapUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DropPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fee" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FeeType" NOT NULL,
    "amountPence" INTEGER,
    "basisPoints" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "userId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "slotOccurrenceId" TEXT NOT NULL,
    "dropPointId" TEXT NOT NULL,
    "dropPointSnapshot" JSONB NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "subtotalPence" INTEGER NOT NULL,
    "feesPence" INTEGER NOT NULL,
    "totalPence" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAY_ON_DELIVERY',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "collectedPence" INTEGER,
    "collectMethod" "CollectMethod",
    "collectedAt" TIMESTAMP(3),
    "collectedBy" TEXT,
    "waivedReason" TEXT,
    "guestTokenHash" TEXT,
    "guestTokenExpiresAt" TIMESTAMP(3),
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "cancelReason" TEXT,
    "cancelledBy" "ActorType",
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preparingAt" TIMESTAMP(3),
    "inTransitAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "notCollectedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "restaurantId" TEXT NOT NULL,
    "restaurantName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitPricePence" INTEGER NOT NULL,
    "originalUnitPricePence" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotalPence" INTEGER NOT NULL,
    "allergens" "Allergen"[],
    "mayContain" "Allergen"[],
    "dietaryLabels" TEXT[],
    "kcal" INTEGER,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderFee" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "feeId" TEXT,
    "label" TEXT NOT NULL,
    "type" "FeeType" NOT NULL,
    "amountPence" INTEGER,
    "basisPoints" INTEGER,
    "chargedPence" INTEGER NOT NULL,

    CONSTRAINT "OrderFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "from" "OrderStatus",
    "to" "OrderStatus" NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactBlock" (
    "id" TEXT NOT NULL,
    "kind" "ContactKind" NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" "BlockSource" NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),
    "clearedBy" TEXT,

    CONSTRAINT "ContactBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favourite" (
    "userId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favourite_pkey" PRIMARY KEY ("userId","menuItemId")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "guestTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorType" "ActorType" NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "providerId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "storeOpen" BOOLEAN NOT NULL DEFAULT true,
    "brandName" TEXT NOT NULL,
    "supportEmail" TEXT NOT NULL,
    "paymentInstructions" TEXT NOT NULL,
    "maxItemsPerOrder" INTEGER NOT NULL DEFAULT 30,
    "maxQtyPerLine" INTEGER NOT NULL DEFAULT 10,
    "maxActiveOrdersPerContactPerSlot" INTEGER NOT NULL DEFAULT 2,
    "noShowBlockThreshold" INTEGER NOT NULL DEFAULT 2,
    "noShowWindowDays" INTEGER NOT NULL DEFAULT 90,
    "emailOnPreparing" BOOLEAN NOT NULL DEFAULT false,
    "emailOnDelivered" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");

-- CreateIndex
CREATE INDEX "Restaurant_sortOrder_idx" ON "Restaurant"("sortOrder");

-- CreateIndex
CREATE INDEX "Category_restaurantId_sortOrder_idx" ON "Category"("restaurantId", "sortOrder");

-- CreateIndex
CREATE INDEX "MenuItem_categoryId_sortOrder_idx" ON "MenuItem"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "MenuItem_restaurantId_idx" ON "MenuItem"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "DietaryTag_slug_key" ON "DietaryTag"("slug");

-- CreateIndex
CREATE INDEX "SlotOccurrence_localDate_idx" ON "SlotOccurrence"("localDate");

-- CreateIndex
CREATE UNIQUE INDEX "SlotOccurrence_slotId_localDate_key" ON "SlotOccurrence"("slotId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "ClosureDate_localDate_key" ON "ClosureDate"("localDate");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Order_guestTokenHash_key" ON "Order"("guestTokenHash");

-- CreateIndex
CREATE INDEX "Order_slotOccurrenceId_status_idx" ON "Order"("slotOccurrenceId", "status");

-- CreateIndex
CREATE INDEX "Order_contactEmail_idx" ON "Order"("contactEmail");

-- CreateIndex
CREATE INDEX "Order_contactPhone_idx" ON "Order"("contactPhone");

-- CreateIndex
CREATE INDEX "Order_placedAt_idx" ON "Order"("placedAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_restaurantId_idx" ON "OrderItem"("restaurantId");

-- CreateIndex
CREATE INDEX "OrderFee_orderId_idx" ON "OrderFee"("orderId");

-- CreateIndex
CREATE INDEX "OrderStatusEvent_orderId_at_idx" ON "OrderStatusEvent"("orderId", "at");

-- CreateIndex
CREATE INDEX "ContactBlock_kind_value_idx" ON "ContactBlock"("kind", "value");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_number_key" ON "SupportTicket"("number");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_guestTokenHash_key" ON "SupportTicket"("guestTokenHash");

-- CreateIndex
CREATE INDEX "SupportTicket_status_updatedAt_idx" ON "SupportTicket"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_dedupeKey_key" ON "EmailLog"("dedupeKey");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_at_idx" ON "AuditLog"("at");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemDietaryTag" ADD CONSTRAINT "MenuItemDietaryTag_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemDietaryTag" ADD CONSTRAINT "MenuItemDietaryTag_dietaryTagId_fkey" FOREIGN KEY ("dietaryTagId") REFERENCES "DietaryTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotRestaurantCap" ADD CONSTRAINT "SlotRestaurantCap_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotRestaurantCap" ADD CONSTRAINT "SlotRestaurantCap_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotOccurrence" ADD CONSTRAINT "SlotOccurrence_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_slotOccurrenceId_fkey" FOREIGN KEY ("slotOccurrenceId") REFERENCES "SlotOccurrence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_dropPointId_fkey" FOREIGN KEY ("dropPointId") REFERENCES "DropPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderFee" ADD CONSTRAINT "OrderFee_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ───────────── Integrity constraints (not expressible in Prisma schema) ─────────────
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_price_positive" CHECK ("pricePence" > 0);
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_discount_below_price" CHECK ("discountedPricePence" IS NULL OR ("discountedPricePence" > 0 AND "discountedPricePence" < "pricePence"));
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_available_requires_allergens" CHECK ("isAvailable" = false OR "allergensConfirmedAt" IS NOT NULL);
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_spice_range" CHECK ("spiceLevel" BETWEEN 0 AND 3);
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_kcal_range" CHECK ("kcal" IS NULL OR "kcal" BETWEEN 0 AND 10000);

ALTER TABLE "Fee" ADD CONSTRAINT "Fee_amount_matches_type" CHECK (
  ("type" = 'FLAT' AND "amountPence" IS NOT NULL AND "amountPence" >= 0 AND "basisPoints" IS NULL) OR
  ("type" = 'PERCENT' AND "basisPoints" IS NOT NULL AND "basisPoints" BETWEEN 0 AND 10000 AND "amountPence" IS NULL)
);

ALTER TABLE "Slot" ADD CONSTRAINT "Slot_times_ordered" CHECK (
  "orderOpensMin" >= 0 AND "orderOpensMin" < "orderClosesMin" AND "orderClosesMin" <= "deliveryStartsMin"
  AND "deliveryStartsMin" < "deliveryEndsMin" AND "deliveryEndsMin" <= 1440
);
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_capacity_nonneg" CHECK ("capacity" >= 0 AND "closingSoonMinutes" >= 0);
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_days_valid" CHECK (cardinality("daysOfWeek") > 0 AND "daysOfWeek" <@ ARRAY[1,2,3,4,5,6,7]);
ALTER TABLE "SlotRestaurantCap" ADD CONSTRAINT "SlotRestaurantCap_nonneg" CHECK ("maxOrders" >= 0);
ALTER TABLE "SlotOccurrence" ADD CONSTRAINT "SlotOccurrence_capacity_nonneg" CHECK ("capacity" >= 0);

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_range" CHECK ("quantity" BETWEEN 1 AND 99);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_amounts_nonneg" CHECK ("unitPricePence" >= 0 AND "lineTotalPence" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_totals_consistent" CHECK ("subtotalPence" >= 0 AND "feesPence" >= 0 AND "totalPence" = "subtotalPence" + "feesPence");
ALTER TABLE "Order" ADD CONSTRAINT "Order_collected_nonneg" CHECK ("collectedPence" IS NULL OR "collectedPence" >= 0);

ALTER TABLE "Settings" ADD CONSTRAINT "Settings_singleton" CHECK ("id" = 1);
