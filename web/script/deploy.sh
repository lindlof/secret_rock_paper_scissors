alias secretcli="docker exec -it srps_dev secretcli"
secretcli tx compute store code/contract.wasm.gz --from a --gas auto --gas-adjustment 2 -y --keyring-backend test
sleep 5s
CODE=`secretcli query compute list-code | jq -r 'sort_by(.id)[] | [.id] | @tsv' | tail -1`
echo Code: $CODE
secretcli tx compute instantiate $CODE "{}" --from a --label "srps $CODE" -y --keyring-backend test
sleep 10s
CONTRACT=`secretcli query compute list-contract-by-code $CODE | jq -r 'sort_by(.code_id)[] | [.address] | @tsv'`
echo Contract: $CONTRACT
REACT_APP_CONTRACT=secret18vd8fpwxzck93qlwghaj6arh4p7c5n8978vsyg npm start
