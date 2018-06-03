#!/bin/sh

#QNAP_HOST=admin@192.168.178.46
QNAP_HOST=admin@qnap-nas
#QNAP_HOST=admin@`ping -c 1 qnap-nas|grep "bytes from"|awk '{print $4}'|awk -F ":" '{print $1}'`
#QNAP_HOST=admin@nobio.myhome-server.de
WORKDIR=./
TARGETDIR=/share/CACHEDEV1_DATA/homes/admin/Projects/timetracker-docker

rsync -avp --delete $WORKDIR $QNAP_HOST:$TARGETDIR --exclude node_modules --exclude dump --exclude .git
#ssh -t $QNAP_HOST $TARGETDIR/bin/docker-build.sh
echo ...done