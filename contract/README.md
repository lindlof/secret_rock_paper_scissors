# Secret Rock Paper Scissors Contract

Rock paper scissors game secret contract for Secret Network.

## Testing

Compile:

```
cargo wasm
```

Unit tests:

```
cargo unit-test
```

## Local deployment

Compile optimized contract:

```
docker-compose -f docker-optimize.yaml up --build
```

Interacting with local contract:

```
docker exec -it srps_dev /bin/bash
CODE=$(secretcli tx compute store code/contract.wasm.gz --from a --gas 1000000 -y --keyring-backend test -b block |
       jq -r '.logs[].events[].attributes[] | select(.key == "code_id") | .value'); echo Code $CODE
CONT=$(secretcli tx compute instantiate "$CODE" "{}" --from a --amount 1000000uscrt --label "$(date)" -y -b block |
       jq -r '.logs[].events[].attributes[] | select(.key == "contract_address") | .value'); echo Cont $CONT
secretcli tx compute execute $CONT "{\"join_game\": {}}" --from b --amount 10000000uscrt -y --keyring-backend test -b block
secretcli tx compute execute $CONT "{\"play_hand\": {\"handsign\": \"ROCK\"}}" --from a -y --keyring-backend test -b block
secretcli tx compute execute $CONT "{\"play_hand\": {\"handsign\": \"PAPER\"}}" --from b -y --keyring-backend test -b block
secretcli query compute query $CONT "{\"game_status\": {}}"
```
