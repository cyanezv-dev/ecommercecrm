#!/usr/bin/env bash
# Crear o actualizar una app en DigitalOcean App Platform desde este repo.
# Requisitos: https://docs.digitalocean.com/reference/doctl/how-to/install/
#   export DIGITALOCEAN_ACCESS_TOKEN="dop_v1_..."
# Primera vez (crea la app y muestra el id):
#   ./deploy/do-app.sh
# Siguientes (misma app, p. ej. tras editar .do/app.yaml):
#   export DO_APP_ID="uuid-de-la-app"
#   ./deploy/do-app.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPEC="$ROOT/.do/app.yaml"

if ! command -v doctl >/dev/null 2>&1; then
  echo "Instalá doctl: https://docs.digitalocean.com/reference/doctl/how-to/install/"
  exit 1
fi

if [[ -z "${DIGITALOCEAN_ACCESS_TOKEN:-}" ]]; then
  echo "Definí DIGITALOCEAN_ACCESS_TOKEN (API token en DO → API → Tokens)."
  exit 1
fi
export DIGITALOCEAN_ACCESS_TOKEN

if [[ -n "${DO_APP_ID:-}" ]]; then
  echo "Actualizando app $DO_APP_ID..."
  doctl apps update "$DO_APP_ID" --spec "$SPEC"
else
  echo "Creando app (guardá el id de la salida como DO_APP_ID para próximas veces)..."
  doctl apps create --spec "$SPEC"
fi
