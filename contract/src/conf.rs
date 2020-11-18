pub const FUNDING_AMOUNT: u128 = 10_000_000;
pub const FUNDING_DENOM: &str = "uscrt";
pub const WINS_TO_FINISH: u8 = 3;

/// Number of blocks from last activity after which player waiting for other player's move can claim victory
pub const PLAYER_DEADLINE_BLOCKS: u64 = 20;

/// Number of blocks from last activity after which any address can shutdown the game and earn a fee
pub const GLOBAL_DEADLINE_BLOCKS: u64 = 300;
