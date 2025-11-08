import React, { useState } from "react";
import apiService from "../services/apiService";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configuration PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function GeminiAssistant() {
  const [input, setInput] = useState("");
  const [fileText, setFileText] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setResponse("📂 Lecture du fichier...");
    const extension = file.name.split(".").pop().toLowerCase();

    try {
      if (extension === "pdf") {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((it) => it.str).join(" ") + "\n";
        }
        setFileText(text);
        setResponse("✅ Fichier PDF chargé et prêt à être analysé !");
      } else if (extension === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setFileText(result.value);
        setResponse("✅ Fichier DOCX chargé et prêt !");
      } else if (extension === "txt") {
        const text = await file.text();
        setFileText(text);
        setResponse("✅ Fichier texte prêt !");
      } else {
        setResponse("❌ Format non pris en charge (PDF, DOCX, TXT uniquement).");
      }
    } catch (err) {
      setResponse("❌ Erreur lors de la lecture du fichier : " + err.message);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !fileText.trim()) {
      setResponse("⚠️ Saisis une question ou charge un fichier à résumer.");
      return;
    }
    setLoading(true);
    setResponse("⏳ Analyse en cours...");

    try {
      const sessionId = `gemini-session-${Date.now()}`;
      const result = await apiService.sendGeminiMessage(sessionId, input, fileText);
      setResponse(result.response);
    } catch (err) {
      setResponse("❌ Erreur API : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: 30,
        maxWidth: 800,
        margin: "auto",
      }}
    >
      <h2>🤖 Assistant IA Entreprise – Gemini 1.5 Flash</h2>

      <input
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileUpload}
        style={{
          marginBottom: 10,
          padding: 6,
          border: "1px solid #ccc",
          borderRadius: 6,
        }}
      />

      <textarea
        rows="4"
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 6,
          border: "1px solid #ccc",
          marginBottom: 10,
        }}
        placeholder="Pose une question ou laisse vide pour résumer le fichier..."
        value={input}
        onChange={(e) => setInput(e.g.value)}
      />

      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          background: "#007bff",
          color: "#fff",
          border: "none",
          padding: "10px 20px",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {loading ? "Analyse..." : "Envoyer"}
      </button>

      <div
        style={{
          marginTop: 20,
          whiteSpace: "pre-wrap",
          background: "#f8f8f8",
          padding: 20,
          borderRadius: 8,
          border: "1px solid #ddd",
          minHeight: 120,
        }}
      >
        {response}
      </div>
    </div>
  );
}
