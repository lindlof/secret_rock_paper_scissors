# Secret Rock Paper Scissors

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

## Dev deployment

Compile optimized contract:
```
docker-compose -f docker-optimize.yaml up
```

Run dev node:
```
docker-compose up
```

Deploy contract:
```
docker exec -it srps_dev /bin/bash
secretcli tx compute store code/contract.wasm.gz --from a --gas auto --gas-adjustment 2 -y --keyring-backend test
secretcli tx compute instantiate 1 "{}" --from a --label "srps" -y --keyring-backend test
```
