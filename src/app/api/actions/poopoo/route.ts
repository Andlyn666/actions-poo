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
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import {
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export const GET = (req: Request) => {
  const payload: ActionGetResponse = {
    icon: "https://github.com/Andlyn666/solana_coin/blob/main/shit_coin_icon.png?raw=true",
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
    const body: ActionPostRequest = await req.json();
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

    // const payKeyString = process.env.PAY_KEY || "";
    // const payKeyBytes = payKeyString
    //   .split(",")
    //   .map((num) => parseInt(num, 10));
    // const payKeyUint8Array = new Uint8Array(payKeyBytes);
    // let payKeypair = Keypair.fromSecretKey(payKeyUint8Array);
    let ata = await getAssociatedTokenAddress(
      new PublicKey(mintAccount), // mint
      account, // owner
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        account,
        ata,
        account,
        new PublicKey(mintAccount),
        TOKEN_2022_PROGRAM_ID
      ),
      createMintToInstruction(
        new PublicKey(mintAccount),
        ata,
        new PublicKey(mintAuthority),
        10000000000,
        [mintKeypair.publicKey],
        TOKEN_2022_PROGRAM_ID
      ), // Use new PublicKey() to convert the string to PublicKey
    );
    // set the end user as the fee payer
    transaction.feePayer = account;
    // execute the transaction
    // let ret = await sendAndConfirmTransaction(connection, transaction, [mintKeypair, payKeypair]);
    // console.log(ret);

    const payload: ActionPostResponse = await createPostResponse({
        fields: {
          transaction,
          message: "Mint the PooPoo",
        },
        signers: [mintKeypair],
      });
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
