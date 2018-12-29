#FROM node:carbon
FROM node:9

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
RUN npm i npm@latest -g

COPY package*.json ./

RUN npm install

RUN npm audit fix

# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

EXPOSE 30000 30443
CMD [ "npm", "start" ]


# --- list images:
# docker images

# --- build image:
# docker build -t nobio/timetracker .   

# --- delete image:
# docker rmi <node - name or hash>

# --- delete all images:
# docker rmi $(docker images -q)




# --- start docker container
# docker run -p 30030:30000 -d nobio/timetracker
# docker run --restart=always --name timetracker -p 30030:30000 -d nobio/timetracker
# docker start timetracker

# --- stop running container
# docker container stop <container-id>
# --- stop all running containers
# docker stop $(docker ps -a -q)

# --- remove all containers
# docker rm $(docker ps -a -q)

# --- list running container
# docker container list
# docker ps
# docker ps -a 

# --- log running container
# docker container logs <container-id>
# docker container logs -f <container-id>

# --- exec Linux command inside a container
# docker exec -it <container-hash> <linux-command>
# docker exec -it <container-hash> /bin/bash

# --- delete all containers and images (tabula rasa)
# docker stop $(docker ps -a -q); docker rm $(docker ps -a -q); docker rmi $(docker images -q)
# docker stop $(docker ps -a -q); docker rm $(docker ps -a -q); docker rmi $(docker images -q); docker volume rm $(docker volume list -q);




# --- build with docker-compose
# docker-compose build

# --- start
# docker-compose up -d

# -- stop
# docker-compose down

# --- rebuild
# docker-compose down; docker-compose build; docker-compose up -d; docker-compose logs -f
# docker-compose down; docker-compose pull; docker-compose build; docker-compose up -d; docker-compose logs -f


# --- logging
# docker-compose logs -f


# export TMPDIR=/share/CACHEDEV1_DATA/homes/admin/tmp


# ---- exporting / loading image
# docker save -o <path>/<image-name>matrix-data.tar image-name
# docker save -o ./timetracker.tar timetracker
# docker load -i <path to copied image file>
# docker load -i timetracker

# docker network inspect $(docker network ls -q) |grep -i gateway
