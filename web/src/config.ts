interface Config {
  codeId: number;
}

export default (): Config => {
  const reactAppCodeId = process.env.REACT_APP_CODE_ID;
  if (!reactAppCodeId) throw new Error('REACT_APP_CODE_ID not configured');
  const codeIdParsed = parseInt(reactAppCodeId);
  const codeId: number = +codeIdParsed;
  return Object.freeze({ codeId });
};
