#!/usr/bin/env bash
#
# macOS CouchDB setup for local development/testing.
# Equivalent of setup.ps1 but for macOS (brew-based).
#
# Usage:
#   ./setup-mac.sh <admin_pw> <doctor_pw> <nurse_pw>
#
# Prerequisites: brew install couchdb  (or standalone CouchDB install)

set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <admin_password> <doctor_password> <nurse_password>"
  exit 1
fi

ADMIN_PW="$1"
DOCTOR_PW="$2"
NURSE_PW="$3"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_URL="http://localhost:5984"
ADMIN_URL="http://admin:${ADMIN_PW}@localhost:5984"
DB="clinicsoftware_v2"

step() { echo -e "\n\033[36m==> $1\033[0m"; }
ok()   { echo -e "    \033[32m[OK] $1\033[0m"; }
fail() { echo -e "    \033[31m[FAIL] $1\033[0m"; exit 1; }

# -----------------------------------------------------------------------
# Step 1: Check if CouchDB is installed
# -----------------------------------------------------------------------
step "Checking CouchDB installation"

if command -v couchdb &>/dev/null; then
  ok "CouchDB binary found: $(which couchdb)"
elif brew list couchdb &>/dev/null; then
  ok "CouchDB installed via Homebrew"
else
  fail "CouchDB not found. Install with: brew install couchdb"
fi

# -----------------------------------------------------------------------
# Step 2: Start CouchDB if not running
# -----------------------------------------------------------------------
step "Ensuring CouchDB is running"

if curl -sf "$BASE_URL/_up" &>/dev/null; then
  ok "CouchDB already running"
else
  echo "    Starting CouchDB..."
  if brew services list 2>/dev/null | grep -q couchdb; then
    brew services start couchdb
  else
    # Try starting in background
    couchdb -b 2>/dev/null || couchdb &
  fi

  # Wait up to 15s
  for i in $(seq 1 15); do
    if curl -sf "$BASE_URL/_up" &>/dev/null; then break; fi
    sleep 1
  done

  if curl -sf "$BASE_URL/_up" &>/dev/null; then
    ok "CouchDB started"
  else
    fail "CouchDB did not start within 15s. Start it manually and re-run."
  fi
fi

# -----------------------------------------------------------------------
# Step 3: Set up admin user (single-node setup)
# -----------------------------------------------------------------------
step "Configuring admin user"

# Check if admin is already set by trying an authenticated request
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL/_all_dbs" 2>/dev/null)

if [[ "$HTTP_CODE" == "200" ]]; then
  ok "Admin user already configured"
elif [[ "$HTTP_CODE" == "401" ]]; then
  fail "Admin password incorrect. CouchDB already has an admin with a different password."
else
  # No admin yet (admin party mode). Set one up.
  curl -sf -X PUT "$BASE_URL/_node/_local/_config/admins/admin" \
    -H "Content-Type: application/json" \
    -d "\"$ADMIN_PW\"" >/dev/null
  ok "Admin user created"
fi

# -----------------------------------------------------------------------
# Step 4: Apply local.ini settings via config API
# -----------------------------------------------------------------------
step "Applying CouchDB configuration"

# bind_address
curl -sf -X PUT "$ADMIN_URL/_node/_local/_config/chttpd/bind_address" \
  -H "Content-Type: application/json" -d '"0.0.0.0"' >/dev/null
ok "bind_address = 0.0.0.0"

# require_valid_user_except_for_up
curl -sf -X PUT "$ADMIN_URL/_node/_local/_config/chttpd_auth/require_valid_user_except_for_up" \
  -H "Content-Type: application/json" -d '"true"' >/dev/null
ok "require_valid_user_except_for_up = true"

# CORS
curl -sf -X PUT "$ADMIN_URL/_node/_local/_config/httpd/enable_cors" \
  -H "Content-Type: application/json" -d '"true"' >/dev/null
curl -sf -X PUT "$ADMIN_URL/_node/_local/_config/cors/origins" \
  -H "Content-Type: application/json" -d '"*"' >/dev/null
curl -sf -X PUT "$ADMIN_URL/_node/_local/_config/cors/credentials" \
  -H "Content-Type: application/json" -d '"false"' >/dev/null
curl -sf -X PUT "$ADMIN_URL/_node/_local/_config/cors/methods" \
  -H "Content-Type: application/json" -d '"GET, PUT, POST, HEAD, DELETE"' >/dev/null
curl -sf -X PUT "$ADMIN_URL/_node/_local/_config/cors/headers" \
  -H "Content-Type: application/json" -d '"accept, authorization, content-type, origin, referer"' >/dev/null
