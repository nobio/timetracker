TimeTracker
===========

tracks time of my adsencei.

## Deployment
To deploy in my qnap NAS please use the following command (root directory)

`$ bin/rsync-qnap.sh`

## local start:
`MONGO_URL=mongodb://qnap-nas:27017/timetracker npm start`

## use Slack to notify
If you want to use Slack for admin notifications, you need to provide the `SLACK_TOKEN` as environment variable; this could be part of docker-compose.yml or just put it into start up:
`SLACK_TOKEN=oxp-123456789.... npm start`
