import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, setSending } from "../store/slices/chatSlice.js";
import { sendChatMessage } from "../api/api.js";

export default function ChatBox({ currentFields }) {
  const dispatch = useDispatch();
  const { messages, isSending } = useSelector((state) => state.chat);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isSending) return;
    dispatch(addMessage({ role: "user", content: message }));
    setInput("");
    dispatch(setSending(true));
    try {
      const { reply } = await sendChatMessage(message, currentFields);
      dispatch(addMessage({ role: "assistant", content: reply }));
    } catch (err) {
      dispatch(
        addMessage({
          role: "assistant",
          content: "Sorry, I ran into an error reaching the assistant service.",
        })
      );
    } finally {
      dispatch(setSending(false));
    }
  };

  return (
    <div className="chat-section">
      <div className="chat-heading">💬 AI Assistant</div>
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        {isSending && <div className="chat-bubble assistant">Thinking...</div>}
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Ask me anything about this complaint..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={isSending || !input.trim()}>
          ➤
        </button>
      </div>
      <div className="chat-disclaimer">AI responses may contain errors. Please verify information.</div>
    </div>
  );
}
