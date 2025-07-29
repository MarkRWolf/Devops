FROM nginx:stable-alpine
RUN apk add --no-cache gettext
COPY nginx.conf.template /etc/nginx/nginx.conf.template
CMD envsubst '$API_INTERNAL_HOST $API_INTERNAL_PORT $WEB_INTERNAL_HOST $WEB_INTERNAL_PORT' \
      < /etc/nginx/nginx.conf.template \
      > /etc/nginx/nginx.conf \
    && nginx -g 'daemon off;'
