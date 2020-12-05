use cosmwasm_std::{
    to_binary, Api, BankMsg, Binary, Coin, CosmosMsg, Env, Extern, HandleResponse, HumanAddr,
    InitResponse, Querier, StdError, StdResult, Storage, Uint128,
};
extern crate hex;

use crate::conf::{FUNDING_AMOUNT, FUNDING_DENOM, PLAYER_DEADLINE_BLOCKS, WINS_TO_FINISH};
use crate::msg::{GameLobbyResponse, GameStatusResponse, HandleMsg, Handsign, InitMsg, QueryMsg};
use crate::state::{lobby_game, Game, Locator};

pub fn init<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    _env: Env,
    _msg: InitMsg,
) -> StdResult<InitResponse> {
    lobby_game(&mut deps.storage).save(&None)?;
    Ok(InitResponse::default())
}

pub fn handle<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    msg: HandleMsg,
) -> StdResult<HandleResponse> {
    match msg {
        HandleMsg::JoinGame { locator } => join_game(deps, env, locator),
        HandleMsg::PrivateGame { locator } => private_game(deps, env, locator),
        HandleMsg::PlayHand { locator, handsign } => play_hand(deps, env, locator, handsign),
        HandleMsg::ClaimInactivity { locator } => claim_inactivity(deps, env, locator),
    }
}

