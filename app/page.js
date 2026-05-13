'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [status, setStatus] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
    checkSubscription();
  }, []);

  async function checkSubscription() {
    if (!('PushManager' in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setSubscribed(!!sub);
  }

  async function subscribe() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('❌ 알림 권한이 거부되었습니다.');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/vapid-public-key');
      const { publicKey } = await res.json();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });
      setSubscribed(true);
      setStatus('✅ 알림 구독 완료! 매일 오전 9시, 오후 6시에 알림이 와요.');
    } catch (err) {
      setStatus('❌ 오류: ' + err.message);
    }
    setLoading(false);
  }

  async function testNotify() {
    setLoading(true);
    const res = await fetch('/api/notify');
    const data = await res.json();
    if (data.success) {
      setStatus(`✅ 테스트 완료!\n📅 페어링: ${data.pairing?.join(', ') || '없음'}\n🥚 알: ${data.eggs?.join(', ') || '없음'}`);
    } else {
      setStatus('ℹ️ ' + (data.message || data.error));
    }
    setLoading(false);
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
        borderRadius: '24px', padding: '40px', maxWidth: '400px', width: '100%',
        border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🦎</div>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>브리​​​​​​​​​​​​​​​​
