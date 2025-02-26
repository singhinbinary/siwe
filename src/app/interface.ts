/* eslint-disable @typescript-eslint/no-explicit-any */

import { WalletClient } from "viem";

export interface State {
  signature: string;
  isLoading: boolean;
  isValidSignature: boolean;
  siweMessage: string;
  walletClient: WalletClient | undefined;
}

export interface Action {
  type:
    | "SET_SIGNATURE"
    | "SET_LOADING"
    | "SET_VALID_SIGNATURE"
    | "SET_SIWE_MESSAGE"
    | "SET_WALLET_CLIENT";
  payload: any;
}
