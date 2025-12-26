#!/bin/bash
# Railway SSH Migration Fix Script
# Run this in the Railway SSH session

echo "🔧 Starting migration cleanup..."

# Step 1: Create SQL cleanup file
cat > /tmp/cleanup-migrations.sql << 'SQLEOF'
DELETE FROM "_prisma_migrations"
WHERE migration_name IN (
  '20251225011135_add_appointment_system',
  '20251225020000_fix_appointment_table'
);
SQLEOF

echo "📝 Deleting failed migration records from database..."
npx prisma db execute --file /tmp/cleanup-migrations.sql

# Step 2: Verify deletion
cat > /tmp/verify-migrations.sql << 'SQLEOF'
SELECT migration_name, finished_at, rolled_back_at
FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 5;
SQLEOF

echo "✅ Verifying migrations table..."
npx prisma db execute --file /tmp/verify-migrations.sql

# Step 3: Deploy the clean migration
echo "📦 Deploying clean Appointment table migration..."
npx prisma migrate deploy

# Step 4: Verify table structure
cat > /tmp/verify-table.sql << 'SQLEOF'
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Appointment'
ORDER BY ordinal_position;
SQLEOF

echo "🔍 Verifying Appointment table structure..."
npx prisma db execute --file /tmp/verify-table.sql

# Step 5: Check final migration status
echo "📋 Final migration status:"
npx prisma migrate status

echo ""
echo "✅ Migration fix complete!"
echo "🔄 Server will restart automatically"
echo ""
echo "Expected: Appointment table should have camelCase columns (requestedDate, scheduledTime, etc.)"
