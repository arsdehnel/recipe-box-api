#!/bin/bash

IMAGE_NAME=kongadmin-api
TAG=$(git log --pretty=format:"%h" -1)

echo "Publishing $IMAGE_NAME:$TAG to the AWS ECR..."

# get the ECR credentials updated in our session, these only last for 12 hours so we just get them every time
eval $(AWS_PROFILE_NAME=tsgsandbox aws ecr get-login --region us-west-2)

# build, tag and push the image
docker build -t $IMAGE_NAME:$TAG .
docker tag $IMAGE_NAME:$TAG 302265824077.dkr.ecr.us-west-2.amazonaws.com/$IMAGE_NAME:$TAG
docker push 302265824077.dkr.ecr.us-west-2.amazonaws.com/$IMAGE_NAME:$TAG

# docker build -t $IMAGE_NAME .
# docker tag $IMAGE_NAME 302265824077.dkr.ecr.us-west-2.amazonaws.com/$IMAGE_NAME
# docker push 302265824077.dkr.ecr.us-west-2.amazonaws.com/$IMAGE_NAME

./rancher.sh