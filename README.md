TimeTracker
===========


[<img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg">](https://stackblitz.com/github/nobio/timetracker)

## MongoDB backups with Docker Compose

The `mongo-backup` service creates a compressed `mongodump` archive every day
at **02:00 UTC** and saves it to `./dump/mongodb/` on the Docker host. It
connects to the Compose `mongo` service and dumps all accessible databases by
default. The first automatic backup runs at the next scheduled time, not at
container startup. Failed dumps are removed and do not trigger retention cleanup.

Start the service with `docker compose up -d mongo-backup`. To run a backup
immediately, use `docker compose run --rm mongo-backup once`; inspect scheduled
backup messages with `docker compose logs mongo-backup`.

The following optional variables can be set in the Compose `.env` file or the
shell environment before starting the service:

| Variable | Default | Description |
| --- | --- | --- |
| `MONGO_BACKUP_URI` | `mongodb://mongo:27017` | MongoDB connection URI. Supply credentials and `authSource` if authentication is enabled; the user needs backup privileges. |
| `MONGO_BACKUP_HOUR_UTC` | `2` | Daily backup hour, 0–23 UTC. |
| `MONGO_BACKUP_MINUTE_UTC` | `0` | Daily backup minute, 0–59 UTC. |
| `MONGO_BACKUP_RETENTION_DAYS` | `30` | Delete archives older than this many days after a successful backup. |

Restart the service after changing these settings. Keep `.env` and the backup
directory private: archives contain database contents, potentially including
password hashes and personal data. Copy archives to a separate host or storage
system; a backup on the same host does not protect against host or disk loss.
Test restores periodically. This standalone deployment does not use an oplog
snapshot, so writes during a dump can produce an inconsistent backup.

To restore an archive, make a separate backup first: `--drop` replaces
collections included in the archive. Stop application writes and run the
following, replacing the filename with the chosen archive:

```sh
docker compose run --rm --entrypoint mongorestore mongo-backup \
	--uri='mongodb://mongo:27017' --gzip --archive=/backups/mongodb-EXAMPLE.archive.gz --drop
```

For an authenticated deployment, use a restore-privileged URI instead. Do not
run this against a production database without verifying the target and archive.
