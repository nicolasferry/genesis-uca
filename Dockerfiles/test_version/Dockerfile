FROM openjdk:11.0.4-jre-stretch

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash

SHELL ["bash", "-lc"]

# hadolint ignore=DL3009
RUN apt-get update -qq && apt-get install -qq --no-install-recommends \
  curl \
  gnupg2

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -qq && apt-get install -qq --no-install-recommends \
  nodejs \
  yarn \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN apt-get update
RUN apt-get install -y git 

RUN git clone https://gitlab.com/enact/GeneSIS.git
WORKDIR "/GeneSIS/src"
RUN npm install

RUN apt-get purge -y --auto-remove wget gnupg dirmngr
RUN apt-get purge -y --auto-remove git
