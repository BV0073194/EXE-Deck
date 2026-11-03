# Reproducible Linux compatibility environment, NOT a bootable VM disk.
FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN dpkg --add-architecture i386 \
 && apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates software-properties-common \
 && add-apt-repository -y universe \
 && add-apt-repository -y multiverse \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
    bash wine wine64 wine32 winetricks cabextract p7zip-full \
    mesa-vulkan-drivers mesa-vulkan-drivers:i386 vulkan-tools \
    libvulkan1 libvulkan1:i386 mesa-utils \
    xvfb xauth x11-utils dbus-x11 \
    curl wget unzip file procps \
 && rm -rf /var/lib/apt/lists/*
RUN useradd -m -u 10001 -s /bin/bash gamer
USER gamer
WORKDIR /home/gamer
ENV WINEPREFIX=/home/gamer/.wine WINEDEBUG=-all
COPY --chown=gamer:gamer entrypoint.sh /usr/local/bin/exe-deck-entrypoint
ENTRYPOINT ["/bin/bash", "/usr/local/bin/exe-deck-entrypoint"]
