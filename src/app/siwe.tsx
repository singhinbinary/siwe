"use client";
import { useEffect, useReducer } from "react";

declare global {
  interface Window {
    lukso?: any;
  }
}

import { Address, createWalletClient, custom } from "viem";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";
import { formatRequest, initialState, reducer } from "./utils";
import { BASE_URL } from "../../globals";
import { luksoTestnet } from "viem/chains";

const SiweLogin = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (typeof window !== "undefined" && window.lukso) {
      dispatch({
        type: "SET_WALLET_CLIENT",
        payload: createWalletClient({
          chain: luksoTestnet,
          transport: custom(window.lukso!),
        }),
      });
    }
  }, []);

  const handleSiweLogin = async () => {
    if (!state.walletClient) return;

    const [account] = await state.walletClient.getAddresses();

    const chainId = await state.walletClient.getChainId();

    const siweMessage = createSiweMessage({
      domain: window.location.host,
      address: account as Address,
      uri: window.location.href,
      version: "1",
      chainId,
      nonce: generateSiweNonce(),
      issuedAt: new Date(),
      // expirationTime: new Date(), //Other properties that could be set to verify the validity of the message
      // notBefore: new Date(),
    });

    dispatch({ type: "SET_SIWE_MESSAGE", payload: siweMessage });

    const signature = await state.walletClient.signMessage({
      account,
      message: siweMessage,
    });

    dispatch({ type: "SET_SIGNATURE", payload: signature });
    dispatch({ type: "SET_LOADING", payload: true });

    const queryParameters = formatRequest("POST", { siweMessage, signature });

    const response = await fetch(`${BASE_URL}/siwe`, queryParameters);
    const responseJson = await response.json();

    dispatch({
      type: "SET_ERROR",
      payload: responseJson.error,
    });

    dispatch({
      type: "SET_VALID_SIGNATURE",
      payload: responseJson.isValidSignature ?? false,
    });

    dispatch({ type: "SET_LOADING", payload: false });
  };

  return (
    <div>
      <div
        className=" absolute inset-0 rotate-180 bg-cover bg-center bg-no-repeat opacity-20 dark:hidden"
        style={{
          filter: "blur(4px)",
        }}
      ></div>
      <div className="container relative z-10 py-20 xl:py-48">
        <div className="grid items-center gap-8 xl:grid-cols-7 xl:gap-20">
          <div className="order-2 xl:order-1 xl:col-span-5">
            <p className="mt-3 text-3xl font-semibold leading-normal">
              Login with SIWE
            </p>
            <div className={"mt-8 inline-flex items-center gap-3"}>
              <button
                color="primary"
                className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold transition duration-300 ease-in-out hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleSiweLogin}
                disabled={state.isLoading}
              >
                Sign message with my crypto key
              </button>
            </div>
            {state.siweMessage && (
              <div>
                <p className="mt-8 max-w-[500px]">SIWE message:</p>
                <p className="mt-1 max-w-[500px]">{state.siweMessage}</p>
              </div>
            )}
            {state.signature && (
              <p className="mt-8 max-w-[500px]">Signature: {state.signature}</p>
            )}
            {state.isLoading && (
              <p className="mt-8 max-w-[500px]">
                ⏳ Verifying your signature ...{" "}
              </p>
            )}
            {state.isValidSignature ? (
              <p className="mt-8 max-w-[500px]">Your signature is valid 👏</p>
            ) : (
              state.signature &&
              !state.isLoading &&
              !state.error && (
                <p className="mt-8 max-w-[500px]">😥 Invalid signature</p>
              )
            )}

            {state.error && (
              <p className="mt-8 max-w-[500px]">
                ❌ An error occured verifying your signature
              </p>
            )}
          </div>

          <div className="order-1 xl:order-2 xl:col-span-2"></div>
        </div>
      </div>
    </div>
  );
};

export default SiweLogin;