ok "CORS configured (origins=*, credentials=false)"

# -----------------------------------------------------------------------
# Step 5: Create system databases (required for CouchDB 3.x)
# -----------------------------------------------------------------------
step "Creating system databases"

for SYS_DB in _users _replicator _global_changes; do
  SYS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$ADMIN_URL/$SYS_DB")
  if [[ "$SYS_CODE" == "201" ]]; then
    ok "$SYS_DB created"
  elif [[ "$SYS_CODE" == "412" ]]; then
    echo "    $SYS_DB already exists (skipping)"
  else
    echo "    $SYS_DB returned HTTP $SYS_CODE (non-fatal)"
  fi
done

# -----------------------------------------------------------------------
# Step 6: Create the database
# -----------------------------------------------------------------------
step "Creating database: $DB"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$ADMIN_URL/$DB")
if [[ "$HTTP_CODE" == "201" ]]; then
  ok "Database $DB created"
elif [[ "$HTTP_CODE" == "412" ]]; then
  echo "    Database already exists (skipping)"
else
  fail "Failed to create database (HTTP $HTTP_CODE)"
fi

# -----------------------------------------------------------------------
# Step 6: Create doctor user
# -----------------------------------------------------------------------
step "Creating user: doctor"

DOCTOR_DOC='{"_id":"org.couchdb.user:doctor","name":"doctor","password":"'"$DOCTOR_PW"'","roles":["doctor"],"type":"user"}'
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$ADMIN_URL/_users/org.couchdb.user:doctor" \
  -H "Content-Type: application/json" -d "$DOCTOR_DOC")

if [[ "$HTTP_CODE" == "201" ]]; then
  ok "Doctor user created with role: doctor"
elif [[ "$HTTP_CODE" == "409" ]]; then
  echo "    Doctor user already exists (skipping)"
else
  fail "Failed to create doctor user (HTTP $HTTP_CODE)"
fi

# -----------------------------------------------------------------------
# Step 7: Create nurse user
# -----------------------------------------------------------------------
step "Creating user: nurse"

NURSE_DOC='{"_id":"org.couchdb.user:nurse","name":"nurse","password":"'"$NURSE_PW"'","roles":["nurse"],"type":"user"}'
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$ADMIN_URL/_users/org.couchdb.user:nurse" \
  -H "Content-Type: application/json" -d "$NURSE_DOC")

if [[ "$HTTP_CODE" == "201" ]]; then
  ok "Nurse user created with role: nurse"
elif [[ "$HTTP_CODE" == "409" ]]; then
  echo "    Nurse user already exists (skipping)"
else
  fail "Failed to create nurse user (HTTP $HTTP_CODE)"
fi

# -----------------------------------------------------------------------
# Step 8: Set database security object
# -----------------------------------------------------------------------
step "Setting database security object"

SECURITY='{"admins":{"names":[],"roles":["doctor"]},"members":{"names":[],"roles":["doctor","nurse"]}}'
curl -sf -X PUT "$ADMIN_URL/$DB/_security" \
  -H "Content-Type: application/json" -d "$SECURITY" >/dev/null
ok "Security object set (doctor=admin+member, nurse=member)"

# -----------------------------------------------------------------------
# Step 9: Deploy validate_doc_update design document
# -----------------------------------------------------------------------
step "Deploying role enforcement design document"

DESIGN_DOC="$SCRIPT_DIR/validate_doc_update.json"
if [[ ! -f "$DESIGN_DOC" ]]; then
  fail "validate_doc_update.json not found in $SCRIPT_DIR"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$ADMIN_URL/$DB/_design/roles" \
  -H "Content-Type: application/json" -d @"$DESIGN_DOC")

if [[ "$HTTP_CODE" == "201" ]]; then
  ok "Design document deployed (_design/roles)"
elif [[ "$HTTP_CODE" == "409" ]]; then
  echo "    Design document already exists (skipping)"
else
  fail "Failed to deploy design document (HTTP $HTTP_CODE)"
fi

# -----------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------
echo ""
echo -e "\033[32m======================================================\033[0m"
echo -e "\033[32m  CouchDB setup complete\033[0m"
echo -e "\033[32m======================================================\033[0m"
echo ""
echo "  Endpoint:  $BASE_URL"
echo "  Database:  $DB"
echo "  Users:     doctor (role: doctor), nurse (role: nurse)"
echo ""
echo "  Nurse is blocked from writing: visit, visitmed, drug"
echo "  Nurse can write:               patient, recent, settings"
echo ""
echo "  Next step: ./verify-mac.sh $ADMIN_PW $DOCTOR_PW $NURSE_PW"
echo ""
