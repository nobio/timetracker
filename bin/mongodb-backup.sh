#!/bin/bash
set -eu

BACKUP_DIR=${BACKUP_DIR:-/backups}
MONGO_BACKUP_URI=${MONGO_BACKUP_URI:-mongodb://mongo:27017}
MONGO_BACKUP_HOUR_UTC=${MONGO_BACKUP_HOUR_UTC:-2}
MONGO_BACKUP_MINUTE_UTC=${MONGO_BACKUP_MINUTE_UTC:-0}
MONGO_BACKUP_RETENTION_DAYS=${MONGO_BACKUP_RETENTION_DAYS:-30}

validate_number() {
  local name=$1 value=$2 max=$3
  if [[ ! $value =~ ^[0-9]+$ ]] || (( ${#value} > 3 )) || (( 10#$value > max )); then
    echo "Invalid $name: $value" >&2
    exit 1
  fi
}

validate_number MONGO_BACKUP_HOUR_UTC "$MONGO_BACKUP_HOUR_UTC" 23
validate_number MONGO_BACKUP_MINUTE_UTC "$MONGO_BACKUP_MINUTE_UTC" 59
validate_number MONGO_BACKUP_RETENTION_DAYS "$MONGO_BACKUP_RETENTION_DAYS" 999
if (( 10#$MONGO_BACKUP_RETENTION_DAYS == 0 )); then
  echo 'MONGO_BACKUP_RETENTION_DAYS must be at least 1' >&2
  exit 1
fi

backup() {
  local timestamp temp_file final_file
  mkdir -p "$BACKUP_DIR"
  timestamp=$(date -u +%Y%m%dT%H%M%SZ)
  temp_file=$(mktemp "$BACKUP_DIR/.mongodb-${timestamp}-XXXXXX")
  final_file=${temp_file%/*}/${temp_file##*/.}.archive.gz
  echo "Starting MongoDB backup at $timestamp"
  if mongodump --uri="$MONGO_BACKUP_URI" --archive="$temp_file" --gzip; then
    mv "$temp_file" "$final_file"
    echo "Backup saved to $final_file"
    find "$BACKUP_DIR" -maxdepth 1 -type f -name 'mongodb-*.archive.gz' \
      -mtime "+$((10#$MONGO_BACKUP_RETENTION_DAYS - 1))" -print -delete
  else
    rm -f "$temp_file"
    echo 'MongoDB backup failed; existing backups have not been removed' >&2
    return 1
  fi
}

case ${1:-schedule} in
  once)
    backup
    ;;
  schedule)
    trap 'exit 0' TERM INT
    while :; do
      now=$(date -u +%s)
      today=$(date -u +%F)
      hour=$((10#$MONGO_BACKUP_HOUR_UTC))
      minute=$((10#$MONGO_BACKUP_MINUTE_UTC))
      next=$(date -u -d "$today $hour:$minute:00 UTC" +%s)
      if (( next <= now )); then
        next=$((next + 86400))
      fi
      echo "Next MongoDB backup: $(date -u -d "@$next" '+%Y-%m-%d %H:%M:%S UTC')"
      sleep "$((next - now))" &
      wait $!
      backup || echo 'Backup failed; will retry at the next scheduled time' >&2
    done
    ;;
  *)
    echo 'Usage: mongodb-backup.sh [schedule|once]' >&2
    exit 2
    ;;
esac