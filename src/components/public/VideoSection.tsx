"use client";

import React from "react";
import { Video } from "lucide-react";

interface VideoSectionProps {
  title?: string;
  description?: string;
  videoUrl?: string;
  isUpload?: boolean;
  isActive?: boolean;
}

// Utilitário para converter URLs normais de YouTube ou Vimeo para formato de embed
function getEmbedUrl(url: string): string {
  if (!url) return "";

  // 1. YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("embed/")) {
      return url; // já está no formato de embed
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1` : url;
  }

  // 2. Vimeo
  if (url.includes("vimeo.com")) {
    const videoId = url.split("vimeo.com/")[1]?.split("?")[0] || "";
    return videoId ? `https://player.vimeo.com/video/${videoId}?muted=1` : url;
  }

  return url;
}

export default function VideoSection({
  title = "Um Recadinho Especial",
  description = "Assista ao vídeo que preparamos para compartilhar essa revelação com você.",
  videoUrl = "",
  isUpload = false,
  isActive = false,
}: VideoSectionProps) {
  if (!isActive || !videoUrl) return null;

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <section className="py-16 bg-baby-blue-light/30 w-full border-y border-baby-beige-dark/20">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        
        {/* Cabeçalho do Vídeo */}
        <div className="flex items-center justify-center gap-2 mb-3 text-baby-blue">
          <Video className="h-5 w-5 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">Apresentação</span>
        </div>
        
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-tight font-serif mb-2">
          {title}
        </h2>
        
        {description && (
          <p className="text-sm md:text-base text-gray-500 font-medium max-w-xl mx-auto mb-8">
            {description}
          </p>
        )}

        {/* Player Container */}
        <div className="glass-card rounded-3xl p-3 md:p-4 max-w-3xl mx-auto shadow-md border border-white">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-inner bg-black">
            {isUpload ? (
              <video
                src={videoUrl}
                controls
                muted
                autoPlay={false}
                className="w-full h-full object-cover"
                playsInline
              />
            ) : (
              <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
