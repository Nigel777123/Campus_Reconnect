import React from "react";
import { useState, useRef } from "react";
import { Upload, X, Image } from "lucide-react";

interface Props {
  value: string;
  onChange: (dataUrl: string) => void;
}

export default function ImageUpload({ value, onChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div>
      {value ? (
        <div style={{ position: "relative", borderRadius: "0.75rem", overflow: "hidden" }}>
          <img
            src={value}
            alt="Preview"
            style={{ width: "100%", maxHeight: "240px", objectFit: "cover", display: "block" }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            style={{
              position: "absolute", top: "0.5rem", right: "0.5rem",
              background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
              width: "28px", height: "28px", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "white"
            }}
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              position: "absolute", bottom: "0.5rem", right: "0.5rem",
              background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "0.5rem",
              padding: "0.3rem 0.6rem", cursor: "pointer", color: "white",
              fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem"
            }}
          >
            <Upload size={12} /> Change
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? "rgba(97,117,247,0.6)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "0.75rem",
            padding: "2rem",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "rgba(97,117,247,0.06)" : "rgba(255,255,255,0.02)",
            transition: "all 0.15s"
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem", opacity: 0.5 }}>
            <Image size={32} style={{ margin: "0 auto", color: "#6175f7" }} />
          </div>
          <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Click to upload or drag & drop
          </div>
          <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.25rem" }}>
            PNG, JPG, WEBP up to 5MB
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
      />
    </div>
  );
}
