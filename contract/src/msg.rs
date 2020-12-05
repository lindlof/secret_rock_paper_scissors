use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct InitMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum HandleMsg {
    JoinGame { locator: String },
    PrivateGame { locator: String },
    PlayHand { locator: String, handsign: Handsign },
    ClaimInactivity { locator: String },
}

/**
 * Moves that player can make.
 * Size of each handsign must be equal in input so that opponent
 * can't guess player's move from input size.
 */
#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, JsonSchema)]
pub enum Handsign {
    ROCK = 0,
    PAPR = 1,
    SCRS = 2,
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
    pub game_started: bool,
    pub player1_locator: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct GameStatusResponse {
    pub round: u8,
    pub player1_played: bool,
    pub player2_played: bool,
    pub player1_wins: u8,
    pub player2_wins: u8,
    pub deadline: u64,
    pub game_over: bool,
}
