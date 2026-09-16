<script setup lang="ts">
import { computed } from "vue";
import { MapPin } from "@lucide/vue";
import Logo from "@/assets/images/logos/Logo.png";
import type { HeroSlide } from "./types";

const props = defineProps<{ slide: HeroSlide }>();

const image = computed(() =>
  props.slide.kind === "registration"
    ? props.slide.event.image
    : props.slide.item.imageUrl,
);

const imageAlt = computed(() =>
  props.slide.kind === "registration"
    ? props.slide.event.imageAlt || props.slide.event.title
    : props.slide.item.imageAlt || props.slide.item.title,
);

const formatLongDateTime = (iso: string) => {
  const day = new Intl.DateTimeFormat("no-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
  const time = new Intl.DateTimeFormat("no-NO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
  return `${day} kl. ${time}`;
};

const pad = (n: number) => String(n).padStart(2, "0");
</script>

<template>
  <section class="hero">
    <img v-if="image" :src="image" :alt="imageAlt" class="hero-bg" aria-hidden="true" />
    <div v-if="image" class="hero-shade" aria-hidden="true"></div>

    <div class="hero-inner">
      <div class="hero-text">
        <template v-if="slide.kind === 'registration'">
          <div class="hero-badge green">Neste påmelding</div>
          <h1 class="hero-title">{{ slide.event.title }}</h1>
          <div class="hero-countdown" role="timer">
            <div v-if="slide.countdown.h > 0" class="count-seg">
              <span class="count-num">{{ pad(slide.countdown.h) }}</span>
              <span class="count-label">Timer</span>
            </div>
            <div v-if="slide.countdown.h > 0 || slide.countdown.m > 0" class="count-seg">
              <span class="count-num">{{ pad(slide.countdown.m) }}</span>
              <span class="count-label">Min</span>
            </div>
            <div class="count-seg">
              <span class="count-num">{{ pad(slide.countdown.s) }}</span>
              <span class="count-label">Sek</span>
            </div>
          </div>
          <div class="hero-meta">
            <span>{{ formatLongDateTime(slide.event.startTime) }}</span>
            <span v-if="slide.event.location" class="hero-location">
              <MapPin class="pin-icon" aria-hidden="true" />
              {{ slide.event.location }}
            </span>
          </div>
        </template>
        <template v-else>
          <div class="hero-badge blue">Nyheter</div>
          <h1 class="hero-title">{{ slide.item.title }}</h1>
          <p class="hero-summary">{{ slide.item.header }}</p>
        </template>
      </div>

      <img v-if="image" :src="image" :alt="imageAlt" class="hero-image" />
      <div v-else class="hero-image image-fallback" role="img" :aria-label="imageAlt">
        <img :src="Logo" alt="" class="fallback-logo" aria-hidden="true" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #1e2746;
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(28px);
  /* Overscale so the blur doesn't bleed transparent edges */
  transform: scale(1.15);
}

.hero-shade {
  position: absolute;
  inset: 0;
  background: rgba(13, 24, 48, 0.72);
}

.hero-inner {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2.5vw;
  padding: 1.5vw 2.5vw;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 0.6vw;
  min-width: 0;
  flex: 1;
}

.hero-badge {
  align-self: flex-start;
  padding: 0.4vw 1vw;
  border-radius: 999px;
  font-size: 1.05vw;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-badge.green {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.14);
  border: 1px solid rgba(74, 222, 128, 0.4);
}

.hero-badge.blue {
  color: #5b9df5;
  background: rgba(91, 157, 245, 0.14);
  border: 1px solid rgba(91, 157, 245, 0.4);
}

.hero-title {
  margin: 0;
  font-size: 3.8vw;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
  letter-spacing: -0.02em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-meta {
  display: flex;
  flex-direction: column;
  gap: 0.4vw;
  font-size: 1.5vw;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
}

.hero-location {
  display: flex;
  align-items: center;
  gap: 0.5vw;
}

.pin-icon {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  color: #a8c6ec;
}

.hero-summary {
  margin: 0;
  font-size: 1.4vw;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.75);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-countdown {
  display: flex;
  gap: 2.2vw;
}

.count-seg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2vw;
}

.count-num {
  font-size: 3.4vw;
  font-weight: 800;
  color: #4ade80;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.count-label {
  font-size: 0.95vw;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.5);
}

.hero-image {
  width: 48%;
  max-height: 100%;
  aspect-ratio: 21 / 9;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 0.4vw 2vw rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #232c4a;
}

.fallback-logo {
  width: 40%;
  border-radius: 0.8vw;
  background: #ffffff;
  padding: 1vw;
  box-sizing: border-box;
  object-fit: contain;
}
</style>
