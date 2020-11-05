#!/bin/sh

case $1 in node) docker-compose up --build;;
react) script/react.sh;;
fund) script/fund.sh $2;;
*) echo Available commands:
   echo main.sh node
   echo main.sh react
   echo main.sh fund \<address\>;;
esac
