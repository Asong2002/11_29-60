'use client';

import * as React from 'react';
const { useState, useRef, useEffect, useMemo } = React;

interface Message {
  sender: 'user' | 'bot';
  content: string;
  shouldBlush?: boolean; // 触发脸红
  showHearts?: boolean;  // 触发爱心特效
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
  
  // --- 状态管理逻辑 (保持不变) ---
  
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
  }, []); // 空依赖数组，只在挂载时运行一次，避免刷新立即结束的bug

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

  // --- 核心逻辑：检测波浪号并触发特效 ---
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

      // 只要检测到波浪号，这次大概率(80%)触发脸红和爱心
      const shouldShowEffects = Math.random() < 0.8;
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
        // 计算特效状态
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
      {/* 重置按钮 */}
      <button onClick={resetConversation} className="debug-reset-btn">Reset</button>

      <div className="stats-panel">
        <div className="stat-item">
          <div className="stat-label">Affection Level</div>
          <div className="stat-value">
             {/* 用爱心展示进度 */}
             {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} style={{ opacity: i < emotionalCount ? 1 : 0.2, fontSize: '16px' }}>❤️</span>
             ))}
          </div>
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
            // 只有最新的消息才会显示这种强烈特效
            const activeBlush = isLatestBot && msg.shouldBlush;
            
            return (
              <div key={index} className={`message-wrapper ${msg.sender}-message-wrapper`}>
                {msg.sender === 'bot' && msg.content !== 'Typing...' && (
                  <div className="avatar-wrapper">
                    {/* 头像容器 */}
                    <div className="message-avatar">
                      <img src="/robot-avatar.svg" alt="Arin" className="avatar-img" />
                      
                      {/* 自然的脸红遮罩：两个柔和的粉色光晕 */}
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
            <>
              <input
                type="text"
                className="input-field"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Say something nice... (Try ~)"
                disabled={isLoading}
              />
              <button className="send-button" onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
                {isLoading ? '...' : 'Send'}
              </button>
            </>
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
        
        .stats-panel { margin-bottom: 15px; }
        .stat-value { letter-spacing: 2px; margin-top: 5px; }

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
          align-items: flex-end; /* 底部对齐让气泡更自然 */
          gap: 10px;
        }
        .user-message-wrapper { justify-content: flex-end; }
        .bot-message-wrapper { justify-content: flex-start; }

        /* --- 核心升级：自然脸红头像 --- */
        .avatar-wrapper {
          position: relative;
        }

        .message-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #eee;
          border: 2px solid #fff;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          overflow: hidden; /* 确保脸红不溢出圆圈 */
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-img {
          width: 70%;
          height: 70%;
          z-index: 1; /* 图片在底层 */
          position: relative;
        }

        /* 脸红层：绝对定位在头像之上，但使用混合模式让它看起来像印在脸上 */
        .blush-cheek {
          position: absolute;
          width: 18px;
          height: 12px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,105,180, 0.6) 0%, rgba(255,192,203, 0) 70%);
          opacity: 0;
          z-index: 2;
          transition: opacity 0.8s ease-in-out; /* 缓慢过渡，更加自然 */
          bottom: 12px; /* 调整到大致脸颊的位置 */
        }

        .blush-left { left: 6px; }
        .blush-right { right: 6px; }

        /* 激活状态 */
        .blush-cheek.active {
          opacity: 1;
        }

        /* --- 核心升级：粉红爱心气泡 --- */
        .bubble-hearts-container {
          position: absolute;
          top: -10px; /* 从头像顶部开始 */
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
          /* 默认动画 */
          animation: floatBubble 2.5s ease-out forwards;
        }

        /* 给三个爱心不同的延迟和偏移，制造自然的气泡感 */
        .heart-1 {
          font-size: 16px;
          margin-left: -15px;
          animation-delay: 0s;
        }
        .heart-2 {
          font-size: 12px;
          margin-left: 10px;
          animation-delay: 0.4s;
        }
        .heart-3 {
          font-size: 18px;
          margin-left: -5px;
          animation-delay: 0.8s;
        }

        @keyframes floatBubble {
          0% {
            transform: translateY(10px) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-40px) scale(1.1); /* 向上飘 */
            opacity: 0;
          }
        }

        /* --- 消息气泡样式 --- */
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

        /* --- 输入框 --- */
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
        }
        .send-button:disabled { opacity: 0.5; }
        
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
