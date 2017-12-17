#!/bin/sh

# -------------------------------------------------
# 1 step: Copy the whole project to tmp
# 2 step: Delete node_modules
# 3 step: Create a tar ball
# 4 step: Copy tar ball to qnap
# 5 step: Stop the exisiting application
# 6 step: Move old application to _timetracker
# 7 step: Extract tar ball
# 8 step: start new application
# 9 step: delete old application
# -------------------------------------------------

#QNAP_HOST=admin@192.168.178.46
#QNAP_HOST=admin@qnap-nas
QNAP_HOST=admin@`ping -c 1 qnap-nas|grep "bytes from"|awk '{print $4}'|awk -F ":" '{print $1}'`
# "source ~/.profile"

echo 
# 1 step: Copy the whole project to tmp
echo step \#1: prepare tmp
rm -rf ../tmp
mkdir ../tmp
cp -r * ../tmp

# 2 step: Delete node_modules
echo step \#2: remove not needed stuff
rm -rf ../tmp/dump
rm -rf ../tmp/*lock*
rm -rf ../tmp/.DS_Store

# 3 step: Create a tar ball
echo step \#3: create tar ball
cd ../tmp
tar cfz ../timetracker/timetracker.tgz .
cd ../timetracker

# 4 step: Copy tar ball to qnap
echo step \#4: Copy tar ball to qnap
scp ./timetracker.tgz $QNAP_HOST:/share/CACHEDEV1_DATA/homes/admin/Projects/
rm ./timetracker.tgz

# 5 step: Stop the exisiting application
echo step \#5: Stop the exisiting application
ssh $QNAP_HOST /share/CACHEDEV1_DATA/homes/admin/Projects/timetracker/timetracker.sh  stop

# 6 step: Move old application to _timetracker
echo step \#6: Move old application to _timetracker
ssh $QNAP_HOST mv /share/CACHEDEV1_DATA/homes/admin/Projects/timetracker /share/CACHEDEV1_DATA/homes/admin/Projects/_timetracker
ssh $QNAP_HOST mkdir /share/CACHEDEV1_DATA/homes/admin/Projects/timetracker

# 7 step: Extract tar ball
echo step \#7: Extract tar ball
ssh $QNAP_HOST tar xfz /share/CACHEDEV1_DATA/homes/admin/Projects/timetracker.tgz -C /share/CACHEDEV1_DATA/homes/admin/Projects/timetracker/
ssh $QNAP_HOST rm /share/CACHEDEV1_DATA/homes/admin/Projects/timetracker.tgz

# 8 step: start new application
echo step \#9: start new application
ssh $QNAP_HOST /share/CACHEDEV1_DATA/homes/admin/Projects/timetracker/timetracker.sh restart

# 9 step: delete old application
echo step 10: delete old application
ssh $QNAP_HOST rm -rf /share/CACHEDEV1_DATA/homes/admin/Projects/_timetracker