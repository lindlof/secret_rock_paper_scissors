use cosmwasm_std::{
    to_binary, Api, BankMsg, Binary, Coin, CosmosMsg, Env, Extern, HandleResponse, HumanAddr,
    InitResponse, Querier, StdError, StdResult, Storage, Uint128,
};

use crate::conf::{FUNDING_AMOUNT, FUNDING_DENOM, PLAYER_DEADLINE_BLOCKS, WINS_TO_FINISH};
use crate::msg::{GameLobbyResponse, GameStatusResponse, HandleMsg, Handsign, InitMsg, QueryMsg};
use crate::state::{config, config_read, State};

pub fn init<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    _msg: InitMsg,
) -> StdResult<InitResponse> {
    match deps.querier.query_balance(env.contract.address, "uscrt") {
        Ok(coin) => {
            if coin.amount < Uint128(FUNDING_AMOUNT) {
                return Err(StdError::generic_err(
                    "insufficient_funds 100000 uscrt required",
                ));
            }
        }
        Err(_) => {
            return Err(StdError::generic_err("error querying balance"));
        }
    }
    let state = State {
        player1: env.message.sender.clone(),
        player1_handsign: None,
        player1_wins: 0,
        player2: None,
        player2_handsign: None,
        player2_wins: 0,
        last_play_height: 0,
    };

    config(&mut deps.storage).save(&state)?;

    Ok(InitResponse::default())
}

pub fn handle<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    msg: HandleMsg,
) -> StdResult<HandleResponse> {
    match msg {
        HandleMsg::JoinGame {} => join_game(deps, env),
        HandleMsg::PlayHand { handsign } => play_hand(deps, env, handsign),
        HandleMsg::Shutdown {} => shutdown(deps, env),
    }
}

pub fn play_hand<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    handsign: Handsign,
) -> StdResult<HandleResponse> {
    let mut pay_address = None;
    config(&mut deps.storage).update(|mut state| {
        if state.player1_wins >= WINS_TO_FINISH || state.player2_wins >= WINS_TO_FINISH {
            return Err(StdError::generic_err("game_finished"));
        }

        let player2: &HumanAddr;
        match &state.player2 {
            None => return Err(StdError::generic_err("Second player needs to join first")),
            Some(p2) => player2 = p2,
        }
        if env.message.sender == state.player1 {
            match state.player2_handsign {
                None => {
                    state.player1_handsign = Some(handsign);
                }
                Some(player2_handsign) => {
                    state.player2_handsign = None;
                    if handsign.beats(player2_handsign) {
                        state.player1_wins += 1;
                    } else if handsign != player2_handsign {
                        state.player2_wins += 1;
                    }
                }
            }
        } else if env.message.sender == *player2 {
            match state.player1_handsign {
                None => {
                    state.player2_handsign = Some(handsign);
                }
                Some(player1_handsign) => {
                    state.player1_handsign = None;
                    if handsign.beats(player1_handsign) {
                        state.player2_wins += 1;
                    } else if handsign != player1_handsign {
                        state.player1_wins += 1;
                    }
                }
            }
        } else {
            return Err(StdError::generic_err("You are not a player"));
        }
        state.last_play_height = env.block.height;
        if state.player1_wins == WINS_TO_FINISH {
            pay_address = Some(state.player1.clone());
        } else if state.player2_wins == WINS_TO_FINISH {
            pay_address = Some(player2.clone());
        }
        Ok(state)
    })?;
    match pay_address {
        None => {}
        Some(address) => {
            return Ok(pay(
                env.contract.address,
                address,
                Uint128(FUNDING_AMOUNT * 2),
            ))
        }
    };

    Ok(HandleResponse::default())
}

