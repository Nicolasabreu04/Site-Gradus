FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copia o site principal para /site e o root index para a homepage
COPY site/ ./site/
COPY index.html ./
COPY assets/ ./assets/

# Copia o jogo VR para /vr-game
COPY vr-game/ ./vr-game/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
