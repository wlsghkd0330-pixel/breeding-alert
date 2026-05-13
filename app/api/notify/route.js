import { NextResponse } from 'next/server';
import webpush from 'web-push';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const PAIRING_DB = '247c6fdb-e744-49a7-a76d-b6b3c5c3b415';
const BREEDING_DB = '1e235770-9da1-80f9-b4b7-000be2fed8ef';

const subscriptions = [];

async function queryNotion(databaseId, filter) {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filter }),
  });
  return res.json();
}

export async function GET() {
  try {
    webpush.setVapidDetails(
      'mailto:wlsghkd0330@gmail.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const today = new Date();
    const minus15 = new Date(today); minus15.setDate(today.getDate() - 15);
    const minus65 = new Date(today); minus65.setDate(today.getDate() - 65);
    const fmt = (d) => d.toISOString().split('T')[0];

    const pairingData = await queryNotion(PAIRING_DB, {
      and: [
        { property: '상태', select: { equals: '산란 대기중' } },
        { property: '페어링 날짜', date: { on_or_before: fmt(minus15) } }
      ]
    });

    const eggData = await queryNotion(BREEDING_DB, {
      and: [
        { property: '성별', select: { equals: '알' } },
        { property: '상태', status: { equals: '생존' } },
        { property: '산란일', date: { on_or_before: fmt(minus65) } }
      ]
    });

    const pairingList = pairingData.results?.map(r =>
      r.properties?.암컷?.title?.[0]?.plain_text || '이름없음'
    ) || [];

    const eggList = eggData.results?.map(r =>
      r.properties?.이름?.title?.[0]?.plain_text || '이름없음'
    ) || [];

    if (pairingList.length === 0 && eggList.length === 0) {
      return NextResponse.json({ message: '알림 없음' });
    }

    let body = '';
    if (pairingList.length > 0) body += `산란 대기 15일 이상: ${pairingList.join(', ')}\n`;
    if (eggList.length > 0) body += `65일 이상된 알: ${eggList.join(', ')}`;

    const payload = JSON.stringify({ title: '브리딩 알림', body: body.trim(), url: '/' });

    await Promise.all(subscriptions.map(sub =>
      webpush.sendNotification(sub, payload).catch(err => console.error(err))
    ));

    return NextResponse.json({ success: true, pairing: pairingList, eggs: eggList });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}