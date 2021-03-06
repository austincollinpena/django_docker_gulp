FROM python:3.8-buster
MAINTAINER Austin

ENV PYTHONUNBUFFERED 1

# What PIP installs need to get done?
COPY ./requirements.txt /requirements.txt
RUN pip install -r /requirements.txt

# Copy local directory to target new docker directory
RUN mkdir /app
WORKDIR /app
COPY ./app /app

# Install node
RUN apt-get update && apt-get -y install nodejs
RUN apt-get install npm -y

# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Update Node
# Install base dependencies
RUN apt-get update && apt-get install -y -q --no-install-recommends \
        apt-transport-https \
        build-essential \
        ca-certificates \
        curl \
        git \
        libssl-dev \
        wget

ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 12.14.0

WORKDIR $NVM_DIR

RUN curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Make Postgres Work
EXPOSE 5432/tcp


# Install Gulp CLI
WORKDIR /app
RUN npm install gulp-cli -g

# Install Node Modules
WORKDIR /app
RUN npm install
