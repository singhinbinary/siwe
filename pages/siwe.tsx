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
import { Loader2 } from "lucide-react";
import { formatRequest, initialState, reducer } from "../utils";
import Link from "next/link";

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
        <h1 className="text-2xl font-bold mt-4">Login with SIWE</h1>

        <p className="text-lg font-semibold mt-4">
          <a
            href="https://example.com/siwe-article"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Read the article on SIWE
          </a>
        </p>
        <p>Prerequisites: Ensure you have</p>
        <p>
          1. LUKSO{" "}
          <Link
            href="https://chromewebstore.google.com/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn?hl=en-GB&utm_source=ext_sidebar"
            rel="noopener noreferrer"
            target="_blank"
          >
            Browser Extension{" "}
          </Link>
          installed
        </p>

        <p>
          2. A{" "}
          <Link
            href="https://my.universalprofile.cloud/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Universal Profile{" "}
          </Link>
          deployed on LUKSO Mainnet
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
            "Login"
          )}
        </button>
        {state.siweMessage && (
          <div>
            <p className="text-sm mt-4 break-words">
              📜 <b> Sign this Message</b>
            </p>
            <div className="bg-gray-100 border border-gray-300 p-4 rounded-md text-sm mt-2">
              <pre className="whitespace-pre-wrap">{state.siweMessage}</pre>
            </div>
          </div>
        )}
        {state.signature && (
          <div>
            <p className="text-sm mt-4 break-words">
              ✍️ <b> Your Signature</b>
            </p>
            <div className="bg-gray-100 border border-gray-300 p-4 rounded-md text-sm mt-2">
              <pre className="whitespace-pre-wrap">{state.signature}</pre>
            </div>
          </div>
        )}

        {state.isLoading && <p>⏳ Verifying signature...</p>}

        {state.isValidSignature ? (
          <p className="mt-8 max-w-[500px]">
            ✅ Your signature is valid 👏 You have been logged in
          </p>
        ) : (
          state.signature &&
          !state.isLoading &&
          !state.error && (
            <p className="mt-8 max-w-[500px]">
              😥 Invalid signature. Make sure you are login in with a Universal
              Profile deployed on LUKSO Mainnet.
            </p>
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
