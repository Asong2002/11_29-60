'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

interface Message {
  sender: 'user' | 'bot';
  content: string;
  shouldBlush?: boolean;
  showHearts?: boolean;
  isEmotional?: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', content: 'Hello! I am Arin, nice to meet you!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emotionalCount, setEmotionalCount] = useState(0);
  const [conversationEnded, setConversationEnded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // --- 1. 初始化状态 (只在组件挂载时执行一次) ---
  useEffect(() => {
    const savedEmotionalCount = localStorage.getItem('emotionalCount');
    const savedConversationEnded = localStorage.getItem('conversationEnded');
    
    if (savedEmotionalCount && !isNaN(parseInt(savedEmotionalCount, 10))) {
      const count = parseInt(savedEmotionalCount, 10);
      setEmotionalCount(count);
      
      // 如果读取到已结束，且当前只有初始消息，才添加结束语
      if (count >= 10) {
        setConversationEnded(true);
        // 这里我们不直接操作 messages，避免 hydration 问题，
        // 而是依赖下一次渲染或用户交互来处理
      }
    }
    
    if (savedConversationEnded === 'true') {
      setConversationEnded(true);
    }
  }, []); 

  // --- 2. 持久化状态 ---
  useEffect(() => {
    localStorage.setItem('emotionalCount', emotionalCount.toString());
    localStorage.setItem('conversationEnded', conversationEnded.toString());
  }, [emotionalCount, conversationEnded]);

  // --- 3. 自动滚动 ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- 核心逻辑：检测波浪号 ---
  const checkTildeAndBlush = (text: string) => {
    const hasTilde = text.includes('～') || text.includes('~');
    let shouldBlush = false;
    let showHearts = false;
    let isEmotional = false;

    if (hasTilde && !conversationEnded) {
      isEmotional = true;
      
      setEmotionalCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 10) {
          setConversationEnded(true);
          // 延迟添加结束语
          setTimeout(() => {
            setMessages(prevMessages => [...prevMessages, { 
              sender: 'bot', 
              content: 'Conversation ended. Thank you for chatting with me!\n\nFixed Code: MUAKC' 
            }]);
          }, 1000);
        }
        return newCount;
      });

      // 设置为 100% 触发，方便你测试
      shouldBlush = true;
      showHearts = true;
    }

    return { shouldBlush, showHearts, isEmotional };
  };

  const sendMessage = async () => {
    const msg = inputValue.trim();
    if (!msg || isLoading || conversationEnded) return;

    setMessages(prev => [...prev, { sender: 'user', content: msg }]);
    setInputValue('');
    setIsLoading(true);
    setMessages(prev => [...prev, { sender: 'bot', content: 'Typing...' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });

      const data = await response.json();

      setMessages(prev => prev.filter(m => m.content !== 'Typing...'));

      if (data.success) {
        const reply = data.response || 'Sorry, I cannot respond at the moment.';
        const effects = checkTildeAndBlush(reply);
        
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          content: reply, 
          ...effects
        }]);
        
      } else {
        setMessages(prev => [...prev, { sender: 'bot', content: 'Connection error.' }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.filter(m => m.content !== 'Typing...'));
      setMessages(prev => [...prev, { sender: 'bot', content: 'Connection error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !conversationEnded) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetConversation = () => {
    setMessages([{ sender: 'bot', content: 'Hello! I am Arin, nice to meet you!' }]);
    setEmotionalCount(0);
    setConversationEnded(false);
    setInputValue('');
    localStorage.removeItem('emotionalCount');
    localStorage.removeItem('conversationEnded');
  };

  // 记忆计算：哪一条是最后一条机器人消息（用于显示头像特效）
  const latestBotMessageIndex = useMemo(() => {
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
          {/* 这里是你要求的标题 */}
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
          {messages.map((msg, index) => {
            const isLatestBot = msg.sender === 'bot' && msg.content !== 'Typing...' && index === latestBotMessageIndex;
            const activeBlush = isLatestBot && msg.shouldBlush;
            
            return (
              <div key={index} className={`message-wrapper ${msg.sender}-message-wrapper`}>
                {msg.sender === 'bot' && msg.content !== 'Typing...' && (
                  <div className="avatar-wrapper">
                    <div className="message-avatar">
                      {/* 头像图片 */}
                      <img src="/robot-avatar.svg" alt="Arin" className="avatar-img" />
                      
                      {/* 腮红叠加层 */}
                      <div className={`blush-cheek blush-left ${activeBlush ? 'active' : ''}`} />
                      <div className={`blush-cheek blush-right ${activeBlush ? 'active' : ''}`} />
                    </div>

                    {/* 爱心气泡 */}
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
              <button 
                className="send-button" 
                onClick={sendMessage} 
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </React.Fragment>
          )}
        </div>
      </div>

      <style jsx>{`
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

        .avatar-wrapper { position: relative; }

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

        /* 腮红特效 */
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
        .blush-cheek.active { opacity: 1; }

        /* 爱心气泡特效 */
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
          white-space: nowrap;
        }
        .send-button:disabled { opacity: 0.5; cursor: not-allowed; }
        
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
