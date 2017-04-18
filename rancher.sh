#!/bin/bash

jsonq() { python -c "import sys,json; obj=json.load(sys.stdin); sys.stdout.write(json.dumps($1))"; }

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

IMAGE=kongadmin-api
TAG=$(git log --pretty=format:"%h")
RANCHER_ACCESS_KEY=CC432265A435CCC65AC9
RANCHER_SECRET_KEY=q67QDAudkDYy4kdXF9XRVR1gNoZQwTPXpu8KY8Dk
RANCHER_API_URL=https://rancher1.biw-services.com/v2-beta
UPGRADE_TIMEOUT=60
UPGRADE_BATCH_SIZE=1
UPGRADE_INTERVAL_MILLIS=2000
UPGRADE_START_FIRST="true"
CURL="curl -s --user $RANCHER_ACCESS_KEY:$RANCHER_SECRET_KEY"

RANCHER_ENVIRONMENT_ID=1a508
SERVICE_JSON=$($CURL $RANCHER_API_URL/projects/$RANCHER_ENVIRONMENT_ID/services?name=$IMAGE)

STATE=$(echo $SERVICE_JSON | jsonq 'obj["data"][0]["state"]' | sed -e 's/^"//'  -e 's/"$//')
SELF=$(echo $SERVICE_JSON | jsonq 'obj["data"][0]["links"]["self"]' | sed -e 's/^"//'  -e 's/"$//')
UPGRADE_URL=$(echo $SERVICE_JSON | jsonq 'obj["data"][0]["actions"]["upgrade"]' | sed -e 's/^"//'  -e 's/"$//')

if [[ $STATE != "active" ]]; then
  printf "${RED}[ ERROR ] Service $IMAGE state is '$STATE', must be set to 'active'${NC}\n"
  exit 1
fi

printf "[ Upgrading ${GREEN}$IMAGE${NC} ]\n"
printf "[ State is ${GREEN}$STATE${NC} ]\n"
printf "[ Stack URL is ${BLUE}$SELF${NC} ]\n"
printf "[ Upgrade URL is ${BLUE}$UPGRADE_URL${NC} ]\n"

BODY="{\"inServiceStrategy\":{\"batchSize\":1,\"intervalMillis\":2000,\"startFirst\":false,\"launchConfig\":{\"instanceTriggeredStop\":\"stop\",\"kind\":\"container\",\"networkMode\":\"managed\",\"privileged\":false,\"publishAllPorts\":false,\"readOnly\":false,\"startOnCreate\":true,\"stdinOpen\":true,\"tty\":true,\"vcpu\":1,\"type\":\"launchConfig\",\"capAdd\":[],\"capDrop\":[],\"dataVolumes\":[],\"dataVolumesFrom\":[],\"devices\":[],\"dns\":[],\"dnsSearch\":[],\"imageUuid\":\"docker:302265824077.dkr.ecr.us-west-2.amazonaws.com/$IMAGE:$TAG\",\"labels\":{\"io.rancher.container.pull_image\":\"always\"},\"logConfig\":{\"type\":\"logConfig\",\"config\":{},\"driver\":null},\"ports\":[\"3000:3000/tcp\"],\"secrets\":[],\"system\":false,\"version\":\"0\",\"dataVolumesFromLaunchConfigs\":[],\"blkioWeight\":null,\"cgroupParent\":null,\"count\":null,\"cpuCount\":null,\"cpuPercent\":null,\"cpuPeriod\":null,\"cpuQuota\":null,\"cpuSet\":null,\"cpuSetMems\":null,\"cpuShares\":null,\"createIndex\":null,\"created\":null,\"deploymentUnitUuid\":null,\"description\":null,\"diskQuota\":null,\"domainName\":null,\"externalId\":null,\"firstRunning\":null,\"healthInterval\":null,\"healthRetries\":null,\"healthState\":null,\"healthTimeout\":null,\"hostname\":null,\"ioMaximumBandwidth\":null,\"ioMaximumIOps\":null,\"ip\":null,\"ip6\":null,\"ipcMode\":null,\"isolation\":null,\"kernelMemory\":null,\"memory\":null,\"memoryMb\":null,\"memoryReservation\":null,\"memorySwap\":null,\"memorySwappiness\":null,\"milliCpuReservation\":null,\"oomScoreAdj\":null,\"pidMode\":null,\"pidsLimit\":null,\"removed\":null,\"requestedIpAddress\":null,\"shmSize\":null,\"startCount\":null,\"stopSignal\":null,\"user\":null,\"userdata\":null,\"usernsMode\":null,\"uts\":null,\"uuid\":null,\"volumeDriver\":null,\"workingDir\":null,\"networkLaunchConfig\":null},\"secondaryLaunchConfigs\":[]}}"

RESPONSE=$($CURL -H "Content-Type: application/json" -X POST -d "$BODY" $UPGRADE_URL)

echo "[ Waiting for service $IMAGE to upgrade ]"
wait4upgrade() {
  CNT=0
  STATE=""
  until [[ $STATE == "upgraded" ]]; do
    STATE=$($CURL --silent $SELF | jsonq 'obj["state"]' | sed -e 's/^"//'  -e 's/"$//')
    echo "Service state: $STATE"
    if [ $((CNT++)) -gt $UPGRADE_TIMEOUT ]; then
        echo "Upgrade timed out, state: $STATE"
        exit 1
    else
        sleep 1
    fi
  done
}
wait4upgrade

FINISH_UPGRADE_URL=$($CURL $SELF | jsonq 'obj["actions"]["finishupgrade"]' | sed -e 's/^"//'  -e 's/"$//')
echo "[ Confirming upgrade via $FINISH_UPGRADE_URL ]"
RESPONSE=$($CURL -X POST $FINISH_UPGRADE_URL)

echo "[ Waiting for service $IMAGE to finish upgrade ]"
wait4finishupgrade() {
  CNT=0
  STATE=""
  until [[ $STATE == "active" ]]; do
    STATE=$($CURL --silent $SELF | jsonq 'obj["state"]' | sed -e 's/^"//'  -e 's/"$//')
    echo "Service state: $STATE"
    if [ $((CNT++)) -gt $UPGRADE_TIMEOUT ]; then
        echo "Confirm Upgrade timed out, state: $STATE"
        exit 1
    else
        sleep 1
    fi
  done
}
wait4finishupgrade

printf "[ ${GREEN}ALL DONE${NC} ]\n"
exit 0