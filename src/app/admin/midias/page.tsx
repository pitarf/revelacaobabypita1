"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ImageCropper from "@/components/admin/ImageCropper";
import { Save, Image as ImageIcon, Music, Video, Plus, Trash2, Check, Star, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface Photo {
  id: string;
  imageUrl: string;
  caption: string | null;
  isFeatured: boolean;
}

export default function AdminMediaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingPhoto, setAddingPhoto] = useState(false);

  // Estados - Mensagem (SiteSetting)
  const [messageTitle, setMessageTitle] = useState("");
  const [messageText, setMessageText] = useState("");

  // Estados - Música (MusicSetting)
  const [musicUrl, setMusicUrl] = useState("");
  const [musicActive, setMusicActive] = useState(true);
  const [musicVolume, setMusicVolume] = useState("0.3");
  const [musicAutoRestart, setMusicAutoRestart] = useState(true);

  // Estados - Vídeo (VideoSetting)
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoActive, setVideoActive] = useState(false);
  const [videoIsUpload, setVideoIsUpload] = useState(false);

  // Estados - Galeria de Fotos
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoFeatured, setNewPhotoFeatured] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);

  useEffect(() => {
    loadSettings();
    loadPhotos();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok) {
        // Mensagem
        setMessageTitle(data.site?.messageTitle || "");
        setMessageText(data.site?.messageText || "");

        // Música
        setMusicUrl(data.music?.audioUrl || "");
        setMusicActive(data.music?.isActive);
        setMusicVolume(String(data.music?.initialVolume || 0.3));
        setMusicAutoRestart(data.music?.autoRestart);

        // Vídeo
        setVideoUrl(data.video?.videoUrl || "");
        setVideoTitle(data.video?.title || "");
        setVideoDescription(data.video?.description || "");
        setVideoActive(data.video?.isActive);
        setVideoIsUpload(data.video?.isUpload);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados multimídia.");
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      if (res.ok) {
        setPhotos(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Salva Configurações (Música, Vídeo e Mensagem)
  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const payload = {
        site: {
          messageTitle: messageTitle.trim(),
          messageText: messageText.trim(),
        },
        music: {
          audioUrl: musicUrl.trim(),
          isActive: musicActive,
          initialVolume: parseFloat(musicVolume) || 0.3,
          autoRestart: musicAutoRestart,
        },
        video: {
          videoUrl: videoUrl.trim(),
          title: videoTitle.trim(),
          description: videoDescription.trim(),
          isActive: videoActive,
          isUpload: videoIsUpload,
        },
      };

      const res = await fetch("/api/admin/media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar mídias.");
        return;
      }

      toast.success("Mídias e mensagens salvas com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar atualizações.");
    } finally {
      setSaving(false);
    }
  };

  // Adiciona Foto na Galeria
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPhotoUrl.trim()) {
      toast.error("A imagem é obrigatória.");
      return;
    }

    try {
      setAddingPhoto(true);
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: newPhotoUrl.trim(),
          caption: newPhotoCaption.trim() || null,
          isFeatured: newPhotoFeatured,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao adicionar imagem.");
        return;
      }

      toast.success("Foto adicionada ao carrossel!");
      setNewPhotoUrl("");
      setNewPhotoCaption("");
      setNewPhotoFeatured(false);
      loadPhotos();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar imagem.");
    } finally {
      setAddingPhoto(false);
    }
  };

  const handleCropComplete = async (base64Webp: string) => {
    try {
      setCropperOpen(false);
      toast.info("Enviando e otimizando imagem...");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Webp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNewPhotoUrl(json.url);
      toast.success("Imagem enviada com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao fazer upload da imagem.");
    }
  };

  // Exclui Foto da Galeria
  const handleDeletePhoto = async (id: string) => {
    const confirmDelete = window.confirm("Deseja realmente remover esta foto da galeria?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/gallery?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir foto.");
        return;
      }

      toast.success("Foto removida!");
      loadPhotos();
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão ao deletar foto.");
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full mb-2"></div>
          <p className="text-xs text-gray-400 font-bold">Carregando mídias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 md:pl-72 md:pr-8 md:py-8 space-y-6 overflow-x-hidden">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 font-sans">Mídias, Mensagens & Galeria</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Customize as fotos, música, vídeo e mensagem de acolhida do site</p>
          </div>
        </div>

        {/* Layout em Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Colona 1: Formulário Multimídia (Mensagem, Vídeo, Música) */}
          <form onSubmit={handleSaveMedia} className="space-y-6">
            
            {/* Mensagem dos Pais */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-1">
                <span className="text-lg">📝</span> Mensagem de Boas-vindas
              </h3>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Título da Mensagem</label>
                <input
                  type="text"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="Ex: Sejam muito bem-vindos!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Texto da Mensagem</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escreva uma mensagem calorosa..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Música de Fundo */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-1">
                <Music className="h-4.5 w-4.5 text-pink-500" /> Música de Fundo
              </h3>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">URL da Música (MP3 online)</label>
                <input
                  type="text"
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  placeholder="https://exemplo.com/musica.mp3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Volume Inicial (0 a 1)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-center focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Música Ativa</label>
                  <select
                    value={String(musicActive)}
                    onChange={(e) => setMusicActive(e.target.value === "true")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-center focus:outline-none"
                  >
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vídeo do Ensaio */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-1">
                <Video className="h-4.5 w-4.5 text-sky-500" /> Vídeo do Casal (YouTube / Vimeo)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Título do Bloco de Vídeo</label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Recadinho especial"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Exibir Vídeo no Site</label>
                  <select
                    value={String(videoActive)}
                    onChange={(e) => setVideoActive(e.target.value === "true")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-center focus:outline-none"
                  >
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">URL do Vídeo</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Descrição Curta</label>
                <input
                  type="text"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Assista ao vídeo que preparamos para compartilhar esse amor!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-black text-white font-extrabold py-4 rounded-full text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <Save className="h-4.5 w-4.5" />
                  <span>Salvar Textos e Mídias</span>
                </>
              )}
            </button>
          </form>

          {/* Coluna 2: Galeria de Fotos */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
                <ImageIcon className="h-4.5 w-4.5 text-amber-500" /> Galeria de Fotos (Slideshow)
              </h3>

              {/* Formulário rápido para adicionar imagem */}
              <form onSubmit={handleAddPhoto} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 mb-6">
                <h4 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Adicionar imagem à galeria
                </h4>
                
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Imagem *</label>
                  
                  <div className="flex items-center gap-2">
                    {newPhotoUrl ? (
                      <div className="h-10 w-10 rounded-lg border border-slate-200 overflow-hidden flex-none">
                        <img src={newPhotoUrl} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center flex-none">
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCropperOpen(true)}
                        className="flex items-center justify-center gap-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-100 px-3 py-2 rounded-xl text-xs font-bold transition-all w-full"
                      >
                        <UploadCloud className="h-4 w-4" />
                        Enviar Foto (1:1)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Legenda (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Nosso ensaio gestante"
                      value={newPhotoCaption}
                      onChange={(e) => setNewPhotoCaption(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4 pl-1">
                    <input
                      type="checkbox"
                      id="featuredphoto"
                      checked={newPhotoFeatured}
                      onChange={(e) => setNewPhotoFeatured(e.target.checked)}
                      className="accent-slate-900 h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="featuredphoto" className="text-[10px] font-bold text-slate-500 cursor-pointer select-none">
                      Destacar foto?
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={addingPhoto}
                  className="w-full bg-slate-900 hover:bg-black text-white font-extrabold py-2 rounded-xl text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  {addingPhoto ? (
                    <span className="animate-spin inline-block h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Adicionar Imagem</span>
                    </>
                  )}
                </button>
              </form>

              {/* Grid das fotos atuais */}
              <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1 no-scrollbar">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Imagens no Carrossel ({photos.length})</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo) => (
                    <div 
                      key={photo.id}
                      className="group relative aspect-square rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center"
                    >
                      <img src={photo.imageUrl} alt={photo.caption || ""} className="w-full h-full object-cover" />
                      
                      {/* Selo destaque */}
                      {photo.isFeatured && (
                        <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white p-0.5 rounded shadow-sm">
                          <Star className="h-2.5 w-2.5 fill-white" />
                        </div>
                      )}

                      {/* Overlay com Lixeira para Excluir no Hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition-colors shadow-md active:scale-95"
                          title="Remover imagem"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {photos.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-400 font-bold uppercase text-[9px]">
                      Nenhuma imagem na galeria.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

        {cropperOpen && (
          <ImageCropper 
            onCropComplete={handleCropComplete} 
            onCancel={() => setCropperOpen(false)} 
            aspect={16/9}
          />
        )}

      </main>
    </div>
  );
}
