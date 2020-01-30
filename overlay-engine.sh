#!/usr/bin/env bash
### BEGIN INIT INFO
# Provides:          overlay-engine
# Required-Start:    $networking $syslog
# Required-Stop:     $networking $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Lancement de overlay-engine au demarrage
# Description:       Enable service provided by daemon.
### END INIT INFO

DATE=`date +"%Y-%m-%d"`
APP_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_NAME=/app/server.js
LOG_NAME=/log/server.log
LOG_DIR=log

echo "Overlay Engine"

start() {
  echo "Démarrage en cours..."

  proc=`forever list | grep $APP_NAME | wc -l`
  if [ $proc -ne "0" ]; then
      echo "ERR app déjà lancée"
      exit 1
  fi

  NODE_ENV=$NODE_ENV forever start -l $APP_PATH$LOG_NAME --append --minUptime 1000ms --spinSleepTime 1000ms $APP_PATH$APP_NAME

  echo "Démarrage terminé"
}

stop() {
  echo "Arrêt en cours..."

  forever stop $APP_PATH$APP_NAME

  echo "Arrêt terminé"
}

install() {
  echo "Installation en cours..."

  # tests des commandes requises
  command -v npm >/dev/null 2>&1 || { echo "ERR: npm non installé. cf. README.md" >&2; exit 1; }
  command -v brunch >/dev/null 2>&1 || { echo "ERR: brunch non installé. cf. README.md" >&2; exit 1; }
  command -v forever >/dev/null 2>&1 || { echo "ERR: forever non installé. cf. README.md" >&2; exit 1; }

  # création répertoire des logs
  if [ ! -d "$LOG_DIR" ]; then
    echo "- Création du répertoire des logs"
    mkdir $LOG_DIR && chmod 777 $LOG_DIR
  else
    echo "- Répertoire des logs déjà créé"
  fi

  # conf: package.json
  echo "- Installation des dépendances npm"
  echo "  Patientez un instant..."
  npm install
  echo "- Dépendances installées"

  # conf: brunch-config.js
  echo "- Compilation webapp (patientez...)"
  echo "  Patientez un instant..."
  ./node_modules/.bin/brunch b -p
  echo "- Compilation terminée"

  echo "Installation terminée"
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    stop
    start
    ;;
  install)
    install
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|install}"
esac
