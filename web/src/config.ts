interface Config {
  readonly chainId: string;
  readonly chainName: string;
  readonly lcdUrl: string;
  readonly rpcUrl: string;
  readonly contract: string;
  readonly faucetUrl: string | undefined;
}

const envConfig = (): Config => {
  return {
    chainId: requiredEnv('REACT_APP_CHAIN_ID'),
    chainName: requiredEnv('REACT_APP_CHAIN_NAME'),
    lcdUrl: requiredEnv('REACT_APP_LCD_URL'),
    rpcUrl: requiredEnv('REACT_APP_RPC_URL'),
    contract: requiredEnv('REACT_APP_CONTRACT'),
    faucetUrl: process.env.REACT_APP_FAUCET,
  };
};

const requiredEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`${key} not configured`);
  return val;
};

export type { Config };
export { envConfig };
