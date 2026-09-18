import { useRef, useState } from "react";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".eml"];

export default function FileDropzone({ onFile, disabled }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList) => {
    const file = fileList?.[0];
    if (!file || disabled) return;
    onFile(file);
  };

  return (
    <div
      className={`dropzone${isDragging ? " dragging" : ""}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
    >
      <div className="dropzone-icon">⬆</div>
      <strong>Drag &amp; drop complaint document here</strong>
      <span>
        or{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            !disabled && inputRef.current?.click();
          }}
        >
          click to browse
        </a>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
