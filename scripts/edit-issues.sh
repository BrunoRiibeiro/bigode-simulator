#!/usr/bin/env bash
set -euo pipefail

repo="BrunoRiibeiro/bigode-simulator"
file="${1:?uso: $0 ARQUIVO ISSUE_INICIAL ISSUE_FINAL QID_INICIAL QID_FINAL}"
issue_start="${2:?uso: $0 ARQUIVO ISSUE_INICIAL ISSUE_FINAL QID_INICIAL QID_FINAL}"
issue_end="${3:?uso: $0 ARQUIVO ISSUE_INICIAL ISSUE_FINAL QID_INICIAL QID_FINAL}"
qid_start="${4:?uso: $0 ARQUIVO ISSUE_INICIAL ISSUE_FINAL QID_INICIAL QID_FINAL}"
qid_end="${5:?uso: $0 ARQUIVO ISSUE_INICIAL ISSUE_FINAL QID_INICIAL QID_FINAL}"

dump="$(basename "$file" .json)"
issue_count=$((issue_end - issue_start + 1))

questions_json="$(jq --arg qid_start "$qid_start" --arg qid_end "$qid_end" '
[.questions[] | select(.id >= $qid_start and .id <= $qid_end)]
' "$file")"

question_count="$(printf '%s' "$questions_json" | jq 'length')"

[ "$issue_count" -eq "$question_count" ] || {
	echo "erro: o range de issues tem $issue_count itens, mas o range de questões tem $question_count"
	exit 1
}

i="$issue_start"

printf '%s' "$questions_json" | jq -r '.[] | @base64' | while read -r row; do
q() { printf '%s' "$row" | base64 -d | jq -r "$1"; }

id="$(q '.id')"
type="$(q '.type // ""')"
prompt="$(q '.prompt // ""')"
answer="$(q '
if (.answer|type)=="array" then (.answer|map(tostring)|join(", "))
elif (.answer|type)=="boolean" then (if .answer then "true" else "false" end)
else (.answer // "" | tostring)
end
')"

ref="$dump/$id"
title="[Question] $ref"
body="$(cat <<EOF
**Question-Ref:** $ref

**Dump:** $dump
**Question ID:** $id
**Type:** $type

**Prompt:**
$prompt

**Current answer:** $answer
EOF
)"

gh issue edit "$i" -R "$repo" --title "$title" --body "$body" >/dev/null
echo "update #$i -> $ref"
i=$((i + 1))
done
