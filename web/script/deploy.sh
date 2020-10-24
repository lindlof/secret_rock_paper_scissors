alias secretcli="docker exec -it srps_dev secretcli"
secretcli tx compute store code/contract.wasm.gz --from a --gas auto --gas-adjustment 2 -y --keyring-backend test
sleep 5s
CODE=`secretcli query compute list-code | jq -r 'sort_by(.id)[] | [.id] | @tsv' | tail -1`
echo Code: $CODE
REACT_APP_CODE_ID=$CODE npm start
