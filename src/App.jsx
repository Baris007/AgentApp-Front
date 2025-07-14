import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Typography, Spin, message } from 'antd';
import { marked } from 'marked';

const { TextArea } = Input;
const { Title } = Typography;

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) {
      message.warning('Lütfen bir mesaj girin.');
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('https://barisdeniz.app.n8n.cloud/webhook/turkce-saka', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      const rawText = await res.text();
      console.log('Gelen cevap:', rawText);

      let parsedContent;
      try {
        parsedContent = JSON.parse(rawText);
      } catch (err) {
        parsedContent = { response: rawText };
      }

      const aiMessage = {
        role: 'assistant',
        content: parsedContent.response || parsedContent.choices?.[0]?.message?.content || rawText,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      message.error('Bir hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderMessages = () =>
    messages.map((msg, index) => {
      const isUser = msg.role === 'user';
      return (
        <div
          key={index}
          style={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderRadius: 16,
              background: isUser ? '#1677ff' : '#e4e6eb',
              color: isUser ? '#fff' : '#000',
              maxWidth: '75%',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            {isUser ? (
              msg.content
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: marked.parse(msg.content),
                }}
              />
            )}
          </div>
        </div>
      );
    });

  return (
    <div
      style={{
        background: '#f0f2f5',
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        position: 'relative',
      }}
    >
      {/* Chat Kutusu */}
      <div
        style={{
          width: '100%',
          maxWidth: 1000,
          height: '90vh',
          background: '#ffffff',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fff',
          }}
        >
          <Title level={4} style={{ margin: 0, textAlign: 'center' }}>
            Sohbet
          </Title>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px',
            background: '#fafafa',
          }}
        >
          {renderMessages()}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
              <Spin />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div
          style={{
            padding: 16,
            borderTop: '1px solid #f0f0f0',
            background: '#fff',
          }}
        >
          <TextArea
            rows={2}
            placeholder="Mesajınızı yazın..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            style={{ borderRadius: 8, marginBottom: 8 }}
          />
          <Button
            type="primary"
            onClick={sendMessage}
            loading={loading}
            style={{ borderRadius: 8, fontWeight: 'bold' }}
            block
          >
            Gönder
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
