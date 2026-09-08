#!/usr/bin/env bash
set -euo pipefail

REPO="BrunoRiibeiro/bigode-simulator"
FILE="${1:?usage: $0 ./path/to/questions.json}"
DUMP="$(basename "$FILE" .json)"

jq -r '.questions[] | @base64' "$FILE" | while read -r row; do
	question() { printf '%s' "$row" | base64 -d | jq -r "$1"; }

	ID="$(question '.id')"
	TYPE="$(question '.type // ""')"
	PROMPT="$(question '.prompt // ""')"
	ANSWER="$(question '
		if (.answer | type) == "array" then
			.answer | map(tostring) | join(", ")
		elif (.answer | type) == "boolean" then
			if .answer then "true" else "false" end
		else
			(.answer // "" | tostring)
		end
	')"

	REF="$DUMP/$ID"
	TITLE="[Question] $REF"

	BODY="$(cat <<EOF
**Question-Ref:** $REF

**Dump:** $DUMP
**Question ID:** $ID
**Type:** $TYPE

**Prompt:**
$PROMPT

**Current answer:** $ANSWER
EOF
)"

	issue_number="$(gh issue list -R "$REPO" --state all \
			--search "Question-Ref: $REF" \
			--json number \
			--jq '.[0].number // empty')"

	if [[ -z "$issue_number" ]]; then
		gh issue create -R "$REPO" --title "$TITLE" --body "$BODY" >/dev/null
		echo "create $REF"
		continue
	fi

	current_title="$(gh issue view "$issue_number" -R "$REPO" \
			--json title \
			--jq '.title')"

	current_body="$(gh issue view "$issue_number" -R "$REPO" \
			--json body \
			--jq '.body')"

	if [[ "$current_title" = "$TITLE" ]] && [[ "$current_body" = "$BODY" ]]; then
		echo "skip   #$issue_number $REF"
		continue
	fi

	gh issue edit "$issue_number" -R "$REPO" --title "$TITLE" --body "$BODY" >/dev/null
	echo "update #$issue_number $REF"
done
