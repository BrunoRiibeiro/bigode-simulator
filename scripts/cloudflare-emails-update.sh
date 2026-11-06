#!/usr/bin/env bash

. $HOME/.local/www/cloudflare/cloudflare.env

[[ $# -eq 1 && -r "$1" ]] || { echo "Usage: $0 <emails-file>" >&2; exit 1; }
EMAILS_FILE=$1

emails_json="$(grep -vE '^[[:space:]]*#|^[[:space:]]*$' "$EMAILS_FILE" \
    | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
    | tr '[:upper:]' '[:lower:]' \
	| jq -R -s -c 'split("\n") | map(select(length>0)) | unique'
)"

email_count=$(jq 'length' <<< "$emails_json")

(( $email_count > 0 )) || { echo "No email found in $EMAILS_FILE." >&2; exit 1; }

echo "Updating policy with $email_count e-mails..."

current_policy_resp="$(curl -sS \
	-H "Authorization: Bearer $ZERO_TRUST_TOKEN" \
	-H "Content-Type: application/json" \
	"$API_BASE_URL/accounts/$ACCOUNT_ID/access/policies/$ZERO_TRUST_POLICY_ID"
)"

echo "$current_policy_resp" | grep -q '"success": true'
[[ $? -ne 0 ]] && { echo -e "Error while search policy:\n$current_policy_resp" >&2; exit 1; }

policy_result="$(jq '.result' <<< $current_policy_resp)"

updated_payload="$(jq --argjson emails "$emails_json" '
  .include = [ $emails[] | { email: { email: . } } ] ' <<< $policy_result)"

update_resp="$(curl -sS -X PUT \
	-H "Authorization: Bearer $ZERO_TRUST_TOKEN" \
	-H "Content-Type: application/json" \
	--data "$updated_payload" \
	"$API_BASE_URL/accounts/$ACCOUNT_ID/access/policies/$ZERO_TRUST_POLICY_ID"
)"


echo "$update_resp" | grep -q '"success": true'
[[ $? -ne 0 ]] && { echo -e "Error while updating policy:\n$update_resp" >&2; exit 1; }

echo "OK! Policy successfully updated."
