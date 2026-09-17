<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { apiClient } from "@/api/client";
import KioskTopBar from "@/components/kiosk/KioskTopBar.vue";
import KioskHeroBanner from "@/components/kiosk/KioskHeroBanner.vue";
import KioskEventCard from "@/components/kiosk/KioskEventCard.vue";
import type { EventItem, HeroSlide } from "@/components/kiosk/types";
import { useNow } from "@/composables/useNow";

const router = useRouter();

const {
  data: eventsData,
  isPending,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: ["photon", "events"],
  queryFn: async () => {
    const res = await apiClient.api.photon.event.$get();
    if (!res.ok) throw new Error(`Klarte ikke hente arrangementer (${res.status})`);
    return res.json();
  },
  refetchInterval: 30 * 60 * 1000,
});

const { data: newsData } = useQuery({
  queryKey: ["photon", "news"],
  queryFn: async () => {
    const res = await apiClient.api.photon.news.$get();
    if (!res.ok) throw new Error(`Klarte ikke hente nyheter (${res.status})`);
    return res.json();
  },
  refetchInterval: 30 * 60 * 1000,
});

// Data is refetched every 30 min; the clock ticks per-second so the
// countdown renders live
const now = useNow(() => 1_000);

// Soonest upcoming event whose registration has not opened yet
const featuredEvent = computed(() =>
  (eventsData.value?.items ?? [])
    .filter((e) => e.registrationStart)
    .map((e) => ({ event: e, start: new Date(e.registrationStart!).getTime() }))
    .filter(({ start }) => start > now.value)
    .sort((a, b) => a.start - b.start)[0]?.event ?? null,
);

// Remaining hours/minutes/seconds until registration opens
const remainingCountdown = computed(() => {
  if (!featuredEvent.value?.registrationStart) return null;
  const diff = Math.max(
    0,
    new Date(featuredEvent.value.registrationStart).getTime() - now.value,
  );
  const totalSecs = Math.floor(diff / 1_000);
  return {
    h: Math.floor(totalSecs / 3_600),
    m: Math.floor((totalSecs % 3_600) / 60),
    s: totalSecs % 60,
  };
});

// SIMPLIFIED: news slides capped at 5 so the cycle length stays predictable
const MAX_NEWS_SLIDES = 5;
const MAX_EVENT_CARDS = 5;
const SLIDE_INTERVAL_MS = 15_000;

const slides = computed<HeroSlide[]>(() => {
  const registrationSlides: HeroSlide[] =
    featuredEvent.value && remainingCountdown.value
      ? [
          {
            kind: "registration",
            event: featuredEvent.value,
            countdown: remainingCountdown.value,
          },
        ]
      : [];
  const newsSlides: HeroSlide[] = (newsData.value?.items ?? [])
    .slice(0, MAX_NEWS_SLIDES)
    .map((item) => ({ kind: "news", item }));
  return [...registrationSlides, ...newsSlides];
});

const slideIndex = ref(0);
const currentSlide = computed(() => slides.value[slideIndex.value] ?? null);

// Rotate the hero banner; nothing to cycle when there is only one slide.
// Key off the slide *count*, not the slides computed itself — it recomputes
// every second (live countdown), which would restart the interval forever.
const slideCount = computed(() => slides.value.length);
let slideTimer: ReturnType<typeof setInterval> | null = null;
watch(
  slideCount,
  (count) => {
    if (slideTimer) clearInterval(slideTimer);
    slideIndex.value = 0;
    if (count > 1) {
      slideTimer = setInterval(
        () => (slideIndex.value = (slideIndex.value + 1) % count),
        SLIDE_INTERVAL_MS,
      );
    }
  },
  { immediate: true },
);

const events = computed<EventItem[]>(() =>
  (eventsData.value?.items ?? []).slice(0, MAX_EVENT_CARDS),
);

// The close button is gone; Escape is the only way back to the desktop
const exitKiosk = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
  router.push("/");
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") exitKiosk();
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  if (slideTimer) clearInterval(slideTimer);
});
</script>

<template>
  <div class="external-kiosk-screen">
    <KioskTopBar @close="exitKiosk" />

    <div class="content">
      <div v-if="isPending" class="state-box">
        <div class="spinner"></div>
        <p>Laster arrangementer...</p>
      </div>
      <div v-else-if="isError && error" class="state-box">
        <p>{{ error.message }}</p>
        <button @click="() => refetch()" class="retry-btn">Prøv igjen</button>
      </div>
      <div v-else class="events-container">
        <KioskHeroBanner v-if="currentSlide" :slide="currentSlide" />

        <div class="events-grid">
          <KioskEventCard v-for="event in events" :key="event.id" :event="event" />
        </div>

        <div v-if="!events.length" class="empty-state">
          Ingen kommende arrangementer
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

.external-kiosk-screen {
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif !important;
  width: 100vw;
  height: 100vh;
  background: #16213a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.external-kiosk-screen *,
.external-kiosk-screen *::before,
.external-kiosk-screen *::after {
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif !important;
  cursor: default !important;
}

.content {
  flex: 1;
  padding: 1.5vw;
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
}

.state-box {
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);
  padding: 48px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  color: #ffffff;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.state-box p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-size: 1rem;
}

.retry-btn {
  margin-top: 24px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.events-container {
  width: 100%;
  max-width: 1600px;
  display: flex;
  flex-direction: column;
  gap: 1.25vw;
}

/* One row of five cards, sized by content; the hero above takes the rest */
.events-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1vw;
}

.empty-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 64px 0;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .content {
    padding: 12px;
  }

  .events-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    overflow-y: auto;
  }
}
</style>
