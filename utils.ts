import { WalletClient } from "viem";

interface State {
  signature: string;
  isLoading: boolean;
  isValidSignature: boolean;
  siweMessage: string;
  walletClient: WalletClient | undefined;
  error: string;
}

interface Action {
  type:
    | "SET_SIGNATURE"
    | "SET_LOADING"
    | "SET_VALID_SIGNATURE"
    | "SET_SIWE_MESSAGE"
    | "SET_WALLET_CLIENT"
    | "SET_ERROR";

  payload: any;
}

export function formatRequest(method: string, data?: unknown) {
  const headers = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
  };

  const request = {
    method,
    headers,
    body: JSON.stringify(data),
  };

  return request;
}

export const initialState = {
  signature: "",
  isLoading: false,
  isValidSignature: false,
  siweMessage: "",
  walletClient: undefined,
  error: "",
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SIGNATURE":
      return { ...state, signature: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_VALID_SIGNATURE":
      return { ...state, isValidSignature: action.payload };
    case "SET_SIWE_MESSAGE":
      return { ...state, siweMessage: action.payload };
    case "SET_WALLET_CLIENT":
      return { ...state, walletClient: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}
