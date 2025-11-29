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
  
  // 从localStorage恢复状态 - 修复初始化问题
  useEffect(() => {
    const savedEmotionalCount = localStorage.getItem('emotionalCount');
    const savedConversationEnded = localStorage.getItem('conversationEnded');
    
    // 确保从localStorage读取的值是有效的
    if (savedEmotionalCount && !isNaN(parseInt(savedEmotionalCount, 10))) {
      const count = parseInt(savedEmotionalCount, 10);
      setEmotionalCount(count);
      
      // 只有在计数达到10时才设置对话结束
      if (count >= 10) {
        setConversationEnded(true);
        // 如果对话已结束但还没有结束消息，添加一个
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
  }, [messages.length]);

  // 保存状态到localStorage
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

  const checkTildeAndBlush = (text: string): { shouldBlush: boolean; showHearts: boolean; isEmotional: boolean } => {
    const hasTilde = text.includes('～') || text.includes('~');
    let shouldBlush = false;
    let showHearts = false;
    let isEmotional = false;

    if (hasTilde && !conversationEnded) {
      isEmotional = true;
      
      // 增加情感交互计数
      setEmotionalCount((prev: number) => {
        const newCount = prev + 1;
        
        console.log(`Emotional count updated: ${prev} -> ${newCount}`);
        
        // 检查是否达到终止条件（10次情感交互）
        if (newCount >= 10) {
          console.log('Reached 10 emotional interactions, ending conversation');
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

      // 60%的概率显示脸红和爱心
      const shouldShowEffects = Math.random() < 0.6;
      shouldBlush = shouldShowEffects;
      showHearts = shouldShowEffects;
    }

    return { shouldBlush, showHearts, isEmotional };
  };

  const sendMessage = async (): Promise<void> => {
    const msg = inputValue.trim();
    if (!msg || isLoading || conversationEnded) return;

    console.log('Sending message:', msg);

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
        console.log('Bot reply:', reply);
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

  // 重置对话的调试函数（仅在开发时使用）
  const resetConversation = (): void => {
    console.log('Resetting conversation');
    setMessages([{ sender: 'bot', content: 'Hello! I am Arin, nice to meet you!' }]);
    setEmotionalCount(0);
    setConversationEnded(false);
    setInputValue('');
    localStorage.removeItem('emotionalCount');
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
      {/* 调试按钮 - 仅在开发时显示 */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={resetConversation}
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000
          }}
        >
          重置对话
        </button>
      )}

      <div className="stats-panel">
        <div className="stat-item">
          <div className="stat-label">Emotional Interactions</div>
          <div className="stat-value">{emotionalCount}/10</div>
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
                    </div>
                    {isLatestBotMessage && msg.shouldBlush && (
                      <div className="heart-container">
                        <div className="heart heart-1">❤️</div>
                        <div className="heart heart-2">💕</div>
                        <div className="heart heart-3">💗</div>
                      </div>
                    )}
                  </React.Fragment>
                )}
                <div className={`message ${msg.sender}-message`}>
                  {msg.content}
                  {isLatestBotMessage && msg.showHearts && (
                    <div className="message-hearts">
                      <span className="floating-heart">💖</span>
                      <span className="floating-heart">💕</span>
                    </div>
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
          background: white;
          padding: 10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .stats-panel {
          margin-bottom: 15px;
          width: 100%;
          max-width: 400px;
          justify-content: center;
        }

        .stat-item {
          background: #f8f9fa;
          padding: 12px 20px;
          border-radius: 10px;
          text-align: center;
          border: 1px solid #e9ecef;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #6a8ca9;
        }

        .chat-container {
          width: 100%;
          max-width: 400px;
          height: 70vh;
          min-height: 500px;
          background: white;
          border-radius: 10px;
          border: 1px solid #e0e0e0;
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
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
          flex-shrink: 0;
          border: 1px solid #f0f0f0;
        }

        .message-avatar.blush {
          animation: blush 2s ease-in-out;
        }

        .avatar-img {
          width: 24px;
          height: 24px;
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
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .user-message {
          background: #6a8ca9;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .bot-message {
          background: #f8f9fa;
          color: #333;
          border-bottom-left-radius: 4px;
          border: 1px solid #e9ecef;
        }

        .heart-container {
          position: absolute;
          top: -20px;
          left: 35px;
          pointer-events: none;
          z-index: 10;
        }

        .heart {
          position: absolute;
          opacity: 0;
          font-size: 12px;
        }

        .heart-1 { animation: floatUp 2s ease-in-out 0s infinite; }
        .heart-2 { animation: floatUp 2s ease-in-out 0.4s infinite; left: 8px; }
        .heart-3 { animation: floatUp 2s ease-in-out 0.8s infinite; left: -8px; }

        .message-hearts {
          position: absolute;
          top: -12px;
          right: 8px;
          pointer-events: none;
        }

        .floating-heart {
          position: absolute;
          font-size: 10px;
          opacity: 0;
        }

        .floating-heart:nth-child(1) { 
          animation: floatHeart 2s ease-in-out 0s infinite; 
          right: 0px;
        }
        .floating-heart:nth-child(2) { 
          animation: floatHeart 2s ease-in-out 1s infinite; 
          right: 6px;
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
          border-radius: 20px;
          outline: none;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
        }

        .input-field:focus {
          border-color: #6a8ca9;
        }

        .send-button {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          background: #6a8ca9;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .send-button:hover:not(:disabled) {
          background: #5a7c99;
        }

        .send-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .conversation-ended {
          text-align: center;
          padding: 20px;
          color: #666;
          width: 100%;
        }

        .fixed-code {
          font-size: 24px;
          font-weight: bold;
          color: #6a8ca9;
          margin: 15px 0;
          letter-spacing: 2px;
        }

        .completion-message {
          font-size: 14px;
          color: #888;
          margin-top: 10px;
        }

        /* 更自然的脸红动画 */
        @keyframes blush {
          0%, 100% { 
            background: white;
          }
          50% { 
            background: #fff5f7;
          }
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateY(-8px) scale(1);
          }
          80% {
            opacity: 0.7;
            transform: translateY(-25px) scale(1.1);
          }
          100% {
            transform: translateY(-35px) scale(1.2);
            opacity: 0;
          }
        }

        @keyframes floatHeart {
          0%, 100% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          30% {
            opacity: 1;
            transform: translateY(-6px) scale(1);
          }
          70% {
            opacity: 0.5;
            transform: translateY(-15px) scale(0.8);
          }
        }

        /* 移动端响应式设计 */
        @media (max-width: 480px) {
          .main {
            padding: 5px;
            height: 100vh;
          }

          .stats-panel {
            margin-bottom: 10px;
          }

          .stat-item {
            padding: 10px 15px;
          }

          .chat-container {
            height: calc(100vh - 120px);
            min-height: auto;
          }

          .messages {
            padding: 10px;
            gap: 10px;
          }

          .message {
            max-width: 85%;
            font-size: 14px;
          }

          .message-avatar {
            width: 35px;
            height: 35px;
          }

          .input-container {
            padding: 12px;
          }

          .input-field {
            font-size: 16px;
          }

          .send-button {
            width: 44px;
            height: 44px;
          }
        }

        /* 文本换行优化 */
        @media (max-width: 360px) {
          .message {
            max-width: 80%;
            font-size: 13px;
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
