import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, off } from "firebase/database";

// Insert your Firebase config here
const firebaseConfig = {
  apiKey: "AIzaSyC1kJHPxsLoT-xKBDRvZGOZuQTwJtNotj0",
  authDomain: "igcse-maths-sync.firebaseapp.com",
  databaseURL: "https://igcse-maths-sync-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "igcse-maths-sync",
  storageBucket: "igcse-maths-sync.firebasestorage.app",
  messagingSenderId: "110813873083",
  appId: "1:110813873083:web:ecca91fcbf01a2da5b3a9e",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const generateMagicName = () => {
  const adjs = ["Swift", "Clever", "Bright", "Math", "Magic", "Cool", "Zen", "Golden", "Epic", "Eternal"];
  const nouns = ["Unicorn", "Fox", "Owl", "Dragon", "Panda", "Koala", "Tiger", "Eagle", "Wolf", "Strawberry", "Oblivion", "Sphere", "Rat"];
  return `${adjs[Math.floor(Math.random() * adjs.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
};

const generateMagicRoom = () => `room-${Math.floor(1000 + Math.random() * 9000)}`;

export default function SyncPortal({ storageKey }) {
  const ROOM_STORAGE_KEY = `sync_room_${storageKey}`;
  const NAME_STORAGE_KEY = `sync_name_${storageKey}`;
  const myId = useMemo(() => Math.random().toString(36).substring(7), []);

  const [roomId, setRoomId] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem(ROOM_STORAGE_KEY) || '' : ''));
  const [userName, setUserName] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem(NAME_STORAGE_KEY) || '' : ''));
  const [isConnected, setIsConnected] = useState(!!(roomId && userName));
  const [incomingData, setIncomingData] = useState(null);
  const [status, setStatus] = useState(isConnected ? 'Connected' : 'Offline');

  // --- BROADCAST LOGIC ---
  const broadcastSpecific = async (itemToPush) => {
    if (!itemToPush) return;
    
    setStatus('📡 Sharing...');
    await set(ref(db, `sync/${roomId}`), {
      payload: itemToPush,
      senderName: userName,
      senderId: myId,
      timestamp: Date.now()
    });
    setStatus('✅ Shared!');
    setTimeout(() => setStatus('Connected'), 2000);
  };

  // --- AUTO-PUSH LISTENER (Clipboard Trigger) ---
  useEffect(() => {
    const handleAutoPush = (e) => {
      if (isConnected && roomId) {
        broadcastSpecific(e.detail); 
      }
    };

    window.addEventListener('broadcast-specific-question', handleAutoPush);
    return () => window.removeEventListener('broadcast-specific-question', handleAutoPush);
  }, [isConnected, roomId, userName]);

  // --- DATABASE LISTENER (With ID Guard) ---
  useEffect(() => {
    if (!isConnected || !roomId) return;
    const roomRef = ref(db, `sync/${roomId}`);
    
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      const lastSeen = localStorage.getItem('last_processed_sync_id');

      // Only show if it's new (last 2 mins), not from me, AND we haven't processed it yet
      if (
        data && 
        data.timestamp > Date.now() - 120000 && 
        data.senderId !== myId &&
        data.timestamp.toString() !== lastSeen
      ) {
        setIncomingData(data);
        setStatus(`New from ${data.senderName}!`);
      }
    });
    return () => off(roomRef);
  }, [isConnected, roomId, myId]);

  const handleJoin = () => {
    if (!roomId.trim() || !userName.trim()) return alert("Need Room & Name!");
    localStorage.setItem(ROOM_STORAGE_KEY, roomId);
    localStorage.setItem(NAME_STORAGE_KEY, userName);
    setIsConnected(true);
    setStatus('Connected');
  };

  const handleMagicJoin = () => {
    const mRoom = generateMagicRoom();
    const mName = generateMagicName();
    setRoomId(mRoom); setUserName(mName);
    setTimeout(() => {
      localStorage.setItem(ROOM_STORAGE_KEY, mRoom);
      localStorage.setItem(NAME_STORAGE_KEY, mName);
      setIsConnected(true);
      setStatus('Connected');
    }, 300);
  };

  const handleLeave = () => {
    localStorage.removeItem(ROOM_STORAGE_KEY);
    localStorage.removeItem(NAME_STORAGE_KEY);
    setRoomId(''); setUserName('');
    setIsConnected(false); setIncomingData(null);
    setStatus('Offline');
  };

  // --- PULL LOGIC (With State Clear & Delayed Reload) ---
  const handlePull = async () => {
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const newItem = incomingData.payload;
    
    if (!existing.find(item => item.id === newItem.id)) {
      // 1. Save to history
      localStorage.setItem(storageKey, JSON.stringify([newItem, ...existing]));
      
      // 2. Mark as seen in local storage so it doesn't pop up after reload
      localStorage.setItem('last_processed_sync_id', incomingData.timestamp.toString());

      // 3. Clear UI state instantly
      setIncomingData(null);
      setStatus('Connected');

      // 4. Slight delay to let React render the cleared state before nuking the page
      setTimeout(() => {
        window.location.reload(); 
      }, 150);
    } else {
      alert("Already in your history!");
      // Mark as seen anyway so the notification goes away
      localStorage.setItem('last_processed_sync_id', incomingData.timestamp.toString());
      setIncomingData(null);
      setStatus('Connected');
    }
  };

  return (
    <div style={{ background: 'var(--sl-color-gray-6)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--sl-color-gray-5)', marginBottom: '2rem' }}>
      {!isConnected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.8 }}>📡 Join Revision Portal</p>
          
          {/* Room Input - Full Width */}
          <input 
            type="text" 
            placeholder="Room ID (e.g. room-1234)" 
            value={roomId} 
            onChange={(e) => setRoomId(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.85rem', borderRadius: '4px', background: 'rgba(var(--sl-color-gray-5-rgb), 0.3)', color: 'var(--sl-color-text)', border: '1px solid var(--sl-color-gray-4)', outline: 'none' }} 
          />
          
          {/* Name Input - New Line, Full Width */}
          <input 
            type="text" 
            placeholder="Your Name" 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.85rem', borderRadius: '4px', background: 'rgba(var(--sl-color-gray-5-rgb), 0.3)', color: 'var(--sl-color-text)', border: '1px solid var(--sl-color-gray-4)', outline: 'none' }} 
          />

          {/* Buttons Row */}
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
            <button onClick={handleJoin} style={{ flex: 2, background: 'var(--sl-color-accent-high)', color: 'white', border: 'none', padding: '0.5rem', fontSize: '0.85rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Connect</button>
            <button onClick={handleMagicJoin} style={{ flex: 1, background: 'var(--sl-color-gray-5)', color: 'var(--sl-color-text)', border: '1px solid var(--sl-color-accent)', padding: '0.5rem', fontSize: '0.85rem', borderRadius: '4px', cursor: 'pointer' }}>✨ Magic</button>
          </div>
        </div>
      ) : (
        /* ... rest of the code remains the same ... */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <span>📍 <b>{roomId}</b> as <b>{userName}</b></span>
            <span style={{ color: 'var(--sl-color-accent-high)' }}>{status}</span>
          </div>

          {incomingData ? (
            <button onClick={handlePull} className="sync-pulse" style={{ background: 'var(--sl-color-text-accent)', color: 'black', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              📥 {incomingData.senderName} shared a question! Click to Import
            </button>
          ) : (
            <div style={{ padding: '0.5rem', borderRadius: '6px', border: '1px dashed var(--sl-color-gray-5)', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)', textAlign: 'center' }}>
              Waiting for shared questions...
            </div>
          )}
          
          <button onClick={handleLeave} style={{ background: 'none', border: 'none', color: 'var(--sl-color-gray-3)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline', width: 'fit-content', margin: '0 auto' }}>Leave Room</button>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `.sync-pulse { animation: p 1.5s infinite; } @keyframes p { 0% {transform:scale(1);} 50% {transform:scale(0.98);} 100% {transform:scale(1);} }` }} />
    </div>
  );
}