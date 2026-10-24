#!/usr/bin/env bash
set -euo pipefail

# Linux x86_64 cloud installation; no root or system package edits.
# Official checksums retrieved on 2026-10-24 from:
# https://dl.google.com/android/repository/repository2-1.xml
# https://downloads.gradle.org/distributions/gradle-8.13-bin.zip.sha256
# https://packages.microsoft.com/repos/microsoft-debian-bookworm-prod/dists/bookworm/main/binary-amd64/Packages.gz
# Android sdkmanager verifies SDK package archives using official repository metadata.
# Standard Android SDK licenses are accepted as part of installing these packages.
if [ "$(uname -s)" != Linux ] || [ "$(uname -m)" != x86_64 ]; then
  echo 'Este instalador requer Linux x86_64.' >&2
  exit 1
fi
agitta_script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
export AGITTA_ANDROID_HOME="${AGITTA_ANDROID_HOME:-/workspace/.cache/agitta-android}"
agitta_downloads="$AGITTA_ANDROID_HOME/downloads"
mkdir -p "$agitta_downloads" "$AGITTA_ANDROID_HOME/tmp" "$AGITTA_ANDROID_HOME/android-user"

agitta_verify() {
  python3 - "$1" "$2" "$3" <<'PY'
import hashlib, pathlib, sys
path, algorithm, expected = sys.argv[1:]
p = pathlib.Path(path)
if not p.is_file():
    sys.exit(1)
h = hashlib.new(algorithm)
with p.open('rb') as f:
    for block in iter(lambda: f.read(1024 * 1024), b''):
        h.update(block)
sys.exit(0 if h.hexdigest() == expected else 1)
PY
}

agitta_download() {
  local url="$1" file="$agitta_downloads/$2" algorithm="$3" digest="$4"
  if ! agitta_verify "$file" "$algorithm" "$digest"; then
    curl -fsSL --retry 2 "$url" -o "$file.part"
    if ! agitta_verify "$file.part" "$algorithm" "$digest"; then
      echo "Checksum inválido: $2" >&2
      exit 1
    fi
    mv "$file.part" "$file"
  fi
}

agitta_download \
  https://dl.google.com/android/repository/commandlinetools-linux-16111833_latest.zip \
  commandlinetools-linux-16111833_latest.zip sha1 e025545c62a8e64c7559119566a569fb1dec5f60
agitta_download \
  https://downloads.gradle.org/distributions/gradle-8.13-bin.zip \
  gradle-8.13-bin.zip sha256 20f1b1176237254a6fc204d8434196fa11a4cfb387567519c61556e8710aed78
agitta_download \
  https://packages.microsoft.com/repos/microsoft-debian-bookworm-prod/pool/main/m/msopenjdk-17/msopenjdk-17_17.0.21.0.2-1_amd64.deb \
  msopenjdk-17.deb sha256 57a7d92e448bb56c6d51547cb91e1e179bc13d647006e87b9c92f2f4f41e2c6d

if [ ! -x "$AGITTA_ANDROID_HOME/jdk/usr/lib/jvm/msopenjdk-17-amd64/bin/javac" ]; then
  mkdir -p "$AGITTA_ANDROID_HOME/jdk"
  dpkg-deb -x "$agitta_downloads/msopenjdk-17.deb" "$AGITTA_ANDROID_HOME/jdk"
fi
if [ ! -x "$AGITTA_ANDROID_HOME/gradle-8.13/bin/gradle" ]; then
  unzip -q "$agitta_downloads/gradle-8.13-bin.zip" -d "$AGITTA_ANDROID_HOME"
fi
if [ ! -x "$AGITTA_ANDROID_HOME/sdk/cmdline-tools/latest/bin/sdkmanager" ]; then
  mkdir -p "$AGITTA_ANDROID_HOME/sdk/cmdline-tools"
  agitta_extract="$(mktemp -d "$AGITTA_ANDROID_HOME/tmp/cmdline.XXXXXX")"
  unzip -q "$agitta_downloads/commandlinetools-linux-16111833_latest.zip" -d "$agitta_extract"
  mv "$agitta_extract/cmdline-tools" "$AGITTA_ANDROID_HOME/sdk/cmdline-tools/latest"
  rmdir "$agitta_extract"
fi

# Extend a private copy of standard Java trust roots with the platform's
# configured CA, if present. TLS and package checks remain enabled.
agitta_jdk="$AGITTA_ANDROID_HOME/jdk/usr/lib/jvm/msopenjdk-17-amd64"
cp "$agitta_jdk/lib/security/cacerts" "$AGITTA_ANDROID_HOME/java-cacerts"
if [ -n "${NODE_EXTRA_CA_CERTS:-}" ] && [ -f "$NODE_EXTRA_CA_CERTS" ]; then
  "$agitta_jdk/bin/keytool" -importcert -noprompt -alias agitta-cloud-egress \
    -file "$NODE_EXTRA_CA_CERTS" -keystore "$AGITTA_ANDROID_HOME/java-cacerts" -storepass changeit
fi

# shellcheck source=android-env.sh
. "$agitta_script_dir/android-env.sh"
python3 -c "print('y\\n' * 30)" | sdkmanager --sdk_root="$ANDROID_HOME" \
  'platform-tools' 'platforms;android-35' 'build-tools;35.0.0'
javac -version
gradle --version
echo 'Android SDK pronto. Ative com: . scripts/android-env.sh'
