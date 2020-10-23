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

Interacting with docker-compose contract:

```
docker exec -it srps_dev /bin/bash
secretcli tx compute store code/contract.wasm.gz --from a --gas auto --gas-adjustment 2 -y --keyring-backend test
CODE=`secretcli query compute list-code | jq -r 'sort_by(.id)[] | [.id] | @tsv' | tail -1`; echo $CODE
secretcli tx compute instantiate $CODE "{}" --from a --label "srps $CODE" -y --keyring-backend test
CONTRACT=`secretcli query compute list-contract-by-code $CODE | jq -r 'sort_by(.code_id)[] | [.address] | @tsv'`; echo $CONTRACT
secretcli tx compute execute $CONTRACT "{\"join_game\": {}}" --from b --keyring-backend test
secretcli tx compute execute $CONTRACT "{\"play_hand\": {\"handsign\": \"ROCK\"}}" --from a --keyring-backend test
secretcli tx compute execute $CONTRACT "{\"play_hand\": {\"handsign\": \"PAPER\"}}" --from b --keyring-backend test
secretcli query compute query $CONTRACT "{\"get_outcome\": {}}"
```
