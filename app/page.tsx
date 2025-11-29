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
  const [tildeCount, setTildeCount] = useState<number>(0);
  const [emotionalCount, setEmotionalCount] = useState<number>(0);
  const [conversationEnded, setConversationEnded] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 从localStorage恢复状态
  useEffect(() => {
    const savedTildeCount = localStorage.getItem('tildeCount');
    const savedEmotionalCount = localStorage.getItem('emotionalCount');
    const savedConversationEnded = localStorage.getItem('conversationEnded');
    
    if (savedTildeCount) setTildeCount(parseInt(savedTildeCount, 10));
    if (savedEmotionalCount) setEmotionalCount(parseInt(savedEmotionalCount, 10));
    if (savedConversationEnded === 'true') setConversationEnded(true);
  }, []);
  
  // 保存状态到localStorage
  useEffect(() => {
    localStorage.setItem('tildeCount', tildeCount.toString());
    localStorage.setItem('emotionalCount', emotionalCount.toString());
    localStorage.setItem('conversationEnded', conversationEnded.toString());
  }, [tildeCount, emotionalCount, conversationEnded]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkTildeAndBlush = (text: string): { shouldBlush: boolean; showHearts: boolean; isEmotional: boolean } => {
    const hasTilde = text.includes('～') || text.includes('~');
    let shouldBlush = false;
    let showHearts = false;
    let isEmotional = false;

    if (hasTilde && !conversationEnded) {
      isEmotional = true;
      
      // 增加波浪线计数
      setTildeCount((prev: number) => {
        const newCount = prev + 1;
        
        // 检查是否达到终止条件（10次波浪线回复）
        if (newCount >= 10) {
          setConversationEnded(true);
          // 添加终止消息和固定代码
          setTimeout(() => {
            setMessages((prevMessages: Message[]) => [...prevMessages, { 
              sender: 'bot', 
              content: 'Conversation ended. Thank you for chatting with me!\n\nFixed Code: MUAKC' 
            }]);
          }, 1000);
        }
        return newCount;
      });

      // 增加情感交互计数
      setEmotionalCount((prev: number) => prev + 1);

      // 80%的概率显示脸红和爱心（移动端更明显）
      const shouldShowEffects = Math.random() < 0.8;
      shouldBlush = shouldShowEffects;
      showHearts = shouldShowEffects;
    }

    return { shouldBlush, showHearts, isEmotional };
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
        const { shouldBlush, showHearts, isEmotional } = checkTildeAndBlush(reply);
        setMessages((prev: Message[]) => [...prev, { 
          sender: 'bot', 
          content: reply, 
          shouldBlush,
          showHearts,
          isEmotional
        }]);
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
      <div className="stats-panel">
        <div className="stat-item">
          <div className="stat-label">Tilde Replies</div>
          <div className="stat-value">{tildeCount}/10</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Emotional Interactions</div>
          <div className="stat-value emotional-count">{emotionalCount}</div>
        </div>
      </div>

      <div className="chat-container">
        <div className="header">
          <div className="name">Arin</div>
          <div className="status">AI Assistant</div>
        </div>
        <div className="messages">
          {messages.map((msg: Message, index: number) => {
            const isLatestBotMessage = msg.sender === 'bot' && 
              msg.content !== 'Typing...' &&
              index === latestBotMessageIndex;
            
            return (
              <div key={index} className={`message-wrapper ${msg.sender}-message-wrapper`}>
                {msg.sender === 'bot' && msg.content !== 'Typing...' && (
                  <React.Fragment>
                    <div className={`message-avatar ${isLatestBotMessage && msg.shouldBlush ? 'blush' : ''}`}>
                      <img src="/robot-avatar.svg" alt="Arin" className="avatar-img" />
                      {isLatestBotMessage && msg.shouldBlush && (
                        <div className="blush-overlay"></div>
                      )}
                    </div>
                    {isLatestBotMessage && msg.shouldBlush && (
                      <div className="heart-container">
                        <div className="heart heart-1">💖</div>
                        <div className="heart heart-2">💕</div>
                        <div className="heart heart-3">💗</div>
                        <div className="heart heart-4">💓</div>
                        <div className="heart heart-5">💞</div>
                      </div>
                    )}
                  </React.Fragment>
                )}
                <div className={`message ${msg.sender}-message ${msg.isEmotional ? 'emotional' : ''}`}>
                  {msg.content}
                  {isLatestBotMessage && msg.showHearts && (
                    <div className="message-hearts">
                      <span className="floating-heart">💖</span>
                      <span className="floating-heart">💕</span>
                      <span className="floating-heart">💗</span>
                      <span className="floating-heart">💓</span>
                      <span className="floating-heart">💞</span>
                    </div>
                  )}
                  {msg.isEmotional && (
                    <div className="emotional-badge">Emotional</div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="input-container">
          {conversationEnded ? (
            <div className="conversation-ended">
              <p>🎉 Conversation completed!</p>
              <p className="fixed-code">MUAKC</p>
              <p className="completion-message">Thank you for participating!</p>
            </div>
          ) : (
            <React.Fragment>
              <input
                type="text"
                className="input-field"
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                className="send-button"
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? '...' : '→'}
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
        }

        .stats-panel {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          width: 100%;
          max-width: 400px;
          justify-content: center;
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.95);
          padding: 10px 15px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          min-width: 120px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #6a8ca9;
        }

        .emotional-count {
          color: #ff6b9d;
          animation: pulse 2s ease-in-out infinite;
        }

        .chat-container {
          width: 100%;
          max-width: 400px;
          height: 70vh;
          min-height: 500px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .header {
          background: #6a8ca9;
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .name {
          font-size: 18px;
          font-weight: bold;
        }

        .status {
          font-size: 12px;
          opacity: 0.8;
        }

        .messages {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .user-message-wrapper {
          justify-content: flex-end;
        }

        .bot-message-wrapper {
          justify-content: flex-start;
        }

        .message-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.5s ease;
          position: relative;
          flex-shrink: 0;
        }

        .message-avatar.blush {
          animation: blush 3s ease-in-out;
        }

        .blush-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 30%, #ffb6c1 0%, transparent 70%);
          border-radius: 50%;
          animation: blushGlow 2s ease-in-out infinite;
        }

        .avatar-img {
          width: 28px;
          height: 28px;
          z-index: 1;
          position: relative;
        }

        .message {
          max-width: 75%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          position: relative;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .user-message {
          background: #6a8ca9;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .bot-message {
          background: #f0f0f0;
          color: #333;
          border-bottom-left-radius: 4px;
        }

        .bot-message.emotional {
          background: #fff0f5;
          border: 1px solid #ffd1dc;
          animation: emotionalGlow 2s ease-in-out;
        }

        .emotional-badge {
          position: absolute;
          top: -8px;
          right: 10px;
          background: #ff6b9d;
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
        }

        .heart-container {
          position: absolute;
          top: -30px;
          left: 40px;
          pointer-events: none;
          z-index: 10;
        }

        .heart {
          position: absolute;
          opacity: 0;
          font-size: 16px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .heart-1 { animation: floatUp 3s ease-in-out 0s infinite; }
        .heart-2 { animation: floatUp 3s ease-in-out 0.5s infinite; left: 15px; }
        .heart-3 { animation: floatUp 3s ease-in-out 1s infinite; left: -10px; }
        .heart-4 { animation: floatUp 3s ease-in-out 1.5s infinite; left: 25px; }
        .heart-5 { animation: floatUp 3s ease-in-out 2s infinite; left: -5px; }

        .message-hearts {
          position: absolute;
          top: -20px;
          right: 10px;
          pointer-events: none;
        }

        .floating-heart {
          position: absolute;
          font-size: 14px;
          opacity: 0;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .floating-heart:nth-child(1) { 
          animation: floatHeart 3s ease-in-out 0s infinite; 
          right: 0px;
        }
        .floating-heart:nth-child(2) { 
          animation: floatHeart 3s ease-in-out 0.6s infinite; 
          right: 12px;
        }
        .floating-heart:nth-child(3) { 
          animation: floatHeart 3s ease-in-out 1.2s infinite; 
          right: 6px;
        }
        .floating-heart:nth-child(4) { 
          animation: floatHeart 3s ease-in-out 1.8s infinite; 
          right: 18px;
        }
        .floating-heart:nth-child(5) { 
          animation: floatHeart 3s ease-in-out 2.4s infinite; 
          right: 3px;
        }

        .input-container {
          padding: 15px;
          background: #f8f9fa;
          border-top: 1px solid #e9ecef;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .input-field {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 25px;
          outline: none;
          font-size: 16px; /* 移动端更好的输入体验 */
          transition: all 0.3s ease;
          min-height: 20px;
        }

        .input-field:focus {
          border-color: #6a8ca9;
          transform: scale(1.02);
        }

        .send-button {
          width: 45px;
          height: 45px;
          border: none;
          border-radius: 50%;
          background: #6a8ca9;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .send-button:hover:not(:disabled) {
          background: #5a7c99;
          transform: scale(1.1);
        }

        .send-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }

        .conversation-ended {
          text-align: center;
          padding: 20px;
          color: #666;
          width: 100%;
        }

        .fixed-code {
          font-size: 28px;
          font-weight: bold;
          color: #6a8ca9;
          margin: 15px 0;
          letter-spacing: 3px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .completion-message {
          font-size: 14px;
          color: #888;
          margin-top: 10px;
        }

        /* 移动端优化的动画 */
        @keyframes blush {
          0%, 100% { 
            background: #f0f0f0; 
            transform: scale(1);
          }
          25% { 
            background: #ffb6c1; 
            transform: scale(1.2);
          }
          50% { 
            background: #ff91a4; 
            transform: scale(1.15);
          }
          75% { 
            background: #ffb6c1; 
            transform: scale(1.2);
          }
        }

        @keyframes blushGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }

        @keyframes emotionalGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(255, 182, 193, 0); }
          50% { box-shadow: 0 0 20px rgba(255, 182, 193, 0.5); }
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateY(-10px) scale(1) rotate(10deg);
          }
          80% {
            opacity: 0.8;
            transform: translateY(-40px) scale(1.2) rotate(-5deg);
          }
          100% {
            transform: translateY(-60px) scale(1.5) rotate(0deg);
            opacity: 0;
          }
        }

        @keyframes floatHeart {
          0%, 100% {
            transform: translateY(0) scale(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateY(-8px) scale(1.2) rotate(15deg);
          }
          80% {
            opacity: 0.6;
            transform: translateY(-25px) scale(0.8) rotate(-10deg);
          }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* 移动端响应式设计 */
        @media (max-width: 480px) {
          .main {
            padding: 5px;
            height: 100vh;
          }

          .stats-panel {
            flex-direction: column;
            gap: 8px;
            margin-bottom: 10px;
          }

          .stat-item {
            min-width: auto;
            padding: 8px 12px;
          }

          .chat-container {
            height: calc(100vh - 150px);
            min-height: auto;
            border-radius: 15px;
          }

          .messages {
            padding: 10px;
            gap: 10px;
          }

          .message {
            max-width: 85%;
            font-size: 16px; /* 移动端更大的字体 */
          }

          .message-avatar {
            width: 40px;
            height: 40px;
          }

          .heart {
            font-size: 18px; /* 移动端更大的爱心 */
          }

          .input-container {
            padding: 12px;
          }

          .input-field {
            font-size: 16px;
            padding: 14px 16px;
          }

          .send-button {
            width: 50px;
            height: 50px;
            font-size: 20px;
          }
        }

        /* 防止移动端点击高亮 */
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </main>
  );
}
