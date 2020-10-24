# Secret Rock Paper Scissors

Rock paper scissors game for Secret Network.

## Dev deployment

Run dev node:

```
docker-compose up --build
```

Compile optimized contract:

```
docker-compose -f docker-optimize.yaml up --build
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
