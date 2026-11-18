#!/usr/bin/env bash
set -euo pipefail

MANIFEST="android/app/src/main/AndroidManifest.xml"
CONFIG_DIR="android/app/src/main/res/xml"
CONFIG_FILE="$CONFIG_DIR/network_security_config.xml"

if [[ ! -f "$MANIFEST" ]]; then
  echo "Android ainda não foi criado. Execute primeiro: npx cap add android"
  exit 1
fi

mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_FILE" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true" />
</network-security-config>
XML

python3 - "$MANIFEST" <<'PY'
from pathlib import Path
import re
import sys

manifest = Path(sys.argv[1])
text = manifest.read_text(encoding="utf-8")
application = re.search(r"<application\b[^>]*>", text)

if application is None:
    raise SystemExit("Não foi encontrada a tag <application> no AndroidManifest.xml.")

tag = application.group(0)
if "android:networkSecurityConfig=" not in tag:
    updated = tag[:-1] + ' android:networkSecurityConfig="@xml/network_security_config">'
    text = text[:application.start()] + updated + text[application.end():]
    manifest.write_text(text, encoding="utf-8")

print("Configuração de HTTP local aplicada ao AndroidManifest.xml.")
PY

echo "Atenção: cleartext está habilitado para este APK demonstrativo."
