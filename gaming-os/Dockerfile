# Linux gaming compatibility container. NOT a bootable VM or hostile-code sandbox.
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
    xvfb xauth x11-utils dbus-x11 x11vnc novnc websockify openbox xterm \
    curl wget unzip file procps python3 \
 && rm -rf /var/lib/apt/lists/*
RUN useradd -m -u 10001 -s /bin/bash gamer
COPY entrypoint.sh /usr/local/bin/exe-deck-entrypoint
COPY game-session.sh /usr/local/bin/exe-deck-session
COPY install-steam.sh /usr/local/bin/exe-deck-install-steam
COPY run-game.sh /usr/local/bin/exe-deck-run-game
RUN chmod 755 /usr/local/bin/exe-deck-*
USER gamer
WORKDIR /home/gamer
ENV WINEPREFIX=/home/gamer/.wine WINEDEBUG=-all
ENTRYPOINT ["/usr/local/bin/exe-deck-entrypoint"]
