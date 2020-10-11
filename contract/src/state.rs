use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Storage, HumanAddr};
use cosmwasm_storage::{singleton, singleton_read, ReadonlySingleton, Singleton};

use crate::msg::{Handsign};

pub static CONFIG_KEY: &[u8] = b"config";

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub last_handsign: Option<Handsign>,
    pub player1: HumanAddr,
    pub player2: Option<HumanAddr>,
}

pub fn config<S: Storage>(storage: &mut S) -> Singleton<S, State> {
    singleton(storage, CONFIG_KEY)
}

pub fn config_read<S: Storage>(storage: &S) -> ReadonlySingleton<S, State> {
    singleton_read(storage, CONFIG_KEY)
}
