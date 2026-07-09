#!/usr/bin/env bash

set -a
source $HOME/.local/www/cloudflare.env
set +a

EMAILS_FILE=$1

emails_json="$(grep -vE '^\s*#|^\s*$' "$EMAILS_FILE" \
    | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
    | tr '[:upper:]' '[:lower:]' \
    | jq -R -s -c 'split("\n") | map(select(length>0)) | unique'
)"

[[ "$emails_json" == "[]" ]] && { echo "No email found in $EMAILS_FILE."; exit 1; }

echo "Updating policy with $(echo "$emails_json" | jq 'length') e-mails..."

current_policy_resp="$(curl -sS \
	-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
	-H "Content-Type: application/json" \
	"$BASE_URL/accounts/$ACCOUNT_ID/access/policies/$POLICY_ID"
)"

echo "$current_policy_resp" | grep -q '"success": true'
[[ $? -ne 0 ]] && { echo "Error while search policy:"; echo "$current_policy_resp"; exit 1; }

policy_result="$(echo "$current_policy_resp" | jq '.result')"

updated_payload="$(echo "$policy_result" | jq --argjson emails "$emails_json" '
  .include = [ $emails[] | { email: { email: . } } ]
')"

update_resp="$(curl -sS -X PUT \
	-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
	-H "Content-Type: application/json" \
	--data "$updated_payload" \
  	"$BASE_URL/accounts/$ACCOUNT_ID/access/policies/$POLICY_ID"
)"


echo "$update_resp" | grep -q '"success": true'
[[ $? -ne 0 ]] && { echo "Error whle updating policy:"; echo "$update_resp"; exit 1; }

echo "OK! Policy successfully updated."
