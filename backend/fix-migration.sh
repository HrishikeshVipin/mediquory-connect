#!/bin/bash
# Fix failed migration script for Railway

echo "🔧 Fixing failed Appointment migration..."

# Step 1: Mark the failed migration as rolled back
echo "Step 1: Marking failed migration as rolled back..."
npx prisma migrate resolve --rolled-back 20251225011135_add_appointment_system

# Step 2: Deploy all migrations (will run the fix migration)
echo "Step 2: Deploying all migrations..."
npx prisma migrate deploy

echo "✅ Migration fix complete!"
echo "🔄 Server will restart automatically"
