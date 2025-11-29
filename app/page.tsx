'use client';

// 确保正确导入React以解决JSX类型问题
import * as React from 'react';
const { useState, useRef, useEffect, useMemo } = React;

// 定义Message接口
interface Message {
  sender: 'user' | 'bot';
  content: string;
  shouldBlush?: boolean;
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

  const checkBlush = (text: string): boolean => {
    // 首先检查是否包含波浪线
    if (text.includes('～') || text.includes('~')) {
      // 60%的概率返回true（脸红）
      const shouldBlush = Math.random() < 0.6;
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
      return shouldBlush;
    }
    return false;
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
        const shouldBlush = checkBlush(reply);
        setMessages((prev: Message[]) => [...prev, { sender: 'bot', content: reply, shouldBlush }]);
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

  // 返回组件JSX，确保添加适当的类型
  return (
    <main className="main">
      <div className="chat-container">
        <div className="header">
          <div className="name">Arin</div>
        </div>
        <div className="messages">
          {messages.map((msg: Message, index: number) => {
            // 只有最新的bot消息（非Typing）且包含～或~时才显示脸红
            const isLatestBotMessage = msg.sender === 'bot' && 
              msg.content !== 'Typing...' &&
              index === latestBotMessageIndex && 
              msg.shouldBlush;
            
            return (
              <div key={index} className={`message-wrapper ${msg.sender}-message-wrapper`}>
                {msg.sender === 'bot' && msg.content !== 'Typing...' && (
                  <React.Fragment>
                    <div className={`message-avatar ${isLatestBotMessage ? 'blush' : ''}`}>
                      <img src="/robot-avatar.svg" alt="Arin" className="avatar-img" />
                    </div>
                    {isLatestBotMessage && (
                      <div className="heart-container">
                        <div className="heart heart-1"></div>
                        <div className="heart heart-2"></div>
                        <div className="heart heart-3"></div>
                        <div className="heart heart-4"></div>
                        <div className="heart heart-5"></div>
                        <div className="heart heart-6"></div>
                      </div>
                    )}
                  </React.Fragment>
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
            <button
              className="reset-button"
              onClick={resetConversation}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: '#6a8ca9',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              重新开始对话
            </button>
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
    </main>
  );
}
