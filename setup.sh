#!/usr/bin/env bash
# Install this startpage and its local bridge services.

set -Eeuo pipefail

APP_NAME="startpage"
OS_NAME="${STARTPAGE_OS_OVERRIDE:-$(uname -s)}"
SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

if [ "$OS_NAME" = "Darwin" ]; then
  DEFAULT_INSTALL_DIR="$HOME/Library/Application Support/startpage"
else
  DEFAULT_INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/startpage"
fi

SYSTEMD_USER_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
DESKTOP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
MAC_APPS_DIR="$HOME/Applications"

INSTALL_DIR=""
PYTHON_BIN=""
SKIP_DEPS=0
SKIP_SERVICES=0
ASSUME_YES=0
LOCATION_MODE=""
MANUAL_LAT=""
MANUAL_LON=""
SERVICES_WRITTEN=0
SERVICES_STARTED=0
SERVICE_PLATFORM=""

log() {
  printf '[%s] %s\n' "$APP_NAME" "$*"
}

warn() {
  printf '[%s] WARNING: %s\n' "$APP_NAME" "$*" >&2
}

die() {
  printf '[%s] ERROR: %s\n' "$APP_NAME" "$*" >&2
  exit 1
}

have() {
  command -v "$1" >/dev/null 2>&1
}

usage() {
  cat <<EOF
Usage: ./setup.sh [options]

Installs the startpage, optional Python dependencies, local bridge services,
and a launcher. Linux uses systemd user services; macOS uses LaunchAgents.

Options:
  --install-dir DIR     Install/copy files to DIR.
                        Default: $DEFAULT_INSTALL_DIR
  --yes                 Use defaults for prompts.
  --no-deps             Do not install Python/playerctl dependencies.
  --no-services         Do not create or start background bridge services.
  --geo                 Set weather to browser geolocation.
  --keep-location       Leave js/config.js weather location unchanged.
  --lat LAT --lon LON   Set manual weather coordinates.
  -h, --help            Show this help.

After install, set your browser homepage/new tab to the printed file:// URL.
EOF
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --install-dir)
        [ "$#" -ge 2 ] || die "--install-dir needs a path"
        INSTALL_DIR="$2"
        shift 2
        ;;
      --yes|-y)
        ASSUME_YES=1
        shift
        ;;
      --no-deps)
        SKIP_DEPS=1
        shift
        ;;
      --no-services)
        SKIP_SERVICES=1
        shift
        ;;
      --geo)
        LOCATION_MODE="geo"
        shift
        ;;
      --keep-location)
        LOCATION_MODE="keep"
        shift
        ;;
      --lat)
        [ "$#" -ge 2 ] || die "--lat needs a value"
        MANUAL_LAT="$2"
        shift 2
        ;;
      --lon)
        [ "$#" -ge 2 ] || die "--lon needs a value"
        MANUAL_LON="$2"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "Unknown option: $1"
        ;;
    esac
  done

  if [ -n "$MANUAL_LAT" ] || [ -n "$MANUAL_LON" ]; then
    [ -n "$MANUAL_LAT" ] && [ -n "$MANUAL_LON" ] || die "Use --lat and --lon together"
    LOCATION_MODE="manual"
  fi
}

ask_yes_no() {
  local prompt="$1"
  local default="${2:-Y}"
  local answer=""

  if [ "$ASSUME_YES" -eq 1 ]; then
    [ "$default" = "Y" ]
    return
  fi

  if [ "$default" = "Y" ]; then
    read -r -p "$prompt [Y/n] " answer
    case "${answer:-Y}" in
      y|Y|yes|YES|Yes) return 0 ;;
      *) return 1 ;;
    esac
  else
    read -r -p "$prompt [y/N] " answer
    case "${answer:-N}" in
      y|Y|yes|YES|Yes) return 0 ;;
      *) return 1 ;;
    esac
  fi
}

