import { NextRequest, NextResponse } from 'next/server';
import { encryptionManager } from '@/lib/stellar-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { encryptedData, key, iv } = body;

    if (!encryptedData || !key || !iv) {
      return NextResponse.json({ error: "Missing decryption parameters" }, { status: 400 });
    }

    const encryptedBuffer = Buffer.from(encryptedData, "hex");
    const keyBuffer = Buffer.from(key, "hex");
    const ivBuffer = Buffer.from(iv, "hex");

    const decrypted = encryptionManager.decryptFile(encryptedBuffer, keyBuffer, ivBuffer);

    return NextResponse.json({
      decrypted: decrypted.toString("base64"),
      message: "File decrypted successfully",
    });
  } catch (error: any) {
    console.error("Decryption error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
