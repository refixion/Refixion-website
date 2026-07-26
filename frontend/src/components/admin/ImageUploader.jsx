import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { api, formatApiErrorDetail } from "../../lib/api";

/**
 * Shopify/Stripe-achtige image uploader.
 *
 * Props:
 * - value: string[] -- huidige lijst van publieke afbeelding-URL's (bron van waarheid)
 * - onChange: (urls: string[]) => void
 *
 * De eerste URL in `value` is altijd de hoofdfoto -- reorder door slepen bepaalt dit.
 */
export default function ImageUploader({ value = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const inputRef = useRef(null);

  const openPicker = () => inputRef.current?.click();

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const res = await api.post("/upload/product-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange([...value, ...res.data.urls]);
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || "Uploaden mislukt. Probeer het opnieuw.");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    uploadFiles(e.target.files);
    e.target.value = ""; // zelfde bestand nogmaals kunnen kiezen
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const removeAt = (idx) => onChange(value.filter((_, i) => i !== idx));

  // Herordenen via native HTML5 drag & drop van de thumbnails onderling.
  const handleThumbDragStart = (idx) => (e) => {
    dragIndexRef.current = idx;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleThumbDragOver = (idx) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(idx);
  };
  const handleThumbDrop = (idx) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const from = dragIndexRef.current;
    setDragOverIndex(null);
    dragIndexRef.current = null;
    if (from === null || from === idx) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    onChange(next);
  };

  return (
    <div>
      <div
        onClick={openPicker}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingFiles(true); }}
        onDragLeave={() => setIsDraggingFiles(false)}
        onDrop={handleDrop}
        data-testid="image-uploader-dropzone"
        className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          isDraggingFiles ? "border-[#111111] bg-[#FAFAFA]" : "border-[#EAEAEA] hover:border-[#CCCCCC]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="h-6 w-6 text-[#111111] animate-spin" strokeWidth={1.5} />
            <div className="text-[13px] text-[#666666]">Bezig met uploaden...</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <ImagePlus className="h-6 w-6 text-[#999999]" strokeWidth={1.5} />
            <div className="text-[13px] text-[#111111] font-medium">
              Sleep afbeeldingen hierheen, of klik om te kiezen
            </div>
            <div className="text-[12px] text-[#999999]">JPEG, PNG, WEBP of HEIC · max 8MB per foto</div>
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {value.map((url, i) => (
            <div
              key={url + i}
              draggable
              onDragStart={handleThumbDragStart(i)}
              onDragOver={handleThumbDragOver(i)}
              onDrop={handleThumbDrop(i)}
              onDragEnd={() => setDragOverIndex(null)}
              data-testid={`image-uploader-thumb-${i}`}
              className={`relative h-24 w-24 rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing group ${
                dragOverIndex === i ? "border-[#111111] ring-2 ring-[#111111]/20" : "border-[#EAEAEA]"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />

              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-[#111111]/85 text-white text-[10px] text-center py-0.5">
                  Hoofdfoto
                </span>
              )}

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAt(i); }}
                aria-label="Afbeelding verwijderen"
                className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length > 1 && (
        <p className="mt-2 text-[11px] text-[#999999]">Sleep om te herschikken -- de eerste foto wordt de hoofdfoto.</p>
      )}
    </div>
  );
}
