interface Config {
  readonly lcdUrl: string;
  readonly contract: string;
  readonly faucetUrl: string | undefined;
}

export default (): Config => {
  const lcdUrl: string = lcdUrlFromEnv();
  const contract: string = contractFromEnv();
  return {
    lcdUrl,
    contract,
    faucetUrl: process.env.REACT_APP_FAUCET,
  };
};

const lcdUrlFromEnv = (): string => {
  const reactAppContract = process.env.REACT_APP_LCD_URL;
  if (!reactAppContract) throw new Error('REACT_APP_LCD_URL not configured');
  return reactAppContract;
};

const contractFromEnv = (): string => {
  const reactAppContract = process.env.REACT_APP_CONTRACT;
  if (!reactAppContract) throw new Error('REACT_APP_CONTRACT not configured');
  return reactAppContract;
};
