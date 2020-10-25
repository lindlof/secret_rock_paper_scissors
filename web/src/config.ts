interface Config {
  readonly codeId: number;
}

export default (): Config => {
  const codeId: number = codeIdFromEnv();
  return { codeId };
};

const codeIdFromEnv = (): number => {
  const reactAppCodeId = process.env.REACT_APP_CODE_ID;
  if (!reactAppCodeId) throw new Error('REACT_APP_CODE_ID not configured');
  const codeIdParsed = parseInt(reactAppCodeId);
  return +codeIdParsed;
};
