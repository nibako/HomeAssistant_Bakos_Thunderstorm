# Changelog

## 1.3.3

- Fixed fireplace playback when `fireplace_media` contains a YouTube URL.
- Added automatic YouTube video-ID extraction for watch, youtu.be, Shorts, Live and Embed URLs.
- YouTube fireplace media now uses Home Assistant's native `media_content_type: cast` payload with `app_name: youtube`.
- Direct video files, HTTP(S) streams and Home Assistant media-source URIs continue to use the existing generic video path.

## 1.3.2

- Public branding is now **Bako's Thunderstorm** throughout the Home Assistant UI and documentation.
- Updated Home Assistant app name, panel title, MQTT Discovery branding, web UI and documentation.
- Renamed the visible intensity label `Original Strong` to `Original` without changing the underlying original storm behavior.
- Kept the internal slug and technical identifiers unchanged for update compatibility.

## 1.3.1

- First repository-ready public release.
- Replaced private extracted audio with original procedural CC0 replacement audio.
- Removed user-specific cozy-light defaults.
- Updated Home Assistant repository metadata and public documentation.
- Retains persistent settings and gentle session ending introduced in 1.3.0.

## 1.3.0

- Persist runtime session settings in `/data/runtime-settings.json` and restore
  them after restart.
- Added selectable gentle session ending (0 / 5 / 8 / 12 seconds).
- Stop now prevents new storm events before fading and restoring room states.
