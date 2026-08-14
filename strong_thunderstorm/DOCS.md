# Bako's Thunderstorm 1.3.3 — Installation & configuration

**Creator: Bako**

## Installation from repository

Add the repository URL in Home Assistant's App store:

`https://github.com/nibako/HomeAssistant_Bakos_Thunderstorm`

Then install **Bako's Thunderstorm**.

## Zigbee2MQTT

Create a Zigbee2MQTT group for the storm lights. The default group name is:

`Thunderstorm-Lights`

The app reads Zigbee2MQTT `bridge/groups` and `bridge/devices` to resolve the
individual lights automatically. Keep `lights: []` unless you need a manual
override.

## Audio

For a Cast/Nest device, set for example:

```yaml
media_player: media_player.your_nest_or_cast
media_player_audio: true
```

Rain and thunder are mixed server-side into one MP3 stream before playback, so
a Cast device does not need to mix multiple simultaneous audio sources.

The bundled public audio is original procedural replacement audio made for this
project and licensed CC0; no third-party app audio is included.

## Storm controls

- Rain volume: 0–100%
- Thunder volume: 0–100%
- Storm intensity: Original / Calm / Extreme
- Thunder timing: Original (~100 ms light lead) / Realistic (simulated distance)
- Sync correction: -1500 to +1500 ms
- Duration: Endless / 15 / 30 / 60 / 90 min
- Gentle ending: Immediate / 5 / 8 / 12 sec

All runtime controls are stored persistently in `/data/runtime-settings.json`
and restored after app/Home Assistant restarts.

## Cozy room / fireplace mode

Optionally configure a second room independently from the storm room:

```yaml
cozy_enabled: true
cozy_scene: scene.living_room_cozy
cozy_lights: []
cozy_media_player: media_player.living_room_tv
fireplace_media: https://www.youtube.com/watch?v=YOUR_VIDEO_ID
fireplace_volume: 35
```

`fireplace_media` accepts Home Assistant media-source URIs, direct video URLs
and normal YouTube links. Starting with 1.3.3, YouTube URLs are detected
automatically and sent through the native YouTube Cast app instead of being
passed to the generic Cast video receiver.

Supported YouTube URL forms include `youtube.com/watch?v=...`, `youtu.be/...`,
`youtube.com/shorts/...`, `youtube.com/live/...` and `youtube.com/embed/...`.
If a YouTube playlist parameter is present together with a video ID, it is passed
to the Cast app as well.

You can either supply a Home Assistant scene (`cozy_scene`) or leave it blank
and configure entities in `cozy_lights`.

On stop, Bako's Thunderstorm fades the ambience first and then restores the
captured room/player states.
