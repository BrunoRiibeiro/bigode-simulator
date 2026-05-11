#!/bin/bash

SITEDIR=./public
SITETARBALL=site.tar.gz

tar -C $SITEDIR -cvzf $SITETARBALL .
hut pages publish -d bigode-simulator.ribeiro.sh $SITETARBALL
