use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{HumanAddr, StdResult, Storage};
use cosmwasm_storage::{prefixed, prefixed_read, singleton, typed, typed_read, Singleton};

use crate::msg::Handsign;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Locator {
    #[serde(skip)]
    id: [u8; 32],
    pub game: [u8; 32],
    pub player: HumanAddr,
    pub canceled: bool,
}

impl Locator {
    pub fn new(id: [u8; 32], game: [u8; 32], player: HumanAddr) -> Locator {
        Locator {
            id: id,
            game: game,
            player: player,
            canceled: false,
        }
    }

    pub fn save<S: Storage>(&self, storage: &mut S) {
        let mut space = prefixed(b"lobby", storage);
        let mut bucket = typed::<_, Locator>(&mut space);
        bucket.save(&self.id, &self).unwrap();
    }

    pub fn load<S: Storage>(storage: &S, id: [u8; 32]) -> StdResult<Self> {
        let mut space = prefixed_read(b"lobby", storage);
        let bucket = typed_read::<_, Locator>(&mut space);
        let data = bucket.load(&id)?;
        Ok(Self { id, ..data })
    }

    pub fn may_load<S: Storage>(storage: &S, id: [u8; 32]) -> StdResult<Option<Self>> {
        let mut space = prefixed_read(b"lobby", storage);
        let bucket = typed_read::<_, Locator>(&mut space);
        bucket
            .may_load(&id)
            .map(|maybe| maybe.map(|data| Self { id, ..data }))
    }
}

pub fn lobby_game<S: Storage>(storage: &mut S) -> Singleton<S, Option<[u8; 32]>> {
    singleton(storage, b"lobby_game")
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Game {
    #[serde(skip)]
    id: [u8; 32],
    pub round: u8,
    pub player1: HumanAddr,
    pub player1_handsign: Option<Handsign>,
    pub player1_wins: u8,
    pub player2: HumanAddr,
    pub player2_handsign: Option<Handsign>,
    pub player2_wins: u8,
    pub last_play_height: u64,
    pub game_over: bool,
}

impl Game {
    pub fn new(id: [u8; 32], player1: HumanAddr, player2: HumanAddr) -> Game {
        Game {
            id: id,
            round: 1,
            player1: player1,
            player1_handsign: None,
            player1_wins: 0,
            player2: player2,
            player2_handsign: None,
            player2_wins: 0,
            last_play_height: 0,
            game_over: false,
        }
    }

    pub fn save<S: Storage>(&self, storage: &mut S) {
        let mut space = prefixed(b"game", storage);
        let mut bucket = typed::<_, Game>(&mut space);
        bucket.save(&self.id, &self).unwrap();
    }

    pub fn load<S: Storage>(storage: &S, id: [u8; 32]) -> StdResult<Self> {
        let mut space = prefixed_read(b"game", storage);
        let bucket = typed_read::<_, Game>(&mut space);
        let game = bucket.load(&id)?;
        Ok(Self { id, ..game })
    }

    pub fn may_load<S: Storage>(storage: &S, id: [u8; 32]) -> StdResult<Option<Self>> {
        let mut space = prefixed_read(b"game", storage);
        let bucket = typed_read::<_, Game>(&mut space);
        bucket
            .may_load(&id)
            .map(|maybe| maybe.map(|game| Self { id, ..game }))
    }
}