pub fn join_game<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
) -> StdResult<HandleResponse> {
    let funds = &env.message.sent_funds[0];
    if funds.denom != FUNDING_DENOM || funds.amount < Uint128(FUNDING_AMOUNT) {
        return Err(StdError::generic_err(
            "insufficient_funds 100000 uscrt required",
        ));
    }
    config(&mut deps.storage).update(|mut state| {
        if !state.player2.is_none() {
            return Err(StdError::generic_err("Game full mate"));
        }
        state.player2 = Some(env.message.sender.clone());
        Ok(state)
    })?;

    Ok(HandleResponse::default())
}

pub fn shutdown<S: Storage, A: Api, Q: Querier>(
    _deps: &mut Extern<S, A, Q>,
    _env: Env,
) -> StdResult<HandleResponse> {
    //if env.block.height >= state.last_play_height + INACTIVE_BLOCKS_TO_DEFEAT {}

    Ok(HandleResponse::default())
}

pub fn query<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>,
    msg: QueryMsg,
) -> StdResult<Binary> {
    match msg {
        QueryMsg::GameLobby {} => to_binary(&game_lobby(deps, msg)?),
        QueryMsg::GameStatus {} => to_binary(&game_status(deps, msg)?),
    }
}

fn game_lobby<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>,
    _msg: QueryMsg,
) -> StdResult<GameLobbyResponse> {
    let state = config_read(&deps.storage).load()?;
    return Ok(GameLobbyResponse {
        player2_joined: !state.player2.is_none(),
    });
}

fn game_status<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>,
    _msg: QueryMsg,
) -> StdResult<GameStatusResponse> {
    let state = config_read(&deps.storage).load()?;
    return Ok(GameStatusResponse {
        player1_played: !state.player1_handsign.is_none(),
        player2_played: !state.player2_handsign.is_none(),
        player1_wins: state.player1_wins,
        player2_wins: state.player2_wins,
        deadline: state.last_play_height + PLAYER_DEADLINE_BLOCKS,
    });
}

pub fn pay(contract_address: HumanAddr, player: HumanAddr, amount: Uint128) -> HandleResponse {
    HandleResponse {
        messages: vec![CosmosMsg::Bank(BankMsg::Send {
            from_address: contract_address,
            to_address: player,
            amount: vec![Coin {
                denom: "uscrt".to_string(),
                amount,
            }],
        })],
        log: vec![],
        data: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env};
    use cosmwasm_std::{coins, from_binary};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies(20, &coins(1_000_000, "uscrt"));
        let env = mock_env("creator", &[]);
        let msg = InitMsg {};

        let res = init(&mut deps, env, msg).unwrap();
        assert_eq!(0, res.messages.len());
    }

    #[test]
    fn play() {
        let mut deps = mock_dependencies(20, &coins(1_000_000, "uscrt"));
        let env = mock_env("player1", &[]);
        let msg = InitMsg {};
        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(1_000_000, "uscrt"));
        let msg = HandleMsg::JoinGame {};
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(1000, "token"));
        let msg = HandleMsg::PlayHand {
            handsign: Handsign::ROCK,
        };
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(2, "token"));
        let msg = HandleMsg::PlayHand {
            handsign: Handsign::PAPER,
        };
        let _res = handle(&mut deps, env, msg).unwrap();

        let res = query(&deps, QueryMsg::GameStatus {}).unwrap();
        let value: GameStatusResponse = from_binary(&res).unwrap();
        assert_eq!(0, value.player1_wins);
        assert_eq!(1, value.player2_wins);
    }

    #[test]
    fn only_two_players() {
        let mut deps = mock_dependencies(20, &coins(1_000_000, "uscrt"));
        let env = mock_env("creator", &[]);
        let msg = InitMsg {};
        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(1_000_000, "uscrt"));
        let msg = HandleMsg::JoinGame {};
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player3", &coins(1_000_000, "uscrt"));
        let msg = HandleMsg::JoinGame {};
        let res = handle(&mut deps, env, msg);
        assert_eq!(Err(StdError::generic_err("Game full mate")), res);
    }
}
