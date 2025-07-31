import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Typography, Spin, message } from 'antd';
import { marked } from 'marked';
import * as signalR from "@microsoft/signalr";


const { TextArea } = Input;
const { Title } = Typography;

const getSessionId = () => {
  let sid = localStorage.getItem('chatSessionId');
  if (!sid) {
    sid = Math.random().toString(36).substr(2, 10);
    localStorage.setItem('chatSessionId', sid);
  }
  return sid;
};

function ButtonStatusWidget() {
  const [status, setStatus] = useState("BOS");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7152/buttonHub", {
        withCredentials: true 
    })
      .withAutomaticReconnect()
      .build();

    connection.on("ButtonStatusChanged", (newStatus) => {
      setStatus(newStatus);
    });

    connection.start()
      .then(() => setConnected(true))
      .catch((err) => {
        setConnected(false);
        console.error("SignalR bağlantı hatası:", err);
      });

    return () => {
      connection.stop();
    };
  }, []);

  return (
    <div style={{
      background: "#23272F",
      color: "#fff",
      borderRadius: 16,
      padding: "20px 30px",
      minWidth: 170,
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      marginLeft: 24,
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <b style={{ fontSize: 17 }}>Buton Durumu</b>
      <div style={{
        marginTop: 14,
        fontSize: 22,
        fontWeight: "bold",
        color: status === "BASILI" ? "#52c41a" : "#e74c3c"
      }}>
        {status}
      </div>
      <span style={{ fontSize: 12, marginTop: 8 }}>
        {connected ? "Canlı bağlantı ✓" : "Bağlantı yok"}
      </span>
    </div>
  );
}


function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const sessionId = useRef(getSessionId());

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
      
      const res = await fetch('https://localhost:7152/Chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.current, message: input }),
      });

      
      let parsedContent;
      let aiContent = '';

      
      if (!res.ok) {
        aiContent = `API Hatası: ${res.status}`;
      } else {
        try {
          parsedContent = await res.json();
          aiContent = parsedContent.response || parsedContent.message || JSON.stringify(parsedContent);
        } catch (err) {
          const rawText = await res.text();
          aiContent = rawText;
        }
      }

      const aiMessage = {
        role: 'assistant',
        content: aiContent,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      message.error('Bir hata oluştu.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sunucuya ulaşılamıyor veya bir hata oluştu.' }
      ]);
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
      {/* Yan yana kutular: Chat ve Buton */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", width: "100%", maxWidth: 1200 }}>
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
        {}
        <ButtonStatusWidget />
      </div>
    </div>
  );
}

export default App;
