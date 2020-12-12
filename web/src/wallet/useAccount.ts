import { useEffect, useState } from 'react';
import * as SecretJS from 'secretjs';
import { Account } from './model';

const useAccount = (
  client: SecretJS.SigningCosmWasmClient | undefined,
  refreshOn: any,
): Account | undefined => {
  const [account, setAccount] = useState<Account | undefined>();
  useEffect(() => {
    if (!client) return;
    getAccount(client, setAccount);
    const interval = setInterval(async () => {
      await getAccount(client, setAccount);
    }, 10000);
    return () => clearInterval(interval);
  }, [client, refreshOn]);
  return account;
};

const getAccount = async (client: SecretJS.SigningCosmWasmClient, setAccount: Function) => {
  try {
    const account = await client.getAccount(client.senderAddress);
    setAccount({ balance: getScrtBalance(account), loading: true });
  } catch {
    setAccount((a: Account) => ({ ...a, loading: false }));
  }
};

const getScrtBalance = (account: SecretJS.Account | undefined): number => {
  if (account === undefined) return 0;
  for (let balance of account.balance) {
    if (balance.denom === 'uscrt') {
      return parseFloat(balance.amount) / 1000000;
    }
  }
  return 0;
};

export default useAccount;
