#!/usr/bin/env bash
#
# macOS CouchDB verification. Equivalent of verify.ps1.
# Runs 6 checks covering all 4 INFRA requirements.
#
# Usage:
#   ./verify-mac.sh <admin_pw> <doctor_pw> <nurse_pw>

set -uo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <admin_password> <doctor_password> <nurse_password>"
  exit 1
fi

ADMIN_PW="$1"
DOCTOR_PW="$2"
NURSE_PW="$3"

BASE_URL="http://localhost:5984"
ADMIN_URL="http://admin:${ADMIN_PW}@localhost:5984"
DOCTOR_URL="http://doctor:${DOCTOR_PW}@localhost:5984"
NURSE_URL="http://nurse:${NURSE_PW}@localhost:5984"
DB="clinicsoftware_v2"

PASS_COUNT=0
TOTAL=6

check() { echo -e "\n\033[36m--- Check $1 / $TOTAL : $2 ---\033[0m"; }
pass()  { echo -e "    \033[32m[PASS] $1\033[0m"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail()  { echo -e "    \033[31m[FAIL] $1\033[0m"; }

# -----------------------------------------------------------------------
# Check 1 (INFRA-01): CouchDB process running
# -----------------------------------------------------------------------
check 1 "INFRA-01 - CouchDB process running"

if curl -sf "$BASE_URL/_up" | grep -q '"ok"'; then
  pass "CouchDB is running (/_up status=ok)"
else
  fail "CouchDB not responding on $BASE_URL/_up"
fi

# -----------------------------------------------------------------------
# Check 2 (INFRA-02): Accessible on LAN (/_up responds)
# -----------------------------------------------------------------------
check 2 "INFRA-02 - CouchDB accessible on LAN"

# Get local LAN IP
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")

if [[ -n "$LAN_IP" ]]; then
  if curl -sf --connect-timeout 3 "http://$LAN_IP:5984/_up" | grep -q '"ok"'; then
    pass "Accessible via LAN at http://$LAN_IP:5984/_up"
  else
    fail "Cannot reach http://$LAN_IP:5984/_up (check bind_address and firewall)"
  fi
else
  # Fallback: just check localhost binding
  BIND=$(curl -sf "$ADMIN_URL/_node/_local/_config/chttpd/bind_address" 2>/dev/null | tr -d '"')
  if [[ "$BIND" == "0.0.0.0" ]]; then
    pass "bind_address=0.0.0.0 (LAN accessible, but could not detect LAN IP to verify)"
  else
    fail "bind_address=$BIND (expected 0.0.0.0 for LAN access)"
  fi
fi

# -----------------------------------------------------------------------
# Check 3 (INFRA-03): Unauthenticated request rejected
# -----------------------------------------------------------------------
check 3 "INFRA-03 - Unauthenticated request rejected (401)"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$DB")

if [[ "$HTTP_CODE" == "401" || "$HTTP_CODE" == "403" ]]; then
  pass "Unauthenticated request correctly rejected with HTTP $HTTP_CODE"
else
  fail "Unauthenticated request returned HTTP $HTTP_CODE (expected 401)"
fi

# -----------------------------------------------------------------------
# Check 4 (INFRA-04a): Doctor CAN write a visit document
# -----------------------------------------------------------------------
check 4 "INFRA-04a - Doctor CAN write a visit document"

VISIT_ID="visit:verify_test"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$DOCTOR_URL/$DB/$VISIT_ID" \
  -H "Content-Type: application/json" \
  -d '{"_id":"visit:verify_test","type":"visit","patientId":"p_test"}')

if [[ "$HTTP_CODE" == "201" || "$HTTP_CODE" == "202" ]]; then
  pass "Doctor successfully wrote visit document"
  # Cleanup
  REV=$(curl -sf "$ADMIN_URL/$DB/$VISIT_ID" | grep -o '"_rev":"[^"]*"' | cut -d'"' -f4)
  curl -sf -X DELETE "$ADMIN_URL/$DB/$VISIT_ID?rev=$REV" >/dev/null 2>&1
else
  fail "Doctor write returned HTTP $HTTP_CODE (expected 201)"
fi

# -----------------------------------------------------------------------
# Check 5 (INFRA-04b): Nurse CANNOT write a visit document
# -----------------------------------------------------------------------
check 5 "INFRA-04b - Nurse CANNOT write a visit document (forbidden)"

VISIT_ID2="visit:verify_test2"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$NURSE_URL/$DB/$VISIT_ID2" \
  -H "Content-Type: application/json" \
  -d '{"_id":"visit:verify_test2","type":"visit","patientId":"p_test"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" == "403" ]]; then
  pass "Nurse write correctly rejected with HTTP 403"
elif echo "$BODY" | grep -qi "forbidden"; then
  pass "Nurse write rejected: forbidden"
else
  fail "Nurse write returned HTTP $HTTP_CODE (expected 403 forbidden)"
  # Cleanup if it got through
  REV=$(curl -sf "$ADMIN_URL/$DB/$VISIT_ID2" | grep -o '"_rev":"[^"]*"' | cut -d'"' -f4)
  [[ -n "$REV" ]] && curl -sf -X DELETE "$ADMIN_URL/$DB/$VISIT_ID2?rev=$REV" >/dev/null 2>&1
fi

# -----------------------------------------------------------------------
# Check 6 (INFRA-04c): Nurse CAN write a patient document
# -----------------------------------------------------------------------
check 6 "INFRA-04c - Nurse CAN write a patient document"

PATIENT_ID="patient:verify_test"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$NURSE_URL/$DB/$PATIENT_ID" \
  -H "Content-Type: application/json" \
  -d '{"_id":"patient:verify_test","type":"patient","firstName":"Test"}')

if [[ "$HTTP_CODE" == "201" || "$HTTP_CODE" == "202" ]]; then
  pass "Nurse successfully wrote patient document"
  # Cleanup
  REV=$(curl -sf "$ADMIN_URL/$DB/$PATIENT_ID" | grep -o '"_rev":"[^"]*"' | cut -d'"' -f4)
  curl -sf -X DELETE "$ADMIN_URL/$DB/$PATIENT_ID?rev=$REV" >/dev/null 2>&1
else
  fail "Nurse patient write returned HTTP $HTTP_CODE (expected 201)"
fi

# -----------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------
echo ""
echo -e "\033[36m======================================================\033[0m"
echo -e "\033[36m  Verification complete: $PASS_COUNT / $TOTAL checks passed\033[0m"
echo -e "\033[36m======================================================\033[0m"

if [[ "$PASS_COUNT" -eq "$TOTAL" ]]; then
  echo ""
  echo -e "\033[32m  All checks passed. CouchDB infrastructure is ready.\033[0m"
  echo ""
  if [[ -n "$LAN_IP" ]]; then
    echo -e "\033[33m  Test from another machine: curl http://$LAN_IP:5984/_up\033[0m"
    echo ""
  fi
else
  FAILED=$((TOTAL - PASS_COUNT))
  echo ""
  echo -e "\033[31m  $FAILED check(s) failed. Review errors above.\033[0m"
  echo ""
  exit 1
fi
