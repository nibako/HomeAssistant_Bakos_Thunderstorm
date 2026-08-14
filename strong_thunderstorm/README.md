# Bako's Thunderstorm 1.3.3

**Creator: Bako**

Home Assistant app/add-on for synchronized Zigbee2MQTT thunderstorm lighting,
a dynamically mixed single audio stream for Cast/Nest devices, and an optional
cozy living-room/fireplace mode.

## 1.3.3 public release

- Fixed fireplace playback when `fireplace_media` is a YouTube URL.
- Common YouTube links (`youtube.com/watch`, `youtu.be`, Shorts, Live and Embed)
  are now converted automatically to Home Assistant's native YouTube Cast payload.
- Direct MP4, generic HTTP(S) video URLs and Home Assistant media-source URIs
  continue to use the normal media-player path.
- Public branding remains **Bako's Thunderstorm**.
- Internal slug remains `strong_thunderstorm` so existing installations update cleanly.

See `DOCS.md` for configuration details.
