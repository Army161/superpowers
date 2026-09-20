#!/usr/bin/env node
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOTAL_SUPPLY = 7_777_777_777;
const DECIMALS = 9;

interface DeployConfig {
  network: "devnet" | "mainnet-beta";
  revokeMint: boolean;
  dryRun: boolean;
}

function parseArgs(): DeployConfig {
  const args = process.argv.slice(2);
  return {
    network: (process.env.SIGNAL_NETWORK as DeployConfig["network"]) ?? "devnet",
    revokeMint: args.includes("--revoke-mint"),
    dryRun: args.includes("--dry-run"),
  };
}

function loadOrGenerateKeypair(): Keypair {
  const secret = process.env.SIGNAL_DEPLOYER_SECRET;
  if (secret) {
    const decoded = Uint8Array.from(JSON.parse(secret));
    return Keypair.fromSecretKey(decoded);
  }
  return Keypair.generate();
}

async function main() {
  const config = parseArgs();
  const deployer = loadOrGenerateKeypair();
  const rpcUrl =
    config.network === "mainnet-beta"
      ? clusterApiUrl("mainnet-beta")
      : clusterApiUrl("devnet");

  const connection = new Connection(rpcUrl, "confirmed");
  const walletsConfig = JSON.parse(
    await readFile(join(__dirname, "../wallets.json"), "utf-8")
  );

  console.log("=== $SIGNAL Token Deployment ===");
  console.log(`Network: ${config.network}`);
  console.log(`Deployer: ${deployer.publicKey.toBase58()}`);
  console.log(`Total supply: ${TOTAL_SUPPLY.toLocaleString()} SIGNAL`);
  console.log(`Dry run: ${config.dryRun}`);

  if (config.dryRun) {
    console.log("\nAllocation plan:");
    for (const [key, alloc] of Object.entries(walletsConfig.allocations) as [
      string,
      { percent: number; tokens: number; label: string },
    ][]) {
      console.log(`  ${key}: ${alloc.percent}% (${alloc.tokens.toLocaleString()}) — ${alloc.label}`);
    }
    console.log("\nLaunch checks:");
    for (const check of walletsConfig.launchChecks) {
      console.log(`  [ ] ${check}`);
    }
    console.log("\nTo deploy for real, run without --dry-run on devnet with funded wallet.");
    return;
  }

  if (config.network === "devnet") {
    const balance = await connection.getBalance(deployer.publicKey);
    if (balance < 0.5 * LAMPORTS_PER_SOL) {
      console.log("Airdropping SOL on devnet...");
      const sig = await connection.requestAirdrop(
        deployer.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(sig);
    }
  }

  console.log("\nCreating mint...");
  const mint = await createMint(
    connection,
    deployer,
    deployer.publicKey,
    null,
    DECIMALS,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );

  console.log(`Mint address: ${mint.toBase58()}`);

  const allocations = walletsConfig.allocations as Record<
    string,
    { percent: number; tokens: number; label: string }
  >;

  const mintAccounts: Record<string, string> = {};

  for (const [bucket, alloc] of Object.entries(allocations)) {
    const bucketKeypair = Keypair.generate();
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      deployer,
      mint,
      bucketKeypair.publicKey
    );

    const amount = BigInt(alloc.tokens) * BigInt(10 ** DECIMALS);
    await mintTo(connection, deployer, mint, ata.address, deployer, amount);

    mintAccounts[bucket] = bucketKeypair.publicKey.toBase58();
    console.log(`  ${alloc.label}: ${alloc.tokens.toLocaleString()} → ${bucketKeypair.publicKey.toBase58()}`);
  }

  if (config.revokeMint) {
    console.log("\nRevoking mint authority...");
    await setAuthority(
      connection,
      deployer,
      mint,
      deployer.publicKey,
      AuthorityType.MintTokens,
      null
    );
    console.log("Mint authority revoked.");
  }

  const deployResult = {
    network: config.network,
    mint: mint.toBase58(),
    deployer: deployer.publicKey.toBase58(),
    decimals: DECIMALS,
    totalSupply: TOTAL_SUPPLY,
    mintAuthorityRevoked: config.revokeMint,
    freezeAuthority: null,
    allocations: mintAccounts,
    deployedAt: new Date().toISOString(),
  };

  const outDir = join(__dirname, "../../../data/deployments");
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, `signal-${config.network}-${Date.now()}.json`);
  await writeFile(outPath, JSON.stringify(deployResult, null, 2));

  console.log(`\nDeployment saved to ${outPath}`);
  console.log("\nNext steps:");
  console.log("  1. Lock LP tokens (70%) via Streamflow or equivalent");
  console.log("  2. Set up 3-of-5 multisig for culture treasury");
  console.log("  3. Configure 2-year vesting for core contributors");
  console.log("  4. Submit to Jupiter/Raydium for liquidity pool");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
