'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, X, Sparkles } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialName: string;
  initialRole: string;
  initialSignature?: string;
  signerType: 'approver' | 'creator';
  onSave: (signatureDataUrl: string, name: string, role: string) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  title,
  initialName,
  initialRole,
  initialSignature,
  signerType,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState(initialRole);
  const [hasContent, setHasContent] = useState(Boolean(initialSignature));

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setRole(initialRole);
      // Wait for canvas to mount
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // If existing signature exists, draw it
        if (initialSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasContent(true);
          };
          img.src = initialSignature;
        } else if (signerType === 'creator') {
          drawDefaultHasianParaf(ctx, canvas.width, canvas.height);
          setHasContent(true);
        } else {
          drawDefaultAsmanParaf(ctx, canvas.width, canvas.height);
          setHasContent(true);
        }
      }, 50);
    }
  }, [isOpen, initialName, initialRole, initialSignature, signerType]);

  // Gambar Paraf Otentik Hasian Sitorus (Sesuai Screenshot Excel User)
  const drawDefaultHasianParaf = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.strokeStyle = '#003366'; // Biru tinta pulpen resmi
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Stroke 1: Loop kiri melengkung tinggi ke atas lalu turun panjang
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.58);
    ctx.bezierCurveTo(w * 0.28, h * 0.45, w * 0.38, h * 0.22, w * 0.42, h * 0.12);
    ctx.bezierCurveTo(w * 0.44, h * 0.05, w * 0.40, h * 0.08, w * 0.37, h * 0.22);
    ctx.bezierCurveTo(w * 0.33, h * 0.45, w * 0.30, h * 0.75, w * 0.25, h * 0.94);
    ctx.stroke();

    // Stroke 2: Tarikan tengah naik ke loop kedua dan gelombang vertikal Hasian
    ctx.beginPath();
    ctx.moveTo(w * 0.27, h * 0.65);
    ctx.bezierCurveTo(w * 0.32, h * 0.42, w * 0.40, h * 0.35, w * 0.46, h * 0.36);
    ctx.bezierCurveTo(w * 0.50, h * 0.38, w * 0.48, h * 0.55, w * 0.49, h * 0.68);
    ctx.stroke();

    // Stroke 3: Gelombang vertikal tinggi tengah
    ctx.beginPath();
    ctx.moveTo(w * 0.49, h * 0.68);
    ctx.bezierCurveTo(w * 0.52, h * 0.25, w * 0.58, h * 0.18, w * 0.62, h * 0.28);
    ctx.bezierCurveTo(w * 0.64, h * 0.35, w * 0.62, h * 0.62, w * 0.63, h * 0.72);
    ctx.stroke();

    // Stroke 4: Gelombang kanan ketiga dan ekor panjang turun
    ctx.beginPath();
    ctx.moveTo(w * 0.63, h * 0.72);
    ctx.bezierCurveTo(w * 0.66, h * 0.42, w * 0.72, h * 0.40, w * 0.75, h * 0.50);
    ctx.bezierCurveTo(w * 0.77, h * 0.60, w * 0.78, h * 0.75, w * 0.82, h * 0.88);
    ctx.stroke();

    // Stroke 5: Garis potong melintang dan titik paraf
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.52);
    ctx.lineTo(w * 0.72, h * 0.50);
    ctx.stroke();

    ctx.restore();
  };

  // Gambar Paraf Asman Konstruksi (Wegig Didik Kurniawan)
  const drawDefaultAsmanParaf = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.strokeStyle = '#003366';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Inisial W & D mengalir khas pejabat PLN
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.4);
    ctx.bezierCurveTo(w * 0.25, h * 0.7, w * 0.3, h * 0.75, w * 0.35, h * 0.3);
    ctx.bezierCurveTo(w * 0.4, h * 0.65, w * 0.45, h * 0.7, w * 0.5, h * 0.25);
    ctx.bezierCurveTo(w * 0.55, h * 0.4, w * 0.65, h * 0.2, w * 0.75, h * 0.45);
    ctx.bezierCurveTo(w * 0.8, h * 0.6, w * 0.7, h * 0.75, w * 0.55, h * 0.7);
    ctx.stroke();

    // Garis tegas bawah penutup paraf
    ctx.beginPath();
    ctx.moveTo(w * 0.25, h * 0.8);
    ctx.lineTo(w * 0.78, h * 0.78);
    ctx.stroke();

    ctx.restore();
  };

  // Handlers canvas drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#003366';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  };

  const handleApplyPreset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (signerType === 'creator') {
      drawDefaultHasianParaf(ctx, canvas.width, canvas.height);
    } else {
      drawDefaultAsmanParaf(ctx, canvas.width, canvas.height);
    }
    setHasContent(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl, name.trim(), role.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-300 font-sans text-slate-800 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Identitas Penandatangan */}
          <div className="space-y-2">
            <div>
              <label className="block font-bold text-slate-700 text-[11px] mb-1">
                Nama Lengkap Pejabat:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: HASIAN EFRAVODITUS SITORUS"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 text-[11px] mb-1">
                Jabatan / Bagian:
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Contoh: TC LOLA KONS"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Canvas Tanda Tangan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-700 text-[11px]">
                Gores Tanda Tangan Digital:
              </span>
              <button
                type="button"
                onClick={handleApplyPreset}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Gunakan Paraf Resmi Standar
              </button>
            </div>

            <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-slate-50 relative group">
              <canvas
                ref={canvasRef}
                width={380}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 bg-white cursor-crosshair touch-none"
              />
              <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 select-none pointer-events-none">
                Goreskan tanda tangan menggunakan mouse / touchscreen
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="px-3 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-1.5 transition text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Bersihkan
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition text-xs shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Terapkan Tanda Tangan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
