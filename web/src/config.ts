interface Config {
  readonly contract: string;
  readonly faucetUrl: string | undefined;
}

export default (): Config => {
  const contract: string = contractFromEnv();
  return {
    contract,
    faucetUrl: process.env.REACT_APP_FAUCET,
  };
};

const contractFromEnv = (): string => {
  const reactAppContract = process.env.REACT_APP_CONTRACT;
  if (!reactAppContract) throw new Error('REACT_APP_CONTRACT not configured');
  return reactAppContract;
};
