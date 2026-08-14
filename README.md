# Strong Thunderstorm for Home Assistant

**Creator: Bako**

A Home Assistant app/add-on for a synchronized thunderstorm ambience using
**Zigbee2MQTT lights**, a dynamically mixed **single audio stream** for Cast/Nest
players, and an optional **cozy living-room / fireplace mode**.

## Features

- Strong thunderstorm light engine over Zigbee2MQTT
- Automatic discovery of members of a Zigbee2MQTT group
- Dynamic rain + thunder mix generated freshly for every session
- One-stream playback for Google Cast / Nest devices
- Original-style and realistic lightning-to-thunder timing modes
- Calm / Strong / Extreme storm intensity variants
- Persistent settings across Home Assistant/app restarts
- Gentle 0 / 5 / 8 / 12 second session ending
- Optional second-room cozy scene and fireplace media playback
- State snapshot and restore for storm lights and cozy-room devices
- Home Assistant MQTT Discovery entities
- Ingress web UI

## Install as a Home Assistant repository

In Home Assistant open **Settings → Apps → App store → ⋮ → Repositories** and add:

`https://github.com/nibako/HomeAssistant_Bakos_Thunderstorm`

Then install **Strong Thunderstorm** from that repository.

Home Assistant requires `repository.yaml` at the root of an app repository; this
repository is laid out accordingly.

## Basic setup

1. Create a Zigbee2MQTT group containing the lights used for the storm.
2. Set `lightning_group` to that Zigbee2MQTT group name (default:
   `Thunderstorm-Lights`).
3. If you want audio on a Cast/Nest device, set its Home Assistant entity ID as
   `media_player` and enable `media_player_audio`.
4. Optionally configure a second media player and Home Assistant scene/lights
   for the cozy-room fireplace mode.

The app can resolve individual storm lights automatically from Zigbee2MQTT
`bridge/groups` + `bridge/devices`, so the manual `lights` list can normally stay
empty.

## Public audio edition

The public repository intentionally does **not** redistribute audio from any
third-party Android app. The bundled rain and thunder files are original
procedural replacement sounds made for this project and released under CC0.
See `AUDIO_LICENSE.md`.

## Requirements

- Home Assistant OS / Supervised with Apps/Add-ons support
- MQTT broker available through Home Assistant
- Zigbee2MQTT
- Color-capable Zigbee lights for the full effect
- Optional: Cast/Nest or another compatible `media_player` for audio

## Version

Current public release: **1.3.1**

## License

Code: MIT. Bundled procedural replacement audio: CC0 1.0 Universal.
