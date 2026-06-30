import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { site, music, video } = await req.json();

    await prisma.$transaction(async (tx) => {
      // 1. Atualiza Mensagem dos Pais (SiteSetting)
      if (site) {
        const currentSite = await tx.siteSetting.findFirst();
        if (currentSite) {
          await tx.siteSetting.update({
            where: { id: currentSite.id },
            data: {
              messageTitle: site.messageTitle,
              messageText: site.messageText,
            },
          });
        }
      }

      // 2. Atualiza Música de Fundo (MusicSetting)
      if (music) {
        const currentMusic = await tx.musicSetting.findFirst();
        if (currentMusic) {
          await tx.musicSetting.update({
            where: { id: currentMusic.id },
            data: {
              audioUrl: music.audioUrl,
              isActive: music.isActive,
              initialVolume: parseFloat(music.initialVolume || "0.3"),
              autoRestart: music.autoRestart,
            },
          });
        }
      }

      // 3. Atualiza Vídeo (Video)
      if (video) {
        const currentVideo = await tx.video.findFirst();
        if (currentVideo) {
          await tx.video.update({
            where: { id: currentVideo.id },
            data: {
              videoUrl: video.videoUrl,
              title: video.title,
              description: video.description || null,
              isActive: video.isActive,
              isUpload: video.isUpload,
            },
          });
        }
      }
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "UPDATE_MEDIA_SETTINGS",
        details: "Atualizou configurações de mídias (Música, Vídeo e Mensagem).",
      },
    });

    return NextResponse.json({ success: true, message: "Mídias atualizadas!" });

  } catch (error) {
    console.error("Erro no PUT admin/media:", error);
    return NextResponse.json({ error: "Erro ao salvar mídias." }, { status: 500 });
  }
}
