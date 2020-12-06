interface Config {
  readonly chainId: string;
  readonly chainName: string;
  readonly suggestChain: boolean;
  readonly lcdUrl: string;
  readonly rpcUrl: string;
  readonly contract: string;
  readonly faucetUrl: string | undefined;
  readonly enableLocalWallet: boolean;
}

const envConfig = (): Config => {
  return {
    chainId: requiredEnv('REACT_APP_CHAIN_ID'),
    chainName: requiredEnv('REACT_APP_CHAIN_NAME'),
    suggestChain: requiredBoolean('REACT_APP_SUGGEST_CHAIN'),
    lcdUrl: requiredEnv('REACT_APP_LCD_URL'),
    rpcUrl: requiredEnv('REACT_APP_RPC_URL'),
    contract: requiredEnv('REACT_APP_CONTRACT'),
    faucetUrl: process.env.REACT_APP_FAUCET,
    enableLocalWallet: requiredBoolean('REACT_APP_ENABLE_LOCAL_WALLET'),
  };
};

const requiredEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`${key} not configured`);
  return val;
};

const requiredBoolean = (key: string): boolean => {
  const val = process.env[key];
  if (!val) throw new Error(`${key} not configured`);
  if (val !== 'true' && val !== 'false') throw new Error(`${key} must be configured true/false`);
  return val === 'true';
};

export type { Config };
export { envConfig };
