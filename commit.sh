#!/bin/sh
#
COMMIT_MSG=$1
if [ -z $COMMIT_MSG ]
then
  echo Please provide a commit message
  exit 1
fi
# increase build numbers
DIRECTORY=`pwd`
node $DIRECTORY/bin/increase_build.js

git add VERSION
git add package.json

git commit -m $COMMIT_MSG
