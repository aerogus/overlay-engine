FROM node:lts

LABEL author Guillaume Seznec <guillaume@seznec.fr>

ADD . /app/

CMD ["/app/overlay-engine.sh", "start"]
