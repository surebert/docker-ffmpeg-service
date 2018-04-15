# ffmpeg web service API

An web service for converting audio/video files using Nodejs, Express and FFMPEG

Based off of jrottenberg/ffmpeg container

## Endpoints

> POST /mp3 - Convert audio file in request body to mp3

> POST /mp4 - Convert video file in request body to mp4

> POST /jpg - Convert image file to jpg

> GET /, /readme - Web Service Readme

### /mp3, /m4a

Curl Ex:

> curl -F "file=@input.wav" 127.0.0.1:3000/mp3  > output.mp3

> curl -F "file=@input.m4a" 127.0.0.1:3000/mp3  > output.mp3

> curl -F "file=@input.mov" 127.0.0.1:3000/mp4  > output.mp4

> curl -F "file=@input.mp4" 127.0.0.1:3000/mp4  > output.mp4

> curl -F "file=@input.tiff" 127.0.0.1:3000/jpg  > output.jpg

> curl -F "file=@input.png" 127.0.0.1:3000/jpg  > output.jpg

## Configuration and New Endpoints
You can change the ffmpeg conversion settings or add new endpoints by editing 
the /app/endpoints.js file

## Installation

Requires local Node and FFMPEG installation.

1) Install FFMPEG https://ffmpeg.org/download.html

2) Install node https://nodejs.org/en/download/
Using homebrew:
> $ brew install node

## Dev - Running Local Node.js Web Service

Navigate to project directory and:

Install dependencies:
> $ npm install

Start app:
> $ node app.js

Check for errors with ESLint:
> $ ./node_modules/.bin/eslint .

## Running Local Docker Container

Build Docker Image from Dockerfile with a set image tag. ex: docker-ffpmeg
> $ docker build -t surebert/docker-ffpmeg .

Launch Docker Container from Docker Image, exposing port 9025 on localhost only

> docker run -d \
    --name ffmpeg-service \
    --restart=always \
    -v /storage/tmpfs:/usr/src/app/uploads \
    -p 127.0.0.1:9025:3000 \
    surebert/docker-ffpmeg

Launch Docker Container from Docker Image, exposing port 9026 on all IPs
> docker run -p 9025:3000 -d surebert/docker-ffpmeg
