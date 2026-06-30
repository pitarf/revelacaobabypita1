"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Play, Pause, Volume2, VolumeX } from "lucide-react";

interface MusicPlayerProps {
  audioUrl?: string;
  isActive?: boolean;
  initialVolume?: number;
  autoRestart?: boolean;
}

export default function MusicPlayer({
  audioUrl = "",
  isActive = false,
  initialVolume = 0.3,
  autoRestart = true,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  useEffect(() => {
    if (!isActive || !audioUrl) return;

    // Inicializa o elemento de áudio
    const audio = new Audio(audioUrl);
    audio.loop = autoRestart;
    audio.volume = volume;
    audioRef.current = audio;

    // Verificamos se já foi respondido nesta sessão
    const dismissed = sessionStorage.getItem("music_prompt_dismissed");
    let timeoutId: NodeJS.Timeout;

    if (!dismissed) {
      timeoutId = setTimeout(() => {
        setShowPromptModal(true);
      }, 4000);
    } else {
      setHasInteracted(true);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl, isActive, autoRestart]);

  // Atualiza o volume do áudio quando alterado
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  if (!isActive || !audioUrl) return null;

  const handleAcceptMusic = () => {
    setShowPromptModal(false);
    sessionStorage.setItem("music_prompt_dismissed", "yes");
    setHasInteracted(true);
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Erro ao tocar áudio:", err);
        });
    }
  };

  const handleDeclineMusic = () => {
    setShowPromptModal(false);
    sessionStorage.setItem("music_prompt_dismissed", "yes");
    setHasInteracted(true);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Falha ao tocar áudio:", err);
        });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <>
      <div 
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2"
        onMouseEnter={() => setShowVolumeSlider(true)}
        onMouseLeave={() => setShowVolumeSlider(false)}
      >
        {/* Botão de Controle Principal */}
        <button
          onClick={togglePlay}
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
            isPlaying 
              ? "bg-[#f6b26b] text-white rotate-360 scale-105" 
              : "bg-white text-[#f6b26b] border border-baby-beige-dark hover:scale-105"
          }`}
          title={isPlaying ? "Pausar música" : "Tocar música"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 animate-pulse" />
          ) : (
            <Music className="h-5 w-5" />
          )}
        </button>

        {/* Mini painel de volume exposto em hover */}
        <div 
          className={`flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 shadow-md border border-baby-beige-dark transition-all duration-300 ${
            showVolumeSlider 
              ? "opacity-100 translate-x-0 w-32" 
              : "opacity-0 -translate-x-4 w-0 overflow-hidden pointer-events-none"
          }`}
        >
          <button onClick={toggleMute} className="text-gray-500 hover:text-[#f6b26b] transition-colors">
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              if (isMuted) setIsMuted(false);
            }}
            className="h-1.5 w-16 cursor-pointer accent-[#f6b26b] bg-baby-beige-dark rounded-lg appearance-none"
          />
        </div>

        {/* Balão explicativo inicial flutuante */}
        {!hasInteracted && !showPromptModal && (
          <div className="absolute left-16 bottom-1 flex w-44 items-center justify-center rounded-lg bg-white border border-[#f6b26b]/30 px-3 py-1.5 text-xs text-[#f6b26b] shadow-md animate-bounce">
            <span>Clique para ativar a música 🎵</span>
          </div>
        )}
      </div>

      {/* Modal Prompt de Confirmação de Música (Abre ao carregar o site) */}
      {showPromptModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={handleDeclineMusic}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Card Modal */}
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full relative z-10 shadow-2xl border border-baby-beige animate-scale-up text-center">
            {/* Ícone Musical */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6b26b]/10 text-[#f6b26b] mb-5">
              <Music className="h-7 w-7 animate-bounce" />
            </div>

            {/* Título */}
            <h4 className="text-xl font-extrabold text-gray-800 tracking-tight">
              Música de Fundo
            </h4>
            
            {/* Descrição */}
            <p className="text-sm text-gray-500 font-semibold leading-relaxed mt-2 mb-6">
              Gostaria de ouvir a música de fundo enquanto navega por nossa lista de presentes?
            </p>

            {/* Ações */}
            <div className="space-y-2">
              <button
                onClick={handleAcceptMusic}
                className="w-full bg-[#f6b26b] hover:bg-[#e09d56] text-white font-extrabold py-3 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                Sim, quero ouvir 🎵
              </button>
              <button
                onClick={handleDeclineMusic}
                className="w-full text-gray-500 hover:text-gray-700 font-extrabold py-2.5 rounded-full transition-all text-xs uppercase tracking-wider"
              >
                Não, prefiro silêncio 🔇
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
