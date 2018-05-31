#!/bin/bash
TARGETDIR=/share/CACHEDEV1_DATA/homes/admin/Projects/timetracker-docker
export PATH=$PATH:/share/CACHEDEV1_DATA/.qpkg/container-station/bin
cd $TARGETDIR

docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
docker build -t nobio/timetracker .   
docker run --restart=always -p 30030:30000 -d nobio/timetracker

