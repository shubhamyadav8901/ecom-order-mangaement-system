#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script is only for macOS (Darwin)."
  exit 1
fi

if ! command -v brew >/dev/null 2>&1; then
  cat <<'MSG'
Homebrew is required but not installed.
Install it first:
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
MSG
  exit 1
fi

install_formula() {
  local formula="$1"
  if brew list --versions "$formula" >/dev/null 2>&1; then
    echo "[skip] $formula already installed"
  else
    echo "[install] $formula"
    brew install "$formula"
  fi
}

install_cask() {
  local cask="$1"
  if brew list --cask --versions "$cask" >/dev/null 2>&1; then
    echo "[skip] $cask already installed"
  else
    echo "[install] $cask"
    brew install --cask "$cask"
  fi
}

echo "Updating Homebrew..."
brew update

install_formula openjdk@17
install_formula maven
install_formula node
install_formula docker-compose
install_cask docker

echo
cat <<'MSG'
Setup complete.

If Java 17 is not your default, add this to your shell profile:
  export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
  export PATH="$JAVA_HOME/bin:$PATH"

Then verify:
  java -version
  mvn -version
  node -v
  docker --version
  docker compose version
MSG
