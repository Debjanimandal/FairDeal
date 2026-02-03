import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

// Stellar testnet configuration
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Build a payment transaction from source to destination
 * @param sourcePublicKey - The sender's public key
 * @param destinationPublicKey - The recipient's public key
 * @param amount - Amount of XLM to send
 * @param memo - Optional memo text
 * @returns Transaction XDR string ready for signing
 */
export async function buildPaymentTransaction(
    sourcePublicKey: string,
    destinationPublicKey: string,
    amount: string,
    memo?: string
): Promise<string> {
    try {
        // Load the source account
        const sourceAccount = await server.loadAccount(sourcePublicKey);

        // Build the transaction
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(
                StellarSdk.Operation.payment({
                    destination: destinationPublicKey,
                    asset: StellarSdk.Asset.native(), // XLM
                    amount: amount,
                })
            )
            .setTimeout(180); // 3 minutes timeout

        // Add memo if provided
        if (memo) {
            transaction.addMemo(StellarSdk.Memo.text(memo));
        }

        const builtTransaction = transaction.build();
        return builtTransaction.toXDR();
    } catch (error: any) {
        console.error('Error building transaction:', error);
        throw new Error(`Failed to build transaction: ${error.message}`);
    }
}

/**
 * Sign a transaction using Freighter wallet
 * @param transactionXDR - The transaction XDR to sign
 * @param publicKey - The public key of the signer
 * @returns Signed transaction XDR
 */
export async function signTransactionWithFreighter(
    transactionXDR: string,
    publicKey: string
): Promise<string> {
    try {
        const { signedTxXdr, error } = await signTransaction(transactionXDR, {
            networkPassphrase: NETWORK_PASSPHRASE,
            address: publicKey,
        });

        if (error) {
            throw new Error(error);
        }

        if (!signedTxXdr) {
            throw new Error('No signed transaction returned from Freighter');
        }

        return signedTxXdr;
    } catch (error: any) {
        console.error('Error signing transaction:', error);
        throw new Error(`Failed to sign transaction: ${error.message}`);
    }
}

/**
 * Submit a signed transaction to the Stellar network
 * @param signedXDR - The signed transaction XDR
 * @returns Transaction result including hash
 */
export async function submitSignedTransaction(signedXDR: string): Promise<{
    hash: string;
    ledger: number;
    successful: boolean;
}> {
    try {
        const transaction = StellarSdk.TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);

        const result = await server.submitTransaction(transaction);

        return {
            hash: result.hash,
            ledger: result.ledger,
            successful: result.successful,
        };
    } catch (error: any) {
        console.error('Error submitting transaction:', error);

        // Stellar-specific error handling
        if (error.response?.data?.extras?.result_codes) {
            const resultCodes = error.response.data.extras.result_codes;
            throw new Error(
                `Transaction failed: ${resultCodes.transaction} - ${JSON.stringify(resultCodes.operations)}`
            );
        }

        throw new Error(`Failed to submit transaction: ${error.message}`);
    }
}

/**
 * Complete payment flow: build, sign, and submit transaction
 * @param sourcePublicKey - Sender's wallet address
 * @param destinationPublicKey - Recipient's wallet address
 * @param amount - Amount of XLM
 * @param memo - Optional memo
 * @returns Transaction hash
 */
export async function executePayment(
    sourcePublicKey: string,
    destinationPublicKey: string,
    amount: string,
    memo?: string
): Promise<string> {
    try {
        // Step 1: Build transaction
        console.log('Building payment transaction...');
        const transactionXDR = await buildPaymentTransaction(
            sourcePublicKey,
            destinationPublicKey,
            amount,
            memo
        );

        // Step 2: Sign with Freighter
        console.log('Requesting signature from Freighter...');
        const signedXDR = await signTransactionWithFreighter(transactionXDR, sourcePublicKey);

        // Step 3: Submit to network
        console.log('Submitting transaction to Stellar network...');
        const result = await submitSignedTransaction(signedXDR);

        if (!result.successful) {
            throw new Error('Transaction was not successful');
        }

        console.log('Transaction successful! Hash:', result.hash);
        return result.hash;
    } catch (error: any) {
        console.error('Payment execution failed:', error);
        throw error;
    }
}

/**
 * Verify a transaction on the Stellar network
 * @param transactionHash - The transaction hash to verify
 * @returns Transaction details if found
 */
export async function verifyTransaction(transactionHash: string): Promise<any> {
    try {
        const transaction = await server.transactions().transaction(transactionHash).call();
        return transaction;
    } catch (error: any) {
        console.error('Error verifying transaction:', error);
        throw new Error(`Failed to verify transaction: ${error.message}`);
    }
}
