use cosmwasm_std::{
    to_binary, Api, Binary, Env, Extern, HandleResponse, InitResponse, Querier,
    StdError, StdResult, Storage,
};

use crate::msg::{InitMsg, HandleMsg, QueryMsg, Handsign, Outcome, OutcomeResponse};
use crate::state::{config, State};

pub fn init<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    _msg: InitMsg,
) -> StdResult<InitResponse> {
    let state = State {
        last_handsign: None,
        player1: env.message.sender.clone(),
        player2: None,
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
    _env: Env,
    handsign: Handsign,
) -> StdResult<HandleResponse> {
    config(&mut deps.storage).update(|mut state| {
        state.last_handsign = Some(handsign);
        Ok(state)
    })?;

    Ok(HandleResponse::default())
}

pub fn join_game<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
) -> StdResult<HandleResponse> {
    config(&mut deps.storage).update(|mut state| {
        if state.player2 != None {
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
        QueryMsg::GetOutcome {} => to_binary(&query_count(deps)?),
    }
}


fn query_count<S: Storage, A: Api, Q: Querier>(_deps: &Extern<S, A, Q>) -> StdResult<OutcomeResponse> {
    //let state = config_read(&deps.storage).load()?;
    Ok(OutcomeResponse { outcome: Outcome::WON })
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
        let msg = InitMsg{};

        let res = init(&mut deps, env, msg).unwrap();
        assert_eq!(0, res.messages.len());
    }

    #[test]
    fn play() {
        let mut deps = mock_dependencies(20, &[]);
        let env = mock_env("creator", &coins(1000, "earth"));
        let msg = InitMsg{};
        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(2, "token"));
        let msg = HandleMsg::PlayHand {handsign: Handsign::ROCK};
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(2, "token"));
        let msg = HandleMsg::PlayHand {handsign: Handsign::PAPER};
        let _res = handle(&mut deps, env, msg).unwrap();

        let res = query(&deps, QueryMsg::GetOutcome{}).unwrap();
        let value: OutcomeResponse = from_binary(&res).unwrap();
        assert_eq!(Outcome::WON, value.outcome);
    }

    #[test]
    fn only_two_players() {
        let mut deps = mock_dependencies(20, &[]);
        let env = mock_env("creator", &coins(1000, "earth"));
        let msg = InitMsg{};
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