choose_install_dir() {
  if [ -z "$INSTALL_DIR" ]; then
    if [ "$ASSUME_YES" -eq 1 ]; then
      INSTALL_DIR="$DEFAULT_INSTALL_DIR"
    else
      read -r -p "Install directory [$DEFAULT_INSTALL_DIR]: " INSTALL_DIR
      INSTALL_DIR="${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}"
    fi
  fi

  case "$INSTALL_DIR" in
    "~") INSTALL_DIR="$HOME" ;;
    "~/"*) INSTALL_DIR="$HOME/${INSTALL_DIR#"~/"}" ;;
  esac

  case "$INSTALL_DIR" in
    /*) ;;
    *) INSTALL_DIR="$PWD/$INSTALL_DIR" ;;
  esac
}

copy_files() {
  log "Installing files to $INSTALL_DIR"
  mkdir -p "$INSTALL_DIR"

  if [ "$SOURCE_DIR" != "$INSTALL_DIR" ]; then
    if have rsync; then
      rsync -a \
        --exclude '.git/' \
        --exclude '.venv/' \
        --exclude '.DS_Store' \
        "$SOURCE_DIR/" "$INSTALL_DIR/"
    else
      (
        cd "$SOURCE_DIR"
        find . -mindepth 1 -maxdepth 1 \
          ! -name '.git' \
          ! -name '.venv' \
          ! -name '.DS_Store' \
          -exec cp -a {} "$INSTALL_DIR/" \;
      )
    fi
  fi

  chmod +x "$INSTALL_DIR/setup.sh" || true
  if [ -f "$INSTALL_DIR/setup-mac.sh" ]; then
    chmod +x "$INSTALL_DIR/setup-mac.sh" || true
  fi
  chmod +x "$INSTALL_DIR/scripts/media-bridge.py" "$INSTALL_DIR/scripts/stats-bridge.py" || true
}

install_system_packages() {
  if [ "$SKIP_DEPS" -eq 1 ]; then
    return 1
  fi

  if ! ask_yes_no "Install system packages with sudo when possible?" "Y"; then
    return 1
  fi

  if have pacman; then
    sudo pacman -S --needed python python-psutil python-websockets playerctl
  elif have apt-get; then
    sudo apt-get update
    sudo apt-get install -y python3 python3-venv python3-psutil python3-websockets playerctl
  elif have dnf; then
    sudo dnf install -y python3 python3-psutil python3-websockets playerctl
  elif have zypper; then
    sudo zypper install -y python3 python3-psutil python3-websockets playerctl
  elif have apk; then
    sudo apk add python3 py3-psutil py3-websockets playerctl
  else
    warn "No supported package manager found; trying a Python virtualenv instead."
    return 1
  fi
}

python_has_bridge_modules() {
  "$1" - <<'PY' >/dev/null 2>&1
import psutil
import websockets
PY
}

create_venv() {
  local venv_dir="$INSTALL_DIR/.venv"

  [ "$SKIP_DEPS" -eq 0 ] || return 1

  if ! have python3; then
    die "python3 is required. Install Python, then rerun setup.sh."
  fi

  log "Creating Python virtualenv at $venv_dir"
  python3 -m venv "$venv_dir" || die "Could not create virtualenv. On Debian/Ubuntu, install python3-venv."
  "$venv_dir/bin/python" -m pip install --upgrade pip
  "$venv_dir/bin/python" -m pip install psutil websockets
  PYTHON_BIN="$venv_dir/bin/python"
}

ensure_dependencies() {
  if [ "$OS_NAME" = "Darwin" ]; then
    ensure_macos_dependencies
    return
  fi

  if have python3 && python_has_bridge_modules "$(command -v python3)"; then
    PYTHON_BIN="$(command -v python3)"
  else
    install_system_packages || true

    if have python3 && python_has_bridge_modules "$(command -v python3)"; then
      PYTHON_BIN="$(command -v python3)"
    else
      create_venv || warn "Python bridge modules are not installed. Stats/media services may fail."
    fi
  fi

  if [ -z "$PYTHON_BIN" ] && have python3; then
    PYTHON_BIN="$(command -v python3)"
  fi

  if [ -z "$PYTHON_BIN" ]; then
    die "No usable python3 found."
  fi

  if ! have playerctl; then
    warn "playerctl was not found. The media widget will not control music until playerctl is installed."
  fi
}

ensure_macos_dependencies() {
  if ! have python3; then
    if [ "$SKIP_DEPS" -eq 0 ] && have brew && ask_yes_no "Install Python with Homebrew?" "Y"; then
      brew install python
    else
      die "python3 is required on macOS. Install it with Homebrew: brew install python"
    fi
  fi

  if have python3 && python_has_bridge_modules "$(command -v python3)"; then
    PYTHON_BIN="$(command -v python3)"
  else
    create_venv || warn "Python bridge modules are not installed. Stats/media services may fail."
  fi

  if [ -z "$PYTHON_BIN" ] && have python3; then
    PYTHON_BIN="$(command -v python3)"
  fi

  log "macOS media bridge will use AppleScript for Spotify and Music."
}

valid_number() {
  "$PYTHON_BIN" - "$1" <<'PY' >/dev/null 2>&1
import math
import sys

value = float(sys.argv[1])
raise SystemExit(0 if math.isfinite(value) else 1)
PY
}

valid_coordinates() {
  "$PYTHON_BIN" - "$1" "$2" <<'PY' >/dev/null 2>&1
import math
import sys

lat = float(sys.argv[1])
lon = float(sys.argv[2])
ok = math.isfinite(lat) and math.isfinite(lon) and -90 <= lat <= 90 and -180 <= lon <= 180
raise SystemExit(0 if ok else 1)
PY
}

choose_location() {
  if [ -n "$LOCATION_MODE" ]; then
    return
  fi

  if [ "$ASSUME_YES" -eq 1 ]; then
    LOCATION_MODE="geo"
    return
  fi

  cat <<EOF

Weather location:
  1) Use browser geolocation
  2) Keep the current js/config.js location
  3) Enter manual coordinates
EOF

  local choice=""
  read -r -p "Choose [1]: " choice
  case "${choice:-1}" in
    2) LOCATION_MODE="keep" ;;
    3)
      LOCATION_MODE="manual"
      read -r -p "Latitude: " MANUAL_LAT
      read -r -p "Longitude: " MANUAL_LON
      ;;
    *) LOCATION_MODE="geo" ;;
  esac
}

write_location_config() {
  local config_js="$INSTALL_DIR/js/config.js"
  [ -f "$config_js" ] || die "Missing $config_js"

  choose_location

  case "$LOCATION_MODE" in
    keep)
      log "Leaving weather location unchanged."
      return
      ;;
    geo)
      log "Configuring weather for browser geolocation."
      "$PYTHON_BIN" - "$config_js" <<'PY'
import pathlib
import re
import sys

path = pathlib.Path(sys.argv[1])
text = path.read_text()
block = (
    "// Location\n"
    "// Browser geolocation configured by setup.sh.\n"
    "const LOCATION = null;\n"
)
pattern = r"(?ms)^//.*Location.*?\n(?:^//.*\n)*const\s+LOCATION\s*=\s*.*?;\n"
if re.search(pattern, text):
    text = re.sub(pattern, block, text, count=1)
else:
    text = re.sub(r"(?s)const\s+LOCATION\s*=\s*.*?;", "const LOCATION = null;", text, count=1)
path.write_text(text)
PY
      ;;
    manual)
      valid_number "$MANUAL_LAT" || die "Invalid latitude: $MANUAL_LAT"
      valid_number "$MANUAL_LON" || die "Invalid longitude: $MANUAL_LON"
      valid_coordinates "$MANUAL_LAT" "$MANUAL_LON" || die "Coordinates out of range. Latitude must be -90..90 and longitude must be -180..180."
      log "Configuring weather for $MANUAL_LAT, $MANUAL_LON."
      "$PYTHON_BIN" - "$config_js" "$MANUAL_LAT" "$MANUAL_LON" <<'PY'
import pathlib
import re
import sys

path = pathlib.Path(sys.argv[1])
lat = sys.argv[2]
lon = sys.argv[3]
text = path.read_text()
block = (
    "// Location\n"
    "// Manual coordinates configured by setup.sh.\n"
    f"const LOCATION = {{ lat: {lat}, lon: {lon} }};\n"
)
pattern = r"(?ms)^//.*Location.*?\n(?:^//.*\n)*const\s+LOCATION\s*=\s*.*?;\n"
if re.search(pattern, text):
    text = re.sub(pattern, block, text, count=1)
else:
    text = re.sub(r"(?s)const\s+LOCATION\s*=\s*.*?;", f"const LOCATION = {{ lat: {lat}, lon: {lon} }};", text, count=1)
path.write_text(text)
PY
      ;;
    *)
      die "Unknown location mode: $LOCATION_MODE"
      ;;
  esac
}

systemd_quote() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '"%s"' "$value"
}

write_service() {
  local name="$1"
  local description="$2"
  local script_path="$3"
  local service_path="$SYSTEMD_USER_DIR/$name.service"
  local python_arg script_arg workdir_arg

  python_arg="$(systemd_quote "$PYTHON_BIN")"
  script_arg="$(systemd_quote "$script_path")"
  workdir_arg="$(systemd_quote "$INSTALL_DIR")"

  mkdir -p "$SYSTEMD_USER_DIR"
  cat > "$service_path" <<EOF
[Unit]
Description=$description
After=default.target

[Service]
Type=simple
WorkingDirectory=$workdir_arg
ExecStart=$python_arg $script_arg
Restart=on-failure
RestartSec=2

[Install]
WantedBy=default.target
EOF
}

install_services() {
  if [ "$SKIP_SERVICES" -eq 1 ]; then
    log "Skipping background bridge services."
    return
  fi

  if [ "$OS_NAME" = "Darwin" ]; then
    install_launch_agents
    return
  fi

  install_systemd_services
}

install_systemd_services() {
  log "Writing systemd user services."
  write_service "startpage-stats" "Startpage system stats bridge" "$INSTALL_DIR/scripts/stats-bridge.py"
  write_service "startpage-media" "Startpage media bridge" "$INSTALL_DIR/scripts/media-bridge.py"
  SERVICES_WRITTEN=1
  SERVICE_PLATFORM="systemd"

  if have systemctl && systemctl --user show-environment >/dev/null 2>&1; then
    systemctl --user daemon-reload
    systemctl --user enable --now startpage-stats.service startpage-media.service
    SERVICES_STARTED=1
    log "Started startpage-stats.service and startpage-media.service."
  else
    warn "systemctl --user is not available right now. Services were written but not started."
    warn "Start them later with: systemctl --user enable --now startpage-stats.service startpage-media.service"
  fi
}

write_launch_agent() {
  local label="$1"
  local script_path="$2"
  local stdout_path="$HOME/Library/Logs/$label.log"
  local stderr_path="$HOME/Library/Logs/$label.err.log"
  local plist_path="$LAUNCH_AGENT_DIR/$label.plist"

  mkdir -p "$LAUNCH_AGENT_DIR" "$HOME/Library/Logs"
  "$PYTHON_BIN" - "$plist_path" "$label" "$PYTHON_BIN" "$script_path" "$INSTALL_DIR" "$stdout_path" "$stderr_path" <<'PY'
import plistlib
import sys

plist_path, label, python_bin, script_path, workdir, stdout_path, stderr_path = sys.argv[1:]
data = {
    "Label": label,
    "ProgramArguments": [python_bin, script_path],
    "WorkingDirectory": workdir,
    "RunAtLoad": True,
    "KeepAlive": True,
    "StandardOutPath": stdout_path,
    "StandardErrorPath": stderr_path,
    "EnvironmentVariables": {
        "PATH": "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
    },
}
with open(plist_path, "wb") as f:
    plistlib.dump(data, f, sort_keys=False)
PY
}

install_launch_agents() {
  local gui_target="gui/$(id -u)"

  log "Writing macOS LaunchAgents."
  write_launch_agent "com.startpage.stats" "$INSTALL_DIR/scripts/stats-bridge.py"
  write_launch_agent "com.startpage.media" "$INSTALL_DIR/scripts/media-bridge.py"
  SERVICES_WRITTEN=1
  SERVICE_PLATFORM="launchd"

  if have launchctl; then
    launchctl bootout "$gui_target" "$LAUNCH_AGENT_DIR/com.startpage.stats.plist" >/dev/null 2>&1 || true
    launchctl bootout "$gui_target" "$LAUNCH_AGENT_DIR/com.startpage.media.plist" >/dev/null 2>&1 || true
    launchctl bootstrap "$gui_target" "$LAUNCH_AGENT_DIR/com.startpage.stats.plist"
    launchctl bootstrap "$gui_target" "$LAUNCH_AGENT_DIR/com.startpage.media.plist"
    launchctl enable "$gui_target/com.startpage.stats" >/dev/null 2>&1 || true
    launchctl enable "$gui_target/com.startpage.media" >/dev/null 2>&1 || true
    launchctl kickstart -k "$gui_target/com.startpage.stats" >/dev/null 2>&1 || true
    launchctl kickstart -k "$gui_target/com.startpage.media" >/dev/null 2>&1 || true
    SERVICES_STARTED=1
    log "Started com.startpage.stats and com.startpage.media LaunchAgents."
  else
    warn "launchctl is not available. LaunchAgents were written but not started."
  fi
}

file_url() {
  "$PYTHON_BIN" - "$1" <<'PY'
import pathlib
import sys

print(pathlib.Path(sys.argv[1]).resolve().as_uri())
PY
}

install_desktop_launcher() {
  local index_url="$1"
  local desktop_file="$DESKTOP_DIR/startpage.desktop"

  mkdir -p "$DESKTOP_DIR"
  cat > "$desktop_file" <<EOF
[Desktop Entry]
Type=Application
Name=Startpage
Comment=Open local startpage
Exec=xdg-open $index_url
Icon=$INSTALL_DIR/icons/moon.png
Terminal=false
Categories=Utility;
EOF

  if have update-desktop-database; then
    update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true
  fi
}

install_macos_launcher() {
  local index_url="$1"
  local launcher_file="$MAC_APPS_DIR/Startpage.command"

  mkdir -p "$MAC_APPS_DIR"
  cat > "$launcher_file" <<EOF
#!/usr/bin/env bash
open "$index_url"
EOF
  chmod +x "$launcher_file"
}

install_launcher() {
  local index_url="$1"

  if [ "$OS_NAME" = "Darwin" ]; then
    install_macos_launcher "$index_url"
  else
    install_desktop_launcher "$index_url"
  fi
}

print_done() {
  local index_url="$1"

  cat <<EOF

Done.

Installed at:
  $INSTALL_DIR

Open it with:
  $index_url

To make it your browser start page, set your homepage or new-tab URL to the
file:// URL above.

EOF

  if [ "$SERVICES_STARTED" -eq 1 ]; then
    if [ "$SERVICE_PLATFORM" = "launchd" ]; then
      cat <<EOF
Bridge services:
  launchctl print gui/\$(id -u)/com.startpage.stats
  launchctl print gui/\$(id -u)/com.startpage.media
EOF
    else
      cat <<EOF
Bridge services:
  systemctl --user status startpage-stats.service
  systemctl --user status startpage-media.service
EOF
    fi
  elif [ "$SERVICES_WRITTEN" -eq 1 ]; then
    if [ "$SERVICE_PLATFORM" = "launchd" ]; then
      cat <<EOF
Bridge services were written but not started. Start them with:
  launchctl bootstrap gui/\$(id -u) "$LAUNCH_AGENT_DIR/com.startpage.stats.plist"
  launchctl bootstrap gui/\$(id -u) "$LAUNCH_AGENT_DIR/com.startpage.media.plist"
EOF
    else
      cat <<EOF
Bridge services were written but not started. Start them with:
  systemctl --user enable --now startpage-stats.service startpage-media.service
EOF
    fi
  else
    cat <<EOF
Bridge services were skipped.
EOF
  fi

  cat <<EOF

Re-run this installer any time after pulling updates.
EOF
}

main() {
  parse_args "$@"

  log "Source directory: $SOURCE_DIR"
  choose_install_dir
  copy_files
  ensure_dependencies
  write_location_config
  install_services

  local index_url
  index_url="$(file_url "$INSTALL_DIR/index.html")"
  install_launcher "$index_url"
  print_done "$index_url"
}

main "$@"
