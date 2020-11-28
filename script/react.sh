set -e
docker-compose -f docker-optimize.yaml up --build

alias secretcli="docker exec -it srps_dev secretcli"
CODE=$(
secretcli tx compute store code/contract.wasm.gz --from a --gas 10000000 -y -b block |
    jq -r '.logs[].events[].attributes[] | select(.key == "code_id") | .value'
)
echo Code: $CODE

CONTRACT=$(
secretcli tx compute instantiate "$CODE" "{}" --from a --amount 1000000uscrt --label "$(date)" -y -b block |
    jq -r '.logs[].events[].attributes[] | select(.key == "contract_address") | .value'
)
echo Contract $CONTRACT

cd web

export REACT_APP_CHAIN_ID=enigma-pub-testnet-3
export REACT_APP_CHAIN_NAME="Secret localhost"
export REACT_APP_LCD_URL=http://localhost:1338
export REACT_APP_RPC_URL=http://localhost:26657
export REACT_APP_CONTRACT="$CONTRACT"
docker-compose up --build
