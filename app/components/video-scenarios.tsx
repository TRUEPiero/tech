"use client";

import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Play,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { webpSrcSet } from "@/app/lib/responsive-image";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const videos = [
  {
    id: "real-smart-home",
    title: "Что такое настоящий умный дом",
    duration: "01:08",
    image: "/images/placeholders/video-smart-home.png",
  },
  {
    id: "home-care",
    title: "Как умный дом заботится о вас",
    duration: "00:51",
    image: "/images/placeholders/video-care.png",
  },
  {
    id: "scenario-switches",
    title: "Как работают сценарные выключатели",
    duration: "00:54",
    image: "/images/placeholders/video-switches.png",
  },
  {
    id: "leak-protection",
    title: "Зачем нужна защита от протечек",
    duration: "00:37",
    image: "/images/placeholders/video-leaks.png",
  },
  {
    id: "lighting",
    title: "Освещение в умном доме",
    image: "/images/placeholders/comfort-switch.png",
  },
  {
    id: "curtains",
    title: "Как автоматизация управляет шторами",
    image: "/images/placeholders/video-care.png",
  },
  {
    id: "room-climate",
    title: "Раздельный климат в каждой комнате",
    image: "/images/placeholders/video-smart-home.png",
  },
  {
    id: "ventilation",
    title: "Вентиляция и качество воздуха",
    image: "/images/placeholders/hero-living-room.png",
  },
  {
    id: "humidification",
    title: "Зачем дому автоматическое увлажнение",
    image: "/images/placeholders/video-leaks.png",
  },
  {
    id: "leaving-home",
    title: "Как работает сценарий «Я ушел»",
    image: "/images/placeholders/video-switches.png",
  },
] as const;

type VideoItem = (typeof videos)[number];

export function VideoScenarios() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem>(videos[0]);
  const [open, setOpen] = useState(false);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: track.clientWidth * 0.82 * direction, behavior: "smooth" });
  }

  function openVideo(video: VideoItem) {
    setSelectedVideo(video);
    setOpen(true);
  }

  return (
    <section className="video-section">
      <div className="site-shell">
        <div className="video-section-heading">
          <h2>Сценарии автоматизации в действии</h2>
          <div className="video-slider-controls" aria-label="Навигация по видео">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Предыдущие видео"
              onClick={() => move(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Следующие видео"
              onClick={() => move(1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="video-track" ref={trackRef}>
          {videos.map((video) => (
            <Button
              type="button"
              variant="ghost"
              className="video-card"
              onClick={() => openVideo(video)}
              key={video.id}
            >
              <span className="video-thumbnail">
                <img
                  src={video.image}
                  srcSet={webpSrcSet(video.image)}
                  sizes="(max-width: 479px) 76vw, (max-width: 1023px) 34vw, 25vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span className="video-play" aria-hidden="true">
                  <Play />
                </span>
              </span>
              <span className="video-card-meta">
                <strong>{video.title}</strong>
                <small>{"duration" in video ? video.duration : "Видео"}</small>
              </span>
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="video-dialog" showCloseButton={false}>
          <DialogClose asChild>
            <Button
              className="video-dialog-close"
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Закрыть видео"
            >
              <X />
            </Button>
          </DialogClose>
          <DialogHeader className="video-dialog-header">
            <DialogTitle>{selectedVideo.title}</DialogTitle>
            <DialogDescription>
              Здесь будет воспроизводиться видео, размещенное на сайте.
            </DialogDescription>
          </DialogHeader>
          <div className="video-player-placeholder">
            <img
              src={selectedVideo.image}
              srcSet={webpSrcSet(selectedVideo.image)}
              sizes="90vw"
              alt=""
              decoding="async"
            />
            <div>
              <CirclePlay aria-hidden="true" />
              <span>Демонстрация видеоплеера</span>
              <small>Видео будет подключено после загрузки файла</small>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