pub fn play_hand<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    locator: String,
    handsign: Handsign,
) -> StdResult<HandleResponse> {
    let mut bytes = [0u8; 32];
    match hex::decode_to_slice(locator, &mut bytes as &mut [u8]) {
        Err(_) => return Err(StdError::generic_err("bad_request invalid_locator")),
        Ok(_) => (),
    }
    let locator = Locator::load(&deps.storage, bytes)?;
    let mut game = Game::load(&deps.storage, locator.game)?;

    let mut pay_address = None;
    if game.game_over {
        return Err(StdError::generic_err("game_over"));
    }
    if env.message.sender == game.player1 && !game.player1_handsign.is_none()
        || env.message.sender == game.player2 && !game.player2_handsign.is_none()
    {
        return Err(StdError::generic_err("already_played"));
    }

    if env.message.sender == game.player1 {
        match game.player2_handsign {
            None => {
                game.player1_handsign = Some(handsign);
            }
            Some(player2_handsign) => {
                game.round += 1;
                game.player2_handsign = None;
                if handsign.beats(player2_handsign) {
                    game.player1_wins += 1;
                } else if handsign != player2_handsign {
                    game.player2_wins += 1;
                }
            }
        }
    } else if env.message.sender == game.player2 {
        match game.player1_handsign {
            None => {
                game.player2_handsign = Some(handsign);
            }
            Some(player1_handsign) => {
                game.round += 1;
                game.player1_handsign = None;
                if handsign.beats(player1_handsign) {
                    game.player2_wins += 1;
                } else if handsign != player1_handsign {
                    game.player1_wins += 1;
                }
            }
        }
    } else {
        return Err(StdError::generic_err("You are not a player"));
    }
    game.last_play_height = env.block.height;
    if game.player1_wins == WINS_TO_FINISH {
        pay_address = Some(game.player1.clone());
        game.game_over = true;
    } else if game.player2_wins == WINS_TO_FINISH {
        pay_address = Some(game.player2.clone());
        game.game_over = true;
    }
    game.save(&mut deps.storage);
    match pay_address {
        None => {}
        Some(address) => {
            return Ok(payout(
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
    locator: String,
) -> StdResult<HandleResponse> {
    let funds = &env.message.sent_funds[0];
    if funds.denom != FUNDING_DENOM || funds.amount < Uint128(FUNDING_AMOUNT) {
        return Err(StdError::generic_err(
            "insufficient_funds 100000 uscrt required",
        ));
    }
    let mut loc_b = [0u8; 32];
    match hex::decode_to_slice(locator, &mut loc_b as &mut [u8]) {
        Err(_) => return Err(StdError::generic_err("bad_request invalid_locator")),
        Ok(_) => (),
    }

    match lobby_game(&mut deps.storage).load()? {
        None => {
            // player1 goes to lobby to wait for player2
            Locator::new(loc_b, loc_b, env.message.sender).save(&mut deps.storage);
            lobby_game(&mut deps.storage).save(&Some(loc_b))?;
        }
        Some(s) => {
            // player2 joins player1 and lobby becomes empty
            let p1_locator = Locator::load(&mut deps.storage, s)?;
            if p1_locator.canceled {
                return Err(StdError::generic_err("forbidden game canceled"));
            }
            let game_id = p1_locator.game;
            let p2_locator = Locator::new(loc_b, game_id, env.message.sender);
            p2_locator.save(&mut deps.storage);
            let game = Game::new(game_id, p1_locator.player, p2_locator.player);
            game.save(&mut deps.storage);
            lobby_game(&mut deps.storage).save(&None)?;
        }
    };

    Ok(HandleResponse::default())
}

pub fn private_game<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    locator: String,
) -> StdResult<HandleResponse> {
    let funds = &env.message.sent_funds[0];
    if funds.denom != FUNDING_DENOM || funds.amount < Uint128(FUNDING_AMOUNT) {
        return Err(StdError::generic_err(
            "insufficient_funds 100000 uscrt required",
        ));
    }
    let mut loc_b = [0u8; 32];
    match hex::decode_to_slice(locator, &mut loc_b as &mut [u8]) {
        Err(_) => return Err(StdError::generic_err("bad_request invalid_locator")),
        Ok(_) => (),
    }
    match Locator::may_load(&deps.storage, loc_b)? {
        None => {
            // player1 waits for player2
            Locator::new(loc_b, loc_b, env.message.sender).save(&mut deps.storage);
        }
        Some(l) => {
            // player2 joins player1
            if l.canceled {
                return Err(StdError::generic_err("forbidden game canceled"));
            }
            let game = Game::new(l.game, l.player, env.message.sender);
            game.save(&mut deps.storage);
        }
    }
    Ok(HandleResponse::default())
}

pub fn claim_inactivity<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    env: Env,
    locator: String,
) -> StdResult<HandleResponse> {
    let mut bytes = [0u8; 32];
    match hex::decode_to_slice(locator, &mut bytes as &mut [u8]) {
        Err(_) => return Err(StdError::generic_err("bad_request invalid_locator")),
        Ok(_) => (),
    }
    let mut locator = Locator::load(&deps.storage, bytes)?;
    if locator.canceled {
        return Err(StdError::generic_err("forbidden game canceled"));
    }
    let mut game;

    match Game::may_load(&deps.storage, locator.game)? {
        None => {
            if let Some(l) = lobby_game(&mut deps.storage).load()? {
                if l == bytes {
                    lobby_game(&mut deps.storage).save(&None)?;
                }
            }
            locator.canceled = true;
            locator.save(&mut deps.storage);
            return Ok(payout(
                env.contract.address,
                env.message.sender,
                Uint128(FUNDING_AMOUNT),
            ));
        }
        Some(g) => game = g,
    }

    if game.game_over {
        return Err(StdError::generic_err("game_over"));
    }
    if env.block.height < game.last_play_height + PLAYER_DEADLINE_BLOCKS {
        return Err(StdError::generic_err(
            "under deadline for claiming inactivity",
        ));
    }
    if (env.message.sender == game.player1 && !game.player1_handsign.is_none())
        || (env.message.sender == game.player2 && !game.player2_handsign.is_none())
    {
        game.game_over = true;
        game.save(&mut deps.storage);

        return Ok(payout(
            env.contract.address,
            env.message.sender,
            Uint128(FUNDING_AMOUNT * 2),
        ));
    } else {
        return Err(StdError::generic_err("unable to claim inactivity"));
    }
}

pub fn query<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>,
    msg: QueryMsg,
) -> StdResult<Binary> {
    match msg {
        QueryMsg::GameLobby { locator } => to_binary(&game_lobby(deps, locator)?),
        QueryMsg::GameStatus { locator } => to_binary(&game_status(deps, locator)?),
    }
}

fn game_lobby<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>,
    locator: String,
) -> StdResult<GameLobbyResponse> {
    let mut bytes = [0u8; 32];
    match hex::decode_to_slice(locator, &mut bytes as &mut [u8]) {
        Err(_) => return Err(StdError::generic_err("bad_request invalid_locator")),
        Ok(_) => (),
    }
    let locator = Locator::load(&deps.storage, bytes)?;
    match Game::may_load(&deps.storage, locator.game)? {
        None => Ok(GameLobbyResponse {
            game_started: false,
            player1_locator: false,
        }),
        Some(g) => Ok(GameLobbyResponse {
            game_started: true,
            player1_locator: locator.player == g.player1,
        }),
    }
}

