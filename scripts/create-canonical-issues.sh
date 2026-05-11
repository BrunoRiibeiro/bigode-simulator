#!/usr/bin/env bash
set -euo pipefail

repo="BrunoRiibeiro/bigode-simulator"
file="${1:?uso: $0 ./caminho/para/banco.json}"
#dump="$(basename "$file" .json | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_-]/-/g;s/-\+/-/g;s/^-//;s/-$//')"
dump="$(basename "$file" .json)"

jq -r '.questions[] | @base64' "$file" | while read -r row; do
q() { printf '%s' "$row" | base64 -d | jq -r "$1"; }

id="$(q '.id')"
type="$(q '.type // ""')"
prompt="$(q '.prompt // ""')"
answer="$(q 'if (.answer|type)=="array" then .answer|join(", ") else (.answer // "" | tostring) end')"

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

exists="$(gh issue list -R "$repo" --state all --search "\"Question-Ref: $ref\"" --json number --limit 1 --jq 'length')"
[ "$exists" != "0" ] && { echo "skip  $ref"; continue; }

gh issue create -R "$repo" --title "$title" --body "$body" >/dev/null
echo "create $ref"
done
