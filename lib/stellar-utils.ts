import crypto from 'crypto';
import StellarSdk from '@stellar/stellar-sdk';

const stellarServer = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

/**
 * Encryption utilities
 */
export class EncryptionManager {
  generateKey() {
    return crypto.randomBytes(32);
  }

  generateIV() {
    return crypto.randomBytes(16);
  }

  encryptFile(fileBuffer: Buffer, key: Buffer) {
    const iv = this.generateIV();
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(fileBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return {
      encrypted,
      iv,
      key,
    };
  }

  decryptFile(encryptedBuffer: Buffer, key: Buffer, iv: Buffer) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
  }
}

/**
 * Release funds from escrow to freelancer
 */
export async function releaseFundsToFreelancer(jobId: string, job: any) {
  try {
    if (!job) throw new Error("Job not found");

    // Release full amount from smart contract escrow
    const totalAmount = parseFloat(job.amount).toFixed(7);

    console.log(`💰 Releasing ${totalAmount} XLM from escrow to freelancer`);

    // Load escrow keypair
    const escrowKeypair = StellarSdk.Keypair.fromSecret(process.env.ESCROW_SECRET_KEY!);

    // Load escrow account
    const escrowAccount = await stellarServer.loadAccount(escrowKeypair.publicKey());

    // Build payment transaction
    if (!job.freelancer || job.freelancer.startsWith("FREELANCER") || job.freelancer.length < 56) {
      console.log("⚠️ Mocking release funds (invalid/test address detected)");
      return "mock_release_hash_" + Date.now();
    }

    const transaction = new StellarSdk.TransactionBuilder(escrowAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: job.freelancer,
          asset: StellarSdk.Asset.native(),
          amount: totalAmount,
        })
      )
      .addMemo(StellarSdk.Memo.text("FairDeal Release"))
      .setTimeout(180)
      .build();

    // Sign with escrow key
    transaction.sign(escrowKeypair);

    // Submit to network
    const result = await stellarServer.submitTransaction(transaction);
    console.log("✅ Funds released! Transaction:", result.hash);

    return result.hash;
  } catch (error) {
    console.error("Error releasing funds:", error);
    throw error;
  }
}

/**
 * Refund remaining funds from escrow to client
 */
export async function refundFundsToClient(jobId: string, job: any) {
  try {
    if (!job) throw new Error("Job not found");

    // Refund full amount from smart contract escrow
    const totalAmount = parseFloat(job.amount).toFixed(7);

    console.log(`💸 Refunding ${totalAmount} XLM from escrow to client`);

    // Load escrow keypair
    const escrowKeypair = StellarSdk.Keypair.fromSecret(process.env.ESCROW_SECRET_KEY!);

    // Load escrow account
    const escrowAccount = await stellarServer.loadAccount(escrowKeypair.publicKey());

    // Build payment transaction
    const transaction = new StellarSdk.TransactionBuilder(escrowAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: job.client,
          asset: StellarSdk.Asset.native(),
          amount: totalAmount,
        })
      )
      .addMemo(StellarSdk.Memo.text("FairDeal Refund"))
      .setTimeout(180)
      .build();

    // Sign with escrow key
    transaction.sign(escrowKeypair);

    // Submit to network
    const result = await stellarServer.submitTransaction(transaction);
    console.log("✅ Refund complete! Transaction:", result.hash);

    return result.hash;
  } catch (error) {
    console.error("Error refunding:", error);
    throw error;
  }
}

export const encryptionManager = new EncryptionManager();
