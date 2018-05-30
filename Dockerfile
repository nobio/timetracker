#FROM node:carbon
FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm i npm@latest -g
RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

EXPOSE 30000
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
# docker run -p 30000:30000 -d nobio/timetracker

# --- stop running container
# docker container stop <container-id>

# --- list running container
# docker container list
# docker ps

# --- log running container
# docker container logs <container-id>
# docker container logs -f <container-id>

# --- exec Linux command inside a container
# docker exec -it <container-hash> <linux-command>
