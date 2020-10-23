# Secret Rock Paper Scissors

Rock paper scissors game for Secret Network.

## Dev deployment

Compile optimized contract:

```
docker-compose -f docker-optimize.yaml up
```

Run dev node:

```
docker-compose up --build
```

Interact with contract:

```
cd web
npm run deploy
```

Fund wallet address:

```
npm run fund <address>
```
