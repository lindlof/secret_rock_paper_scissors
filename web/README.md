# Secret Rock Paper Scissors Frontend

Rock paper scissors game secret frontend for Secret Network.

## Testnet release

```
rm -rf web-testnet
docker-compose -f docker-testnet.yaml up --build
tar -zcvf web-testnet.gz web-testnet
```

## Production build

```
rm -rf web-mainnet
docker-compose -f docker-production.yaml up --build
tar -zcvf web-mainnet.gz web-mainnet
```
