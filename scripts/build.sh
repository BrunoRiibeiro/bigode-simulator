#!/bin/bash

eval "cat <<EOF
$(cat $1)
EOF
" > $2
