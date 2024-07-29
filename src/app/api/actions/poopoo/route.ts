import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";

import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  Keypair,
} from "@solana/web3.js";

import {
  createMintToInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export const GET = (req: Request) => {
  const payload: ActionGetResponse = {
    icon: new URL("/shit_coin_icon.png", new URL(req.url).origin).toString(),
    label: "Mint PooPoo",
    description: "Mint PooPoo to Anyone",
    title: "PooPoo",
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    console.log(req.text())
    const body: ActionPostRequest = await req.json();
    console.log('Request Body:', body);
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }

    const connection = new Connection(
      process.env.SOLANA_RPC! || clusterApiUrl("devnet"),
    );

    const mintAccount = process.env.MINT_ACCOUNT || "";
    const mintAuthority = process.env.MINT_AUTHORITY || "";
    const secretKeyString = process.env.MINT_KEY || "";
    const secretKeyBytes = secretKeyString
      .split(",")
      .map((num) => parseInt(num, 10));
    const secretKeyUint8Array = new Uint8Array(secretKeyBytes);
    let mintKeypair = Keypair.fromSecretKey(secretKeyUint8Array);
    const transaction = new Transaction().add(
      // SystemProgram.createAccount({
      //     fromPubkey: account,
      //     newAccountPubkey: mint,
      //     space: mintLen,
      //     lamports,
      //     programId: TOKEN_2022_PROGRAM_ID,
      // }),
      createMintToInstruction(
        new PublicKey(mintAccount),
        account,
        new PublicKey(mintAuthority),
        10000000000,
        [mintKeypair.publicKey],
        TOKEN_2022_PROGRAM_ID,
      ), // Use new PublicKey() to convert the string to PublicKey
    );
    // set the end user as the fee payer
    transaction.feePayer = account;

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    const payload: ActionPostResponse = await createPostResponse({
        fields: {
          transaction,
          message: "Mint the PooPoo",
        },
        // no additional signers are required for this transaction
        signers: [mintKeypair],
      });
      console.log('Response Payload:', payload);
      return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      });
  } catch (err) {
    console.log(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
};
