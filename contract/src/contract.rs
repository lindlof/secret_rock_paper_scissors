use cosmwasm_std::{
    to_binary, Api, Binary, Env, Extern, HandleResponse, HumanAddr, InitResponse, Querier,
    StdError, StdResult, Storage,
};

use crate::msg::{HandleMsg, Handsign, InitMsg, QueryMsg, StatusResponse};
use crate::state::{config, config_read, State};

pub fn init<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    _msg: InitMsg,
) -> StdResult<InitResponse> {
    let state = State {
        player1: env.message.sender.clone(),
        player1_handsign: None,
        player1_wins: 0,
        player2: None,
        player2_handsign: None,
        player2_wins: 0,
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
    }
}

pub fn play_hand<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    handsign: Handsign,
) -> StdResult<HandleResponse> {
    config(&mut deps.storage).update(|mut state| {
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
        Ok(state)
    })?;

    Ok(HandleResponse::default())
}

pub fn join_game<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
) -> StdResult<HandleResponse> {
    config(&mut deps.storage).update(|mut state| {
        if !state.player2.is_none() {
            return Err(StdError::generic_err("Game full mate"));
        }
        state.player2 = Some(env.message.sender.clone());
        Ok(state)
    })?;

    Ok(HandleResponse::default())
}

pub fn query<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>,
    msg: QueryMsg,
) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetOutcome {} => to_binary(&query_count(deps, msg)?),
    }
}

fn query_count<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>,
    _msg: QueryMsg,
) -> StdResult<StatusResponse> {
    let state = config_read(&deps.storage).load()?;
    return Ok(StatusResponse {
        player1_wins: state.player1_wins,
        player2_wins: state.player2_wins,
        player1_played: !state.player1_handsign.is_none(),
        player2_played: !state.player2_handsign.is_none(),
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env};
    use cosmwasm_std::{coins, from_binary};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies(20, &[]);
        let env = mock_env("creator", &coins(1000, "earth"));
        let msg = InitMsg {};

        let res = init(&mut deps, env, msg).unwrap();
        assert_eq!(0, res.messages.len());
    }

    #[test]
    fn play() {
        let mut deps = mock_dependencies(20, &[]);
        let env = mock_env("player1", &coins(1000, "token"));
        let msg = InitMsg {};
        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(2, "token"));
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

        let res = query(&deps, QueryMsg::GetOutcome {}).unwrap();
        let value: StatusResponse = from_binary(&res).unwrap();
        assert_eq!(0, value.player1_wins);
        assert_eq!(1, value.player2_wins);
    }

    #[test]
    fn only_two_players() {
        let mut deps = mock_dependencies(20, &[]);
        let env = mock_env("creator", &coins(1000, "earth"));
        let msg = InitMsg {};
        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(2, "token"));
        let msg = HandleMsg::JoinGame {};
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player3", &coins(2, "token"));
        let msg = HandleMsg::JoinGame {};
        let res = handle(&mut deps, env, msg);
        assert_eq!(Err(StdError::generic_err("Game full mate")), res);
    }
}
