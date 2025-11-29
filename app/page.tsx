'use client';

// 确保正确导入React以解决JSX类型问题
import * as React from 'react';
const { useState, useRef, useEffect, useMemo } = React;

// 定义Message接口
interface Message {
  sender: 'user' | 'bot';
  content: string;
  shouldBlush?: boolean;
  showHearts?: boolean;
  isEmotional?: boolean;
}

// 导出Home组件
export default function Home(): JSX.Element {
  // 状态声明并添加类型
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', content: 'Hello! I am Arin, nice to meet you' }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [blushCount, setBlushCount] = useState<number>(0);
  const [conversationEnded, setConversationEnded] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 从localStorage恢复脸红计数和对话状态
  useEffect(() => {
    const savedBlushCount = localStorage.getItem('blushCount');
    const savedConversationEnded = localStorage.getItem('conversationEnded');
    
    if (savedBlushCount) {
      setBlushCount(parseInt(savedBlushCount, 10));
    }
    
    if (savedConversationEnded === 'true') {
      setConversationEnded(true);
    }
  }, []);
  
  // 保存脸红计数和对话状态到localStorage
  useEffect(() => {
    localStorage.setItem('blushCount', blushCount.toString());
  }, [blushCount]);
  
  useEffect(() => {
    localStorage.setItem('conversationEnded', conversationEnded.toString());
  }, [conversationEnded]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkBlush = (text: string): { shouldBlush: boolean; showHearts: boolean; isEmotional: boolean } => {
    // 首先检查是否包含波浪线
    if (text.includes('～') || text.includes('~')) {
      // 100%的概率返回true（脸红），方便查看效果
      const shouldBlush = true;
      const showHearts = true;
      const isEmotional = true;
      
      if (shouldBlush && !conversationEnded) {
        // 如果触发脸红，增加计数
        setBlushCount((prev: number) => {
          const newCount = prev + 1;
          // 检查是否达到终止条件
          if (newCount >= 10) {
            setConversationEnded(true);
            // 添加终止消息，显示固定代码MUAKC
            setMessages((prevMessages: Message[]) => [...prevMessages, { 
              sender: 'bot', 
              content: '对话已结束。感谢您的交流！\n\n固定代码: MUAKC'
            }]);
          }
          return newCount;
        });
      }
      return { shouldBlush, showHearts, isEmotional };
    }
    return { shouldBlush: false, showHearts: false, isEmotional: false };
  };

  const sendMessage = async (): Promise<void> => {
    const msg = inputValue.trim();
    if (!msg || isLoading || conversationEnded) return;

    // 添加用户消息
    setMessages((prev: Message[]) => [...prev, { sender: 'user', content: msg }]);
    setInputValue('');
    setIsLoading(true);

    // 显示typing指示器
    setMessages((prev: Message[]) => [...prev, { sender: 'bot', content: 'Typing...' }]);

    try {
      const response = await fetch('/api/chat', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: msg }),
      });

      const data = await response.json();

      // 移除typing指示器
      setMessages((prev: Message[]) => prev.filter((m: Message, i: number) => !(m.sender === 'bot' && m.content === 'Typing...' && i === prev.length - 1)));

      if (data.success) {
        const reply = data.response || 'Sorry, I cannot respond at the moment.';
        const { shouldBlush, showHearts, isEmotional } = checkBlush(reply);
        setMessages((prev: Message[]) => [...prev, { sender: 'bot', content: reply, shouldBlush, showHearts, isEmotional }]);
      } else {
        setMessages((prev: Message[]) => [...prev, { 
          sender: 'bot', 
          content: 'Connection error: Unable to reach the server. Please check your network connection and try again.' 
        }]);
      }
    } catch (error: unknown) {
      // 移除typing指示器
      setMessages((prev: Message[]) => prev.filter((m: Message, i: number) => !(m.sender === 'bot' && m.content === 'Typing...' && i === prev.length - 1)));
      
      console.error('Error sending message:', error);
      setMessages((prev: Message[]) => [...prev, { 
        sender: 'bot', 
        content: 'Connection error: Unable to reach the server. Please check your network connection and try again.' 
      }]);
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
  
  // 重置对话功能
  const resetConversation = (): void => {
    setMessages([{ sender: 'bot', content: 'Hello! I am Arin, nice to meet you' }]);
    setBlushCount(0);
    setConversationEnded(false);
    setInputValue('');
    // 清除localStorage中的数据
    localStorage.removeItem('blushCount');
    localStorage.removeItem('conversationEnded');
  };

  // 找到最新的非"Typing..."的bot消息索引
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
             {/* 进度条：爱心显示 */}
             {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} style={{ opacity: i < blushCount ? 1 : 0.2, fontSize: '16px' }}>❤️</span>
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
            // 只有最新的bot消息（非Typing）且包含～或~时才显示脸红
            const isLatestBotMessage = msg.sender === 'bot' && 
              msg.content !== 'Typing...' &&
              index === latestBotMessageIndex;
            const activeBlush = isLatestBotMessage && msg.shouldBlush;
            
            return (
              <div key={index} className={`message-wrapper ${msg.sender}-message-wrapper`}>
                {msg.sender === 'bot' && msg.content !== 'Typing...' && (
                  <div className="avatar-wrapper">
                    {/* 头像容器 */}
                    <div className="message-avatar">
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
                        <div className="bubble-heart heart-4">💓</div>
                        <div className="bubble-heart heart-5">💘</div>
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
              <button
                className="reset-button"
                onClick={resetConversation}
              >
                重新开始对话
              </button>
            </div>
          ) : (
            <React.Fragment>
              <input
                type="text"
                className="input-field"
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={isLoading}
                autoComplete="off"
                autoFocus
              />
              <button
                className="send-button"
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
              >
                →
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
          padding: 10px;
          font-family: sans-serif;
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* 响应式调整 */
        @media (max-width: 480px) {
          .main {
            padding: 5px;
          }
        }
        
        .debug-reset-btn {
          position: fixed;
          top: 10px;
          right: 10px;
          background: #ff6b6b;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          z-index: 999;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
        }
        
        .debug-reset-btn:active {
          transform: scale(0.95);
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        
        .stats-panel {
          margin-bottom: 10px;
          width: 100%;
          max-width: 420px;
        }
        
        .stat-value {
          letter-spacing: 2px;
          margin-top: 5px;
          text-align: center;
        }
        
        .chat-container {
          width: 100%;
          max-width: 420px;
          height: calc(100vh - 120px);
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        /* 响应式调整 */
        @media (max-width: 480px) {
          .chat-container {
            height: calc(100vh - 100px);
            border-radius: 12px;
          }
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
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #fff;
        }
        
        /* 响应式调整 */
        @media (max-width: 480px) {
          .messages {
            padding: 12px;
            gap: 12px;
          }
        }
        
        .message-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        
        /* 响应式调整 */
        @media (max-width: 480px) {
          .message-wrapper {
            gap: 6px;
          }
        }
        
        .user-message-wrapper { justify-content: flex-end; }
        .bot-message-wrapper { justify-content: flex-start; }
        
        /* --- 核心升级：头像与腮红 --- */
        .avatar-wrapper {
          position: relative;
        }
        
        .message-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fff; /* 确保背景是白的，图片放大多大都不怕 */
          border: 2px solid #fff;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* 图片尺寸放大至 90%，确保看起来更大 */
        .avatar-img {
          width: 90%;
          height: 90%;
          z-index: 1;
          position: relative;
          object-fit: cover; /* 确保图片不会变形 */
        }
        
        /* 腮红：优化位置和动画效果 */
        .blush-cheek {
          position: absolute;
          width: 18px;
          height: 12px;
          border-radius: 50%;
          /* 更柔和的粉色渐变，模拟真实腮红 */
          background: radial-gradient(circle, rgba(255,105,180, 0.8) 0%, rgba(255,192,203, 0) 70%);
          opacity: 0;
          z-index: 2; /* 浮在图片上面 */
          transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
          bottom: 8px; /* 优化位置 */
          filter: blur(1px); /* 增加模糊效果，更自然 */
        }
        
        .blush-left {
          left: 3px;
          transform: scale(0.9);
        }
        
        .blush-right {
          right: 3px;
          transform: scale(0.9);
        }
        
        .blush-cheek.active {
          opacity: 1;
          transform: scale(1);
          animation: blushPulse 1.5s ease-in-out infinite;
        }
        
        /* 腮红脉动动画 */
        @keyframes blushPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        
        /* --- 爱心气泡动画 --- */
        .bubble-hearts-container {
          position: absolute;
          top: -10px;
          left: 0;
          width: 100%;
          height: 60px;
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
          transform-origin: center;
        }
        
        .heart-1 { font-size: 16px; margin-left: -15px; animation-delay: 0s; }
        .heart-2 { font-size: 12px; margin-left: 10px; animation-delay: 0.4s; }
        .heart-3 { font-size: 18px; margin-left: -5px; animation-delay: 0.8s; }
        .heart-4 { font-size: 14px; margin-left: -20px; animation-delay: 0.2s; }
        .heart-5 { font-size: 10px; margin-left: 15px; animation-delay: 0.6s; }
        
        @keyframes floatBubble {
          0% {
            transform: translateY(10px) scale(0.5) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-50px) scale(1.2) rotate(360deg);
            opacity: 0;
          }
        }
        
        /* --- 消息样式 --- */
        .message {
          max-width: 75%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
          position: relative;
          word-wrap: break-word;
        }
        
        /* 响应式调整 */
        @media (max-width: 480px) {
          .message {
            max-width: 85%;
            padding: 10px 14px;
            font-size: 13px;
          }
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
        
        /* --- 输入框样式 --- */
        .input-container {
          padding: 12px 16px;
          border-top: 1px solid #eee;
          background: white;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        /* 响应式调整 */
        @media (max-width: 480px) {
          .input-container {
            padding: 10px 12px;
            gap: 6px;
          }
        }
        
        .input-field {
          flex: 1;
          padding: 14px 18px;
          border-radius: 24px;
          border: 1px solid #ddd;
          outline: none;
          transition: all 0.3s ease;
          font-size: 14px;
          background: #fafafa;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
        
        .input-field:focus {
          border-color: #6a8ca9;
          background: white;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.05), 0 0 0 3px rgba(106, 140, 169, 0.1);
        }
        
        .input-field:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* 响应式调整 */
        @media (max-width: 480px) {
          .input-field {
            padding: 12px 16px;
            font-size: 13px;
            border-radius: 22px;
          }
        }
        
        .send-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: #6a8ca9;
          color: white;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .send-button:active {
          transform: scale(0.95);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* 响应式调整 */
        @media (max-width: 480px) {
          .send-button {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }
        }
        
        .conversation-ended {
          width: 100%;
          text-align: center;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 12px;
        }
        
        .fixed-code {
          font-weight: bold;
          font-size: 20px;
          color: #ff6b6b;
          margin-top: 5px;
        }
        
        .reset-button {
          margin-top: 10px;
          padding: 10px 20px;
          border-radius: 20px;
          border: none;
          background: #6a8ca9;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .reset-button:active {
          transform: scale(0.95);
        }
      </style>
    </main>
  );
}
