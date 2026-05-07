# Startpage

## Install

Linux:

```sh
./setup.sh
```

macOS:

```sh
./setup-mac.sh
```

The installer copies the startpage to a user app-data folder, installs the
Python bridge dependencies when possible, starts the local stats/media bridge
services, and prints the `file://` URL to set as your browser homepage or new
tab page.

On macOS, the media widget supports Spotify and Music through AppleScript. The
system stats widget works through `psutil`, but CPU temperature may show as
unavailable because macOS does not expose it through the same sensors API.
