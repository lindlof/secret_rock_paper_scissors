use cosmwasm_std::{
    Api, Env, Extern, HandleResponse, InitResponse, QueryResponse, Querier,
    StdResult, Storage,
};

use crate::msg::{InitMsg, HandleMsg, QueryMsg};

pub fn init<S: Storage, A: Api, Q: Querier>(
    _deps: &mut Extern<S, A, Q>,
    _env: Env,
    _msg: InitMsg,
) -> StdResult<InitResponse> {
    Ok(InitResponse::default())
}

pub fn handle<S: Storage, A: Api, Q: Querier>(
    _deps: &mut Extern<S, A, Q>,
    _env: Env,
    _msg: HandleMsg,
) -> StdResult<HandleResponse> {
    Ok(HandleResponse::default())
}

pub fn query<S: Storage, A: Api, Q: Querier>(
    _deps: &Extern<S, A, Q>,
    _msg: QueryMsg,
) -> StdResult<QueryResponse> {
    Ok(QueryResponse::default())
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env};
    use cosmwasm_std::{coins};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies(20, &[]);
        let env = mock_env("creator", &coins(1000, "earth"));
        let msg = InitMsg{};

        let res = init(&mut deps, env, msg).unwrap();
        assert_eq!(0, res.messages.len());
    }
}
