#!/bin/bash

site=$1
SITEDIR=./public
SITETARBALL=site.tar.gz

tar -C $SITEDIR -cvzf $SITETARBALL .
[[ $site == "dump" ]] && hut pages publish -d dump.bigode-simulator.ribeiro.sh $SITETARBALL
[[ $site == "prod" ]] && hut pages publish -d bigode-simulator.ribeiro.sh $SITETARBALL