fn game_status<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>,
    locator: String,
) -> StdResult<GameStatusResponse> {
    let mut bytes = [0u8; 32];
    match hex::decode_to_slice(locator, &mut bytes as &mut [u8]) {
        Err(_) => return Err(StdError::generic_err("bad_request invalid_locator")),
        Ok(_) => (),
    }
    let locator = Locator::load(&deps.storage, bytes)?;
    let game = Game::load(&deps.storage, locator.game)?;
    return Ok(GameStatusResponse {
        round: game.round,
        player1_played: !game.player1_handsign.is_none(),
        player2_played: !game.player2_handsign.is_none(),
        player1_wins: game.player1_wins,
        player2_wins: game.player2_wins,
        deadline: game.last_play_height + PLAYER_DEADLINE_BLOCKS,
        game_over: game.game_over,
    });
}

pub fn payout(contract_address: HumanAddr, player: HumanAddr, amount: Uint128) -> HandleResponse {
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
    fn loc(n: u8) -> String {
        hex::encode(format!("player{} locator is 32 bytes long", n))
    }

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies(20, &coins(0, "uscrt"));
        let env = mock_env("creator", &[]);
        let msg = InitMsg {};

        let res = init(&mut deps, env, msg).unwrap();
        assert_eq!(0, res.messages.len());
    }

    #[test]
    fn player_wins_round() {
        let mut deps = mock_dependencies(20, &coins(0, "uscrt"));
        let env = mock_env("creator", &[]);
        let msg = InitMsg {};
        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(1) };
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(2) };
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(1000, "token"));
        let msg = HandleMsg::PlayHand {
            locator: loc(1),
            handsign: Handsign::ROCK,
        };
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(2, "token"));
        let msg = HandleMsg::PlayHand {
            locator: loc(2),
            handsign: Handsign::PAPR,
        };
        let _res = handle(&mut deps, env, msg).unwrap();

        let res = query(&deps, QueryMsg::GameStatus { locator: loc(1) }).unwrap();
        let value: GameStatusResponse = from_binary(&res).unwrap();
        assert_eq!(0, value.player1_wins);
        assert_eq!(1, value.player2_wins);
        assert_eq!(false, value.game_over);
    }

    #[test]
    fn player_win_payout() {
        let mut deps = mock_dependencies(20, &coins(0, "uscrt"));
        let env = mock_env("creator", &[]);
        let msg = InitMsg {};
        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(1) };
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(2) };
        let _res = handle(&mut deps, env, msg).unwrap();

        for r in 0..WINS_TO_FINISH {
            let env = mock_env("player1", &coins(1000, "token"));
            let msg = HandleMsg::PlayHand {
                locator: loc(1),
                handsign: Handsign::ROCK,
            };
            let _res = handle(&mut deps, env, msg).unwrap();

            let env = mock_env("player2", &coins(2, "token"));
            let msg = HandleMsg::PlayHand {
                locator: loc(2),
                handsign: Handsign::PAPR,
            };
            let res = handle(&mut deps, env, msg).unwrap();
            if r == WINS_TO_FINISH - 1 {
                assert_eq!(res.messages.len(), 1);
                match &res.messages[0] {
                    CosmosMsg::Bank(BankMsg::Send {
                        to_address, amount, ..
                    }) => {
                        assert_eq!(to_address.as_str(), "player2");
                        assert_eq!(amount.len(), 1);
                        assert_eq!(amount[0].denom, "uscrt");
                        assert_eq!(amount[0].amount, Uint128(FUNDING_AMOUNT * 2));
                    }
                    _ => {
                        panic!("Expected payout for winner");
                    }
                }
            } else {
                assert_eq!(res.messages.len(), 0);
            }
        }

        let res = query(&deps, QueryMsg::GameStatus { locator: loc(1) }).unwrap();
        let value: GameStatusResponse = from_binary(&res).unwrap();
        assert_eq!(0, value.player1_wins);
        assert_eq!(WINS_TO_FINISH, value.player2_wins);
        assert_eq!(true, value.game_over);
    }

    #[test]
    fn game_takes_two_players() {
        let mut deps = mock_dependencies(20, &coins(0, "uscrt"));
        let env = mock_env("creator", &[]);
        let msg = InitMsg {};
        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(1) };
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(2) };
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player3", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(3) };
        let _res = handle(&mut deps, env, msg);

        let msg = QueryMsg::GameLobby { locator: loc(1) };
        let res = query(&deps, msg).unwrap();
        let value: GameLobbyResponse = from_binary(&res).unwrap();
        assert_eq!(true, value.game_started);
        assert_eq!(true, value.player1_locator);

        let msg = QueryMsg::GameLobby { locator: loc(2) };
        let res = query(&deps, msg).unwrap();
        let value: GameLobbyResponse = from_binary(&res).unwrap();
        assert_eq!(true, value.game_started);
        assert_eq!(false, value.player1_locator);

        let msg = QueryMsg::GameLobby { locator: loc(3) };
        let res = query(&deps, msg).unwrap();
        let value: GameLobbyResponse = from_binary(&res).unwrap();
        assert_eq!(false, value.game_started);
    }

    #[test]
    fn private_game_matching() {
        let mut deps = mock_dependencies(20, &coins(0, "uscrt"));
        let env = mock_env("creator", &[]);
        let msg = InitMsg {};
        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::PrivateGame { locator: loc(5) };
        let _res = handle(&mut deps, env, msg).unwrap();

        // JoinGame shouldn't interfere
        let env = mock_env("player3", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(1) };
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::PrivateGame { locator: loc(5) };
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(1000, "token"));
        let msg = HandleMsg::PlayHand {
            locator: loc(5),
            handsign: Handsign::ROCK,
        };
        let _res = handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(2, "token"));
        let msg = HandleMsg::PlayHand {
            locator: loc(5),
            handsign: Handsign::PAPR,
        };
        let _res = handle(&mut deps, env, msg).unwrap();

        let res = query(&deps, QueryMsg::GameStatus { locator: loc(5) }).unwrap();
        let value: GameStatusResponse = from_binary(&res).unwrap();
        assert_eq!(0, value.player1_wins);
        assert_eq!(1, value.player2_wins);
        assert_eq!(false, value.game_over);
    }

    #[test]
    fn claim_opponent_inactivity() {
        let mut deps = mock_dependencies(20, &coins(0, "uscrt"));
        let env = mock_env("creator", &[]);
        let msg = InitMsg {};
        init(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(1) };
        handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player2", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(2) };
        handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(1000, "token"));
        let msg = HandleMsg::PlayHand {
            locator: loc(1),
            handsign: Handsign::ROCK,
        };
        handle(&mut deps, env, msg).unwrap();

        let mut env = mock_env("player1", &coins(1000, "token"));
        env.block.height += PLAYER_DEADLINE_BLOCKS - 1;
        let msg = HandleMsg::ClaimInactivity { locator: loc(1) };
        handle(&mut deps, env, msg).unwrap_err();

        let mut env = mock_env("player2", &coins(1000, "token"));
        env.block.height += PLAYER_DEADLINE_BLOCKS;
        let msg = HandleMsg::ClaimInactivity { locator: loc(1) };
        handle(&mut deps, env, msg).unwrap_err();

        let mut env = mock_env("someone", &coins(1000, "token"));
        env.block.height += PLAYER_DEADLINE_BLOCKS;
        let msg = HandleMsg::ClaimInactivity { locator: loc(1) };
        handle(&mut deps, env, msg).unwrap_err();

        let mut env = mock_env("player1", &coins(1000, "token"));
        env.block.height += PLAYER_DEADLINE_BLOCKS;
        let msg = HandleMsg::ClaimInactivity { locator: loc(1) };
        let res = handle(&mut deps, env, msg).unwrap();

        assert_eq!(res.messages.len(), 1);
        match &res.messages[0] {
            CosmosMsg::Bank(BankMsg::Send {
                to_address, amount, ..
            }) => {
                assert_eq!(to_address.as_str(), "player1");
                assert_eq!(amount.len(), 1);
                assert_eq!(amount[0].denom, "uscrt");
                assert_eq!(amount[0].amount, Uint128(FUNDING_AMOUNT * 2));
            }
            _ => {
                panic!("Expected claim for inactivity");
            }
        }

        // Can't double claim
        let mut env = mock_env("player1", &coins(1000, "token"));
        env.block.height += PLAYER_DEADLINE_BLOCKS;
        let msg = HandleMsg::ClaimInactivity { locator: loc(1) };
        handle(&mut deps, env, msg).unwrap_err();
    }

    #[test]
    fn claim_lobby_inactivity() {
        let mut deps = mock_dependencies(20, &coins(0, "uscrt"));
        let env = mock_env("creator", &[]);
        let msg = InitMsg {};
        init(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &[]);
        let msg = HandleMsg::ClaimInactivity { locator: loc(1) };
        handle(&mut deps, env, msg).unwrap_err();

        let env = mock_env("player1", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(1) };
        handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &[]);
        let msg = HandleMsg::ClaimInactivity { locator: loc(1) };
        let res = handle(&mut deps, env, msg).unwrap();

        assert_eq!(res.messages.len(), 1);
        match &res.messages[0] {
            CosmosMsg::Bank(BankMsg::Send {
                to_address, amount, ..
            }) => {
                assert_eq!(to_address.as_str(), "player1");
                assert_eq!(amount.len(), 1);
                assert_eq!(amount[0].denom, "uscrt");
                assert_eq!(amount[0].amount, Uint128(FUNDING_AMOUNT));
            }
            _ => {
                panic!("Expected claim for inactivity");
            }
        }

        // Can't double-claim
        let env = mock_env("player1", &[]);
        let msg = HandleMsg::ClaimInactivity { locator: loc(1) };
        handle(&mut deps, env, msg).unwrap_err();

        // Lobby becomes empty
        let env = mock_env("player2", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(2) };
        handle(&mut deps, env, msg).unwrap();

        let msg = QueryMsg::GameLobby { locator: loc(2) };
        let res = query(&deps, msg).unwrap();
        let value: GameLobbyResponse = from_binary(&res).unwrap();
        assert_eq!(false, value.game_started);
    }

    #[test]
    fn claim_private_lobby_inactivity() {
        let mut deps = mock_dependencies(20, &coins(0, "uscrt"));
        let env = mock_env("creator", &[]);
        let msg = InitMsg {};
        init(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::PrivateGame { locator: loc(5) };
        handle(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &[]);
        let msg = HandleMsg::ClaimInactivity { locator: loc(5) };
        let res = handle(&mut deps, env, msg).unwrap();

        assert_eq!(res.messages.len(), 1);
        match &res.messages[0] {
            CosmosMsg::Bank(BankMsg::Send {
                to_address, amount, ..
            }) => {
                assert_eq!(to_address.as_str(), "player1");
                assert_eq!(amount.len(), 1);
                assert_eq!(amount[0].denom, "uscrt");
                assert_eq!(amount[0].amount, Uint128(FUNDING_AMOUNT));
            }
            _ => {
                panic!("Expected claim for inactivity");
            }
        }

        // Can't double-claim
        let env = mock_env("player1", &[]);
        let msg = HandleMsg::ClaimInactivity { locator: loc(5) };
        handle(&mut deps, env, msg).unwrap_err();

        // Lobby becomes non-joinable
        let env = mock_env("player2", &coins(FUNDING_AMOUNT, "uscrt"));
        let msg = HandleMsg::PrivateGame { locator: loc(5) };
        handle(&mut deps, env, msg).unwrap_err();
    }

    #[test]
    fn minimum_funding_required() {
        let mut deps = mock_dependencies(20, &coins(0, "uscrt"));
        let env = mock_env("creator", &[]);
        let msg = InitMsg {};
        let _res = init(&mut deps, env, msg).unwrap();

        let env = mock_env("player1", &coins(FUNDING_AMOUNT - 1, "uscrt"));
        let msg = HandleMsg::JoinGame { locator: loc(1) };
        let _res = handle(&mut deps, env, msg).unwrap_err();
    }
}
