export interface State {
  signature: string;
  isLoading: boolean;
  isValidSignature: boolean;
  siweMessage: string;
}

export interface Action {
  type:
    | "SET_SIGNATURE"
    | "SET_LOADING"
    | "SET_VALID_SIGNATURE"
    | "SET_SIWE_MESSAGE";
  payload: any;
}
