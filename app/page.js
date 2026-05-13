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
        setStatus('알림 권한이 거부되었습니다.');
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
      setStatus('알림 구독 완료! 매일 오전 9시, 오후 6시에 알림이 와요.');
    } catch (err) {
      setStatus('오류: ' + err.message);
    }
    setLoading(false);
  }

  async function testNotify() {
    setLoading(true);
    const res = await fetch('/api/notify');
    const data = await res.json();
    if (data.success) {
      setStatus('테스트 완료!\n페어링: ' + (data.pairing?.join(', ') || '없음') + '\n알: ' + (data.eggs?.join(', ') || '없음'));
    } else {
      setStatus(data.message || data.error || '오류 발생');
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
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif',padding:'20px'}}>
      <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'24px',padding:'40px',maxWidth:'400px',width:'100%',textAlign:'center'}}>
        <div style={{fontSize:'64px',marginBottom:'16px'}}>🦎</div>
        <h1 style={{color:'white',fontSize:'24px',fontWeight:'700',marginBottom:'8px'}}>브리딩 알림</h1>
        <p style={{color:'rgba(255,255,255,0.6)',fontSize:'14px',marginBottom:'32px'}}>매일 오전 9시, 오후 6시 알림</p>
        {!subscribed ? (
          <button onClick={subscribe} disabled={loading} style={{width:'100%',padding:'16px',background:'linear-gradient(135deg,#667eea,#764ba2)',border:'none',borderRadius:'12px',color:'white',fontSize:'16px',fontWeight:'600',cursor:'pointer',marginBottom:'12px'}}>
            {loading ? '처리 중...' : '알림 구독하기'}
          </button>
        ) : (
          <>
            <div style={{background:'rgba(76,175,80,0.2)',borderRadius:'12px',padding:'12px',color:'#81c784',fontSize:'14px',marginBottom:'12px'}}>알림 구독 중</div>
            <button onClick={testNotify} disabled={loading} style={{width:'100%',padding:'14px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'12px',color:'white',fontSize:'15px',cursor:'pointer',marginBottom:'12px'}}>
              {loading ? '조회 중...' : '지금 확인하기'}
            </button>
            <button onClick={async()=>{const reg=await navigator.serviceWorker.ready;const sub=await reg.pushManager.getSubscription();if(sub)await sub.unsubscribe();setSubscribed(false);setStatus('알림이 해제되었습니다.');}} style={{width:'100%',padding:'12px',background:'transparent',border:'1px solid rgba(255,100,100,0.4)',borderRadius:'12px',color:'rgba(255,100,100,0.8)',fontSize:'14px',cursor:'pointer',marginBottom:'12px'}}>알림 해제</button>
          </>
        )}
        {status && <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'16px',color:'rgba(255,255,255,0.8)',fontSize:'13px',whiteSpace:'pre-line',marginTop:'8px'}}>{status}</div>}
      </div>
    </main>
  );
}