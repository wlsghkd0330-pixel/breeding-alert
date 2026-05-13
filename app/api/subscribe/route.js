import { NextResponse } from 'next/server';

const subscriptions = [];

export async function POST(request) {
  try {
    const subscription = await request.json();
    const exists = subscriptions.some(s => s.endpoint === subscription.endpoint);
    if (!exists) subscriptions.push(subscription);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(subscriptions);
}
