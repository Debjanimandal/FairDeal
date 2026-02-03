import { NextResponse } from 'next/server';

export async function GET() {
  const escrowAddress = process.env.ESCROW_PUBLIC_KEY;
  
  if (!escrowAddress) {
    return NextResponse.json(
      { success: false, error: 'Escrow address not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    escrowAddress,
    network: 'testnet',
    contractId: process.env.NEXT_PUBLIC_CONTRACT_ID,
  });
}
