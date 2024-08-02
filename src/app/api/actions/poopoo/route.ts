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
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export const GET = (req: Request) => {
  const accountParameterName = "to";
  const payload: ActionGetResponse = {
    icon: "https://github.com/Andlyn666/solana_coin/blob/main/shit_coin_icon.png?raw=true",
    label: "Mint PooPoo",
    description: "Mint PooPoo to Anyone",
    title: "PooPoo",
    links: {
      actions:[
        {
          href: `/api/poopoo/&to={to}`,
          label: `Throw shit to `,
          parameters: [
            {
              name: accountParameterName,
              label: 'Account for throwing shit',
              required: true,
            },
          ],
        },
      ]
    }
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const body: ActionPostRequest = await req.json();
    
    const requestUrl = new URL(req.url);
    const payer: PublicKey = new PublicKey(body.account)
    let to: PublicKey = payer;
    try {
      to = validatedQueryParams(requestUrl, payer);
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
      to, // owner
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        payer,
        ata,
        to,
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
    transaction.feePayer = payer;
    transaction.recentBlockhash = (
      await connection.getRecentBlockhash()
    ).blockhash;
    transaction.partialSign(mintKeypair);
    const payload: ActionPostResponse = await createPostResponse({
        fields: {
          transaction,
          message: "Mint the PooPoo",
        },
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

function validatedQueryParams(requestUrl: URL, account: PublicKey):PublicKey {
  let to: PublicKey = account;
  try {
    if (requestUrl.searchParams.get("to")) {
      to = new PublicKey(requestUrl.searchParams.get("to")!);
    }
  } catch (err) {
    console.log("invalid to account");
  }
    return to
}