#!/usr/bin/with-contenv bashio
set -e

export MQTT_HOST="$(bashio::services mqtt 'host')"
export MQTT_PORT="$(bashio::services mqtt 'port')"
export MQTT_USER="$(bashio::services mqtt 'username')"
export MQTT_PASSWORD="$(bashio::services mqtt 'password')"

if bashio::services mqtt 'ssl' >/dev/null 2>&1; then
  export MQTT_SSL="$(bashio::services mqtt 'ssl')"
else
  export MQTT_SSL="false"
fi

exec python3 /app/app.py
