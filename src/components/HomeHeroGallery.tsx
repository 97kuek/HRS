"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import hotelExterior from "@/assets/hotel-exterior.webp";
import hotelFitnessCenter from "@/assets/hotel-fitness-center.webp";
import hotelLobby from "@/assets/hotel-lobby.webp";
import hotelLounge from "@/assets/hotel-lounge.webp";
import hotelRestaurant from "@/assets/hotel-restaurant.webp";
import hotelSpa from "@/assets/hotel-spa.webp";

interface GallerySlide {
  image: StaticImageData;
  label: string;
}

const slides: GallerySlide[] = [
  { image: hotelExterior, label: "ホテル外観" },
  { image: hotelLobby, label: "ロビー" },
  { image: hotelRestaurant, label: "レストラン" },
  { image: hotelLounge, label: "ゲストラウンジ" },
  { image: hotelFitnessCenter, label: "フィットネスセンター" },
  { image: hotelSpa, label: "スパ" },
];

export function HomeHeroGallery() {
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  function showSlide(index: number) {
    if (index === current) return;
    setPrevious(current);
    setCurrent(index);
  }

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setPrevious(current);
      setCurrent((current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [current, paused]);

  useEffect(() => {
    if (previous === null) return;
    const timer = window.setTimeout(() => setPrevious(null), 1600);
    return () => window.clearTimeout(timer);
  }, [current, previous]);

  const next = (current + 1) % slides.length;
  const renderedSlides = Array.from(
    new Set([previous, current, next].filter((index): index is number => index !== null)),
  );

  return (
    <div className="home-gallery">
      <div className="home-gallery-images" aria-hidden="true">
        {renderedSlides.map((index) => {
          const state =
            index === current ? " is-active" : index === previous ? " is-leaving" : " is-preload";
          return (
            <Image
              key={slides[index].label}
              className={`home-gallery-image${state}`}
              src={slides[index].image}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
            />
          );
        })}
      </div>
      <div className="home-gallery-status">
        <span className="home-gallery-label">{slides[current].label}</span>
        <div className="home-gallery-dots" aria-label="ホテルギャラリー">
          {slides.map((slide, index) => (
            <button
              key={slide.label}
              type="button"
              className={`home-gallery-dot${index === current ? " is-active" : ""}`}
              aria-label={`${slide.label}を表示`}
              aria-pressed={index === current}
              onClick={() => showSlide(index)}
            />
          ))}
          <button
            type="button"
            className="home-gallery-toggle"
            aria-label={paused ? "ギャラリーの自動再生を再開" : "ギャラリーの自動再生を一時停止"}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "▶" : "Ⅱ"}
          </button>
        </div>
      </div>
    </div>
  );
}
