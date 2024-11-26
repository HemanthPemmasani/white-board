import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000"); // Replace with your server URL

const Chatbox = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");

  // Listen for incoming messages from other users or the sender
  useEffect(() => {
    // Listen for the 'message' event from the server
    socket.on("message", (message) => {
      setChatMessages((prevMessages) => [
        ...prevMessages,
        `${message.username}: ${message.message}`, // Combine the username and message
      ]);
    });

    // Clean up when the component unmounts
    return () => {
      socket.off("message");
    };
  }, []);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      // Emit the message to the server
      socket.emit("send-message", currentMessage);
      setCurrentMessage(""); // Clear the input after sending
    }
  };

  return (
    <div
      style={{
        width: "300px",
        minHeight: "400px",
        borderLeft: "2px solid #ccc",
        backgroundColor: "#f9f9f9",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          fontSize: "18px",
          color: "#333",
          marginBottom: "10px",
          borderBottom: "2px solid #ccc",
          paddingBottom: "5px",
        }}
      >
        Chat
      </h3>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "10px",
          padding: "5px",
          backgroundColor: "#fff",
          borderRadius: "5px",
          boxShadow: "inset 0 0 5px rgba(0, 0, 0, 0.1)",
          maxHeight: "300px",
        }}
      >
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: "10px",
              padding: "8px",
              backgroundColor: "#e0e0e0",
              borderRadius: "10px",
              fontSize: "14px",
              wordWrap: "break-word",
            }}
          >
            {msg}
          </div>
        ))}
      </div>
      <form onSubmit={handleChatSubmit} style={{ display: "flex", marginTop: "10px" }}>
        <input
          type="text"
          placeholder="Type a message..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          style={{
            flex: 1,
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            marginRight: "10px",
            fontSize: "14px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 15px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbox;
