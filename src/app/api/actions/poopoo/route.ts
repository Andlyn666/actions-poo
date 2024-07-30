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
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
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
    console.log(1)
    const body: ActionPostRequest = await req.json();
    console.log(2)
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
    let ata = await getAssociatedTokenAddress(
      new PublicKey(mintAccount), // mint
      account, // owner
      false // allow owner off curve
    );
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        account,
        ata,
        account,
        new PublicKey(mintAccount),
        TOKEN_2022_PROGRAM_ID,
      ),
      createMintToInstruction(
        new PublicKey(mintAccount),
        ata,
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
