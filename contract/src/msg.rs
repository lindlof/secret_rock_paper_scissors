use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct InitMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum HandleMsg {
    JoinGame { locator: String },
    PlayHand { locator: String, handsign: Handsign },
    ClaimInactivity {},
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, JsonSchema)]
pub enum Handsign {
    ROCK = 0,
    PAPER = 1,
    SCISSORS = 2,
}

impl Handsign {
    pub fn beats(&self, b: Handsign) -> bool {
        (b as u8 + 1) % 3 == *self as u8
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GameLobby { locator: String },
    GameStatus { locator: String },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct GameLobbyResponse {
    pub player2_joined: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct GameStatusResponse {
    pub player1_played: bool,
    pub player2_played: bool,
    pub player1_wins: u8,
    pub player2_wins: u8,
    pub deadline: u64,
    pub game_over: bool,
}
