#!/usr/bin/env bash
# Source this file before Cordova commands: . scripts/android-env.sh
export AGITTA_ANDROID_HOME="${AGITTA_ANDROID_HOME:-/workspace/.cache/agitta-android}"
export JAVA_HOME="$AGITTA_ANDROID_HOME/jdk/usr/lib/jvm/msopenjdk-17-amd64"
export ANDROID_HOME="$AGITTA_ANDROID_HOME/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export ANDROID_USER_HOME="$AGITTA_ANDROID_HOME/android-user"
export ANDROID_EMULATOR_HOME="$AGITTA_ANDROID_HOME/android-user"
export ANDROID_AVD_HOME="$AGITTA_ANDROID_HOME/avd"
export GRADLE_USER_HOME="$AGITTA_ANDROID_HOME/gradle-user"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$AGITTA_ANDROID_HOME/gradle-8.13/bin:$PATH"
export CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL="file://$AGITTA_ANDROID_HOME/downloads/gradle-8.13-bin.zip"

# Java tools do not read HTTPS_PROXY. Use the existing proxy without logging
# credentials, and retain all normal TLS checks with a private trust store.
_agitta_java_options="-Djava.io.tmpdir=$AGITTA_ANDROID_HOME/tmp"
if [ -f "$AGITTA_ANDROID_HOME/java-cacerts" ]; then
  _agitta_java_options="$_agitta_java_options -Djavax.net.ssl.trustStore=$AGITTA_ANDROID_HOME/java-cacerts -Djavax.net.ssl.trustStorePassword=changeit"
fi
if [ -n "${HTTPS_PROXY:-}" ]; then
  mapfile -t _agitta_proxy_parts < <(node --input-type=module -e 'const u=new URL(process.env.HTTPS_PROXY); if(u.username||u.password) process.exit(1); console.log(u.hostname); console.log(u.port || (u.protocol === "https:" ? "443" : "80"));')
  if [ "${#_agitta_proxy_parts[@]}" -eq 2 ]; then
    _agitta_java_options="$_agitta_java_options -Dhttp.proxyHost=${_agitta_proxy_parts[0]} -Dhttp.proxyPort=${_agitta_proxy_parts[1]} -Dhttps.proxyHost=${_agitta_proxy_parts[0]} -Dhttps.proxyPort=${_agitta_proxy_parts[1]} -Dhttp.nonProxyHosts=localhost|127.*|[::1]"
  fi
fi
if [ -z "${AGITTA_ORIGINAL_JAVA_TOOL_OPTIONS_SET:-}" ]; then
  export AGITTA_ORIGINAL_JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-}"
  export AGITTA_ORIGINAL_JAVA_TOOL_OPTIONS_SET=1
fi
export JAVA_TOOL_OPTIONS="${AGITTA_ORIGINAL_JAVA_TOOL_OPTIONS:+$AGITTA_ORIGINAL_JAVA_TOOL_OPTIONS }$_agitta_java_options"
unset _agitta_java_options _agitta_proxy_parts
