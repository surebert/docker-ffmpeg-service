FROM jrottenberg/ffmpeg:centos

MAINTAINER Paul Visco <paul.visco@gmail.com>

#####################################################################
#
# A Docker image to convert audio and video for web using web API
#
#   with
#     - Latest FFMPEG (built)
#     - NodeJS
#     - fluent-ffmpeg
#
#   For more on Fluent-FFMPEG, see 
#
#            https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
#
#####################################################################

# Add the following two dependencies for nodejs
RUN yum install -y git
RUN yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
RUN yum install -y nodejs npm --enablerepo=epel

WORKDIR /usr/local/src

# Custom Builds go here
RUN npm install -g fluent-ffmpeg

# Remove all tmpfile and cleanup
# =================================
WORKDIR /usr/local/
RUN rm -rf /usr/local/src
RUN yum clean all
RUN rm -rf /var/cache/yum

# =================================

# Setup a working directory to allow for
# docker run --rm -ti -v ${PWD}:/work ...
# =======================================
WORKDIR /work

# Make sure Node.js is installed
RUN           node -v
RUN           npm -v

#Create app dir
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

#Install Dependencies
COPY package.json /usr/src/app
RUN npm install

#Bundle app source
COPY . /usr/src/app

EXPOSE 3000
ENTRYPOINT []
CMD [ "node", "app.js" ]