'use client';

import * as React from 'react';
const { useState, useRef, useEffect, useMemo } = React;

interface Message {
  sender: 'user' | 'bot';
  content: string;
  shouldBlush?: boolean; 
  showHearts?: boolean;
  isEmotional?: boolean;
}

export default function Home(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', content: 'Hello! I am Arin, nice to meet you!' }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emotionalCount, setEmotionalCount] = useState<number>(0);
  const [conversationEnded, setConversationEnded] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // --- 状态管理逻辑 ---
  useEffect(() => {
    const savedEmotionalCount = localStorage.getItem('emotionalCount');
    const savedConversationEnded = localStorage.getItem('conversationEnded');
    
    if (savedEmotionalCount && !isNaN(parseInt(savedEmotionalCount, 10))) {
      const count = parseInt(savedEmotionalCount, 10);
      setEmotionalCount(count);
      if (count >= 10) {
        setConversationEnded(true);
        if (messages.length === 1) {
          setMessages(prev => [...prev, { 
            sender: 'bot', 
            content: 'Conversation ended. Thank you for chatting with me!\n\nFixed Code: MUAKC' 
          }]);
        }
      }
    }
    if (savedConversationEnded === 'true') {
      setConversationEnded(true);
    }
  }, []); 

  useEffect(() => {
    localStorage.setItem('emotionalCount', emotionalCount.toString());
    localStorage.setItem('conversationEnded', conversationEnded.toString());
  }, [emotionalCount, conversationEnded]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- 核心逻辑 ---
  const checkTildeAndBlush = (text: string): { shouldBlush: boolean; showHearts: boolean; isEmotional: boolean } => {
    const hasTilde = text.includes('～') || text.includes('~');
    let shouldBlush = false;
    let showHearts = false;
    let isEmotional = false;

    if (hasTilde && !conversationEnded) {
      isEmotional = true;
      
      setEmotionalCount((prev: number) => {
        const newCount = prev + 1;
        if (newCount >= 10) {
          setConversationEnded(true);
          setTimeout(() => {
            setMessages((prevMessages: Message[]) => [...prevMessages, { 
              sender: 'bot', 
              content: 'Conversation ended. Thank you for chatting with me!\n\nFixed Code: MUAKC' 
            }]);
          }, 1000);
        }
        return newCount;
      });

      // 100% 概率脸红 (如需改回60%，将 true 改为 Math.random() < 0.6)
      const shouldShowEffects = true; 
      
      shouldBlush = shouldShowEffects;
      showHearts = shouldShowEffects;
    }

    return { shouldBlush, showHearts, isEmotional };
  };

  const sendMessage = async (): Promise<void> => {
    const msg = inputValue.trim();
    if (!msg || isLoading || conversationEnded) return;

    setMessages((prev: Message[]) => [...prev, { sender: 'user', content: msg }]);
    setInputValue('');
    setIsLoading(true);
    setMessages((prev: Message[]) => [...prev, { sender: 'bot', content: 'Typing...' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });

      const data = await response.json();

      setMessages((prev: Message[]) => prev.filter((m: Message, i: number) => !(m.sender === 'bot' && m.content === 'Typing...' && i === prev.length - 1)));

      if (data.success) {
        const reply = data.response || 'Sorry, I cannot respond at the moment.';
        const { shouldBlush, showHearts, isEmotional } = checkTildeAndBlush(reply);
        
        setMessages((prev: Message[]) => [...prev, { 
          sender: 'bot', 
          content: reply, 
          shouldBlush,
          showHearts,
          isEmotional
        }]);
        
      } else {
        setMessages((prev: Message[]) => [...prev, { sender: 'bot', content: 'Connection error.' }]);
      }
    } catch (error) {
      setMessages((prev: Message[]) => prev.filter((m) => m.content !== 'Typing...'));
      setMessages((prev: Message[]) => [...prev, { sender: 'bot', content: 'Connection error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey && !conversationEnded) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetConversation = (): void => {
    setMessages([{ sender: 'bot', content: 'Hello! I am Arin, nice to meet you!' }]);
    setEmotionalCount(0);
    setConversationEnded(false);
    setInputValue('');
    localStorage.removeItem('emotionalCount');
    localStorage.removeItem('conversationEnded');
  };

  const latestBotMessageIndex = useMemo<number>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sender === 'bot' && msg.content !== 'Typing...') {
        return i;
      }
    }
    return -1;
  }, [messages]);

  return (
    <main className="main">
      <button onClick={resetConversation} className="debug-reset-btn">Reset</button>

      <div className="stats-panel">
        <div className="stat-item">
          {/* 【修改】改回文字标题和数字计数 */}
          <div className="stat-label">Emotional Interactions</div>
          <div className="stat-value">{emotionalCount}/10</div>
        </div>
      </div>

      <div className="chat-container">
        <div className="header">
          <div className="name">Arin ~</div>
          <div className="status">Online</div>
        </div>
        
        <div className="messages">
          {messages.map((msg: Message, index: number) => {
            const isLatestBot = msg.sender === 'bot' && msg.content !== 'Typing...' && index === latestBotMessageIndex;
            const activeBlush = isLatestBot && msg.shouldBlush;
            
            return (
              <div key={index} className={`message-wrapper ${msg.sender}-message-wrapper`}>
                {msg.sender === 'bot' && msg.content !== 'Typing...' && (
                  <div className="avatar-wrapper">
                    {/* 头像容器 */}
                    <div className="message-avatar">
                      {/* 图片保持 90% 大小 */}
                      <img src="/robot-avatar.svg" alt="Arin" className="avatar-img" />
                      
                      {/* 脸红腮红叠加层 */}
                      <div className={`blush-cheek blush-left ${activeBlush ? 'active' : ''}`} />
                      <div className={`blush-cheek blush-right ${activeBlush ? 'active' : ''}`} />
                    </div>

                    {/* 爱心气泡特效 */}
                    {activeBlush && msg.showHearts && (
                      <div className="bubble-hearts-container">
                        <div className="bubble-heart heart-1">💗</div>
                        <div className="bubble-heart heart-2">💕</div>
                        <div className="bubble-heart heart-3">💖</div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`message ${msg.sender}-message`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          {conversationEnded ? (
            <div className="conversation-ended">
              <p>🎉 Relationship Maxed Out!</p>
              <p className="fixed-code">MUAKC</p>
            </div>
          ) : (
            // 【修改】恢复了 Send 按钮布局，移除了 placeholder
            <React.Fragment>
              <input
                type="text"
                className="input-field"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="" 
                disabled={isLoading}
                autoFocus
              />
              <button className="send-button" onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
                {isLoading ? '...' : 'Send'}
              </button>
            </React.Fragment>
          )}
        </div>
      </div>

      <style jsx>{`
        /* --- 基础布局 --- */
        .main {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
          background: #f0f2f5;
          padding: 20px;
          font-family: sans-serif;
        }
        .debug-reset-btn {
          position: fixed;
          top: 10px;
          right: 10px;
          background: #ff6b6b;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          z-index: 999;
        }
        
        /* 统计栏样式 */
        .stats-panel { margin-bottom: 15px; }
        .stat-item {
          background: #fff;
          padding: 8px 20px;
          border-radius: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          text-align: center;
        }
        .stat-label {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: bold;
        }
        .stat-value { 
          font-size: 20px; 
          font-weight: bold;
          color: #6a8ca9;
          margin-top: 2px;
        }

        .chat-container {
          width: 100%;
          max-width: 420px;
          height: 75vh;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .header {
          background: #6a8ca9;
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        }

        .messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #fff;
        }

        .message-wrapper {
          display: flex;
          align-items: flex-end; 
          gap: 10px;
        }
        .user-message-wrapper { justify-content: flex-end; }
        .bot-message-wrapper { justify-content: flex-start; }

        /* --- 头像与腮红 --- */
        .avatar-wrapper {
          position: relative;
        }

        .message-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #fff;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-img {
          width: 90%;
          height: 90%;
          z-index: 1;
          position: relative;
          object-fit: cover;
        }

        /* 腮红 */
        .blush-cheek {
          position: absolute;
          width: 16px; 
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,105,180, 0.7) 0%, rgba(255,192,203, 0) 70%);
          opacity: 0;
          z-index: 2; 
          transition: opacity 0.8s ease-in-out;
          bottom: 10px; 
        }

        .blush-left { left: 4px; }
        .blush-right { right: 4px; }

        .blush-cheek.active {
          opacity: 1;
        }

        /* --- 爱心气泡动画 --- */
        .bubble-hearts-container {
          position: absolute;
          top: -10px;
          left: 0;
          width: 100%;
          height: 50px;
          pointer-events: none;
          z-index: 10;
        }

        .bubble-heart {
          position: absolute;
          font-size: 14px;
          bottom: 0;
          left: 50%;
          opacity: 0;
          animation: floatBubble 2.5s ease-out forwards;
        }

        .heart-1 { font-size: 16px; margin-left: -15px; animation-delay: 0s; }
        .heart-2 { font-size: 12px; margin-left: 10px; animation-delay: 0.4s; }
        .heart-3 { font-size: 18px; margin-left: -5px; animation-delay: 0.8s; }

        @keyframes floatBubble {
          0% { transform: translateY(10px) scale(0.5); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-40px) scale(1.1); opacity: 0; }
        }

        /* --- 消息样式 --- */
        .message {
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
          position: relative;
        }
        .user-message {
          background: #6a8ca9;
          color: white;
          border-bottom-right-radius: 4px;
        }
        .bot-message {
          background: #f1f0f0;
          color: #333;
          border-bottom-left-radius: 4px;
        }

        /* --- 输入框样式（恢复按钮） --- */
        .input-container {
          padding: 15px;
          border-top: 1px solid #eee;
          background: white;
          display: flex;
          gap: 10px;
        }
        .input-field {
          flex: 1;
          padding: 12px 15px;
          border-radius: 20px;
          border: 1px solid #ddd;
          outline: none;
          transition: 0.3s;
          font-size: 14px;
        }
        .input-field:focus { border-color: #6a8ca9; }
        
        .send-button {
          background: #6a8ca9;
          color: white;
          border: none;
          padding: 0 20px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 600;
          white-space: nowrap; /* 防止按钮文字换行 */
        }
        .send-button:disabled { 
          background: #ccc;
          opacity: 0.7; 
          cursor: not-allowed;
        }
        
        .conversation-ended {
          width: 100%;
          text-align: center;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 10px;
        }
        .fixed-code {
          font-weight: bold;
          font-size: 20px;
          color: #ff6b6b;
          margin-top: 5px;
        }
      `}</style>
    </main>
  );
}
