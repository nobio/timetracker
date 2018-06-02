#!/bin/bash
TARGETDIR=/share/CACHEDEV1_DATA/homes/admin/Projects/timetracker-docker
export PATH=$PATH:/share/CACHEDEV1_DATA/.qpkg/container-station/bin
cd $TARGETDIR

#docker stop $(docker ps -a -q)
docker stop timetracker
#docker rm $(docker ps -a -q)
docker rm timetracker
docker build -t nobio/timetracker .   
<<<<<<< HEAD
docker run -rm --restart=always -p 30030:30000 -d nobio/timetracker

=======
docker run --restart=always -p 30030:30000 --name timetracker -d nobio/timetracker
>>>>>>> 6bd532270da6d1915d03d65aaf5513bc5f2cf92e
