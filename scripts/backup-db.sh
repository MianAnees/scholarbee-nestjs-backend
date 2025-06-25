#!/bin/bash

# -----------------------------------------------------------------------------------
# Script to clone a MongoDB Atlas database to a local MongoDB instance
# Requires: mongodump, mongorestore, and local MongoDB running on localhost:27017
# -----------------------------------------------------------------------------------

# -----------------------------
# ✅ CONFIGURATION SECTION
# -----------------------------

# Full MongoDB Atlas connection URI
# 🔥 Expected format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
# 🔥 Example: mongodb+srv://myuser:myp%40ssword@cluster0.mongodb.net/myProductionDB
# ⚠️ Make sure special characters in the password are URL-encoded (e.g., @ => %40)
MONGO_ATLAS_URI="mongodb+srv://pickysolutionstools:ehuw8k9EHSylZuk7@cluster0.kzgmz0i.mongodb.net/scholarbee-admin-panel"

# The actual DB name in Atlas to dump (this must match the name used in the URI above)
ATLAS_DB_NAME="scholarbee-admin-panel"

# Local MongoDB target DB name
LOCAL_DB_NAME="yourLocalDB"

# Temporary directory where mongodump will save the backup
DUMP_DIR="../backups"

# -----------------------------
# 🔧 STEP 1: Dump the remote Atlas DB
# -----------------------------

echo "📦 Starting mongodump from MongoDB Atlas..."

mongodump \
  --uri="${MONGO_ATLAS_URI}" \
  --out="${DUMP_DIR}"

# Check if dump was successful
if [ $? -ne 0 ]; then
  echo "❌ mongodump failed. Exiting."
  exit 1
fi

echo "✅ mongodump completed successfully."
