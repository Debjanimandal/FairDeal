import { NextResponse } from 'next/server';
import { clearStorage } from '@/lib/storage';

export async function POST() {
    try {
        clearStorage();
        console.log("🧹 Database cleared.");
        return NextResponse.json({ success: true, message: "All jobs and data cleared." });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
