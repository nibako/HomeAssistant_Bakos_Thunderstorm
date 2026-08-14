FROM ghcr.io/home-assistant/base:latest

ARG BUILD_VERSION=1.3.1
ARG BUILD_ARCH=amd64

RUN apk add --no-cache \
      python3 \
      py3-aiohttp \
      py3-paho-mqtt \
      py3-numpy \
      ffmpeg \
      lame

COPY run.sh /
COPY app.py /app/app.py
COPY web /app/web
COPY generate_audio.py /tmp/generate_audio.py
RUN mkdir -p /app/audio \
    && python3 /tmp/generate_audio.py \
    && rm -f /tmp/generate_audio.py \
    && chmod a+x /run.sh

LABEL \
  io.hass.version="$BUILD_VERSION" \
  io.hass.type="app" \
  io.hass.arch="$BUILD_ARCH"

CMD [ "/run.sh" ]
