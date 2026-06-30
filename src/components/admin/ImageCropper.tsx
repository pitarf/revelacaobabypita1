import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Crop as CropIcon } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageCropperProps {
  onCropComplete: (base64Webp: string) => void;
  onCancel: () => void;
  aspect?: number;
}

export default function ImageCropper({ onCropComplete, onCancel, aspect }: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl as string);
    }
  };

  const readFile = (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const onCropCompleteHandler = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (imageSrc && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative flex flex-col h-[80vh] md:h-auto">
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <CropIcon className="h-5 w-5 text-slate-500" />
            Recortar Imagem
          </h3>
          <button onClick={onCancel} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {!imageSrc ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50 text-center relative min-h-[300px]">
            <Upload className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-xs font-bold text-slate-500 mb-1">Selecione a imagem</p>
            <p className="text-[10px] text-slate-400 mb-4">A imagem será recortada {aspect ? (aspect === 1 ? '1:1' : 'no formato indicado') : 'livremente'} e otimizada (WebP)</p>
            <label className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer hover:bg-black transition-all">
              Escolher Arquivo
              <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </label>
          </div>
        ) : (
          <>
            <div className="relative flex-1 min-h-[300px] w-full bg-black rounded-2xl overflow-hidden mb-4">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropCompleteHandler}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => {
                  setZoom(Number(e.target.value))
                }}
                className="w-full accent-slate-900"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-slate-900 text-white text-xs font-black py-3 rounded-xl hover:bg-black transition-all"
            >
              Aplicar Recorte
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Helper to generate cropped WebP image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to the cropped size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return base64 webp string
  return canvas.toDataURL('image/webp', 0.85); // 85% quality WebP
}
