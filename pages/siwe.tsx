"use client";
import { useEffect, useReducer } from "react";

declare global {
  interface Window {
    lukso?: any;
  }
}

import { Address, createWalletClient, custom } from "viem";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";
import { BASE_URL } from "../constants";
import { lukso } from "viem/chains";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { formatRequest, initialState, reducer } from "../utils";

const SiweLogin = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (typeof window !== "undefined" && window.lukso) {
      dispatch({
        type: "SET_WALLET_CLIENT",
        payload: createWalletClient({
          chain: lukso,
          transport: custom(window.lukso!),
        }),
      });
    }
  }, []);

  const handleSiweLogin = async () => {
    if (!state.walletClient) return;

    const [account] = await state.walletClient.requestAddresses();
    const chainId = await state.walletClient.getChainId();

    const siweMessage = createSiweMessage({
      domain: window.location.host,
      address: account as Address,
      uri: window.location.href,
      version: "1",
      chainId,
      nonce: generateSiweNonce(),
      issuedAt: new Date(),
      //Other properties that could be set to verify the validity of the signature
      // expirationTime: new Date(),
      // notBefore: new Date(),
    });

    dispatch({ type: "SET_SIWE_MESSAGE", payload: siweMessage });

    let signature;
    try {
      signature = await state.walletClient.signMessage({
        account,
        message: siweMessage,
      });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: JSON.stringify(error),
      });
      return;
    }

    dispatch({ type: "SET_SIGNATURE", payload: signature });
    dispatch({ type: "SET_LOADING", payload: true });

    const response = await fetch(
      `${BASE_URL}/siwe`,
      formatRequest("POST", { siweMessage, signature })
    );
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg text-center">
        <Image
          src="/LUKSO.svg"
          alt="LUKSO Logo"
          width={50}
          height={50}
          className="mx-auto"
        />
        <h1 className="text-2xl font-bold mt-4">Login with SIWE</h1>
        <p className="text-gray-600 mt-2">
          LUKSO Mainnet - Sign in securely using your Universal Profile.
        </p>
        <button
          onClick={handleSiweLogin}
          disabled={state.isLoading}
          className=""
        >
          {state.isLoading ? (
            <span className="flex items-center">
              <Loader2 className="animate-spin mr-2" />
              Verifying...
            </span>
          ) : (
            "Sign message"
          )}
        </button>
        {state.siweMessage && (
          <div>
            <p className="text-sm mt-4 break-words">
              📜 <b>Message</b>
            </p>
            <div className="bg-gray-100 border border-gray-300 p-4 rounded-md text-sm mt-2">
              <pre className="whitespace-pre-wrap">{state.siweMessage}</pre>
            </div>
          </div>
        )}
        {state.signature && (
          <div>
            <p className="text-sm mt-4 break-words">
              ✍️ <b>Signature</b>
            </p>
            <div className="bg-gray-100 border border-gray-300 p-4 rounded-md text-sm mt-2">
              <pre className="whitespace-pre-wrap">{state.signature}</pre>
            </div>
          </div>
        )}

        {state.isLoading && <p>⏳ Loading...</p>}

        {state.isValidSignature ? (
          <p className="mt-8 max-w-[500px]">✅ Your signature is valid 👏</p>
        ) : (
          state.signature &&
          !state.isLoading &&
          !state.error && (
            <p className="mt-8 max-w-[500px]">😥 Invalid signature.</p>
          )
        )}

        {state.error && (
          <p className="text-red-600 mt-4">
            ❌ An error occurred: {state.error}
          </p>
        )}
      </div>
    </div>
  );
};

export default SiweLogin;
