<script setup lang="ts">
import { computed, onUnmounted, ref, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { apiClient } from "@/api/client";
import { Calendar, MapPin } from "@lucide/vue";

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

const formatDay = (iso: string) =>
  new Intl.DateTimeFormat("no-NO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("no-NO", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const events = computed(() => (eventsData.value?.items ?? []).slice(0, 6));

// Tick so the registration countdown stays current between refetches
const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval> | null = null;
let tickerInterval = 0;

// 2 minutes
const SOON_THRESHOLD_MS = 2 * 60 * 1000;

const startTicker = (interval: number) => {
  if (tickerInterval === interval) return;
  if (ticker) clearInterval(ticker);
  tickerInterval = interval;
  ticker = setInterval(() => (now.value = Date.now()), interval);
};

onUnmounted(() => {
  if (ticker) clearInterval(ticker);
});

// 30s ticking normally; per-second once a countdown is under 2 min
watchEffect(() => {
  const soon = (eventsData.value?.items ?? [])
    .filter((e) => e.registrationStart)
    .some((e) => {
      const start = new Date(e.registrationStart!).getTime();
      return start > now.value && start - now.value <= SOON_THRESHOLD_MS;
    });
  startTicker(soon ? 1_000 : 30_000);
});

// 2 hours
const REGISTRATION_WINDOW_MS = 2 * 60 * 60 * 1000;

// Soonest event whose registration opens within the next 2 hours
const featuredEvent = computed(() => {
  const limit = now.value + REGISTRATION_WINDOW_MS;
  return (
    (eventsData.value?.items ?? [])
      .filter((e) => e.registrationStart)
      .map((e) => ({ event: e, start: new Date(e.registrationStart!).getTime() }))
      .filter(({ start }) => start > now.value && start <= limit)
      .sort((a, b) => a.start - b.start)[0]?.event ?? null
  );
});

const formatCountdown = (iso: string) => {
  const diff = Math.max(0, new Date(iso).getTime() - now.value);
  if (diff <= SOON_THRESHOLD_MS) {
    const totalSecs = Math.floor(diff / 1_000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  const mins = Math.round(diff / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} t ${m} min` : `${m} min`;
};

const exitFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
  router.push("/");
};
</script>

<template>
  <div class="external-kiosk-screen">
    <button @click="exitFullscreen" class="close-btn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>

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
        <div class="section-title">Kommende arrangementer</div>

        <Transition name="banner">
          <div v-if="featuredEvent" class="featured-banner">
            <img v-if="featuredEvent.image" :src="featuredEvent.image"
              :alt="featuredEvent.imageAlt || featuredEvent.title" class="featured-image" />
            <div v-else class="featured-image image-fallback" role="img"
              :aria-label="featuredEvent.imageAlt || featuredEvent.title">
              <Calendar class="fallback-icon" aria-hidden="true" />
            </div>
            <div class="featured-body">
              <div class="featured-label">
                Påmelding åpner om {{ formatCountdown(featuredEvent.registrationStart!) }}
              </div>
              <div class="featured-title">{{ featuredEvent.title }}</div>
              <div class="featured-meta">
                <span>
                  {{ formatDay(featuredEvent.startTime) }}
                  {{ formatTime(featuredEvent.startTime) }} –
                  {{ formatTime(featuredEvent.endTime) }}
                </span>
                <span v-if="featuredEvent.location">
                  <MapPin class="pin-icon" aria-hidden="true" />
                  {{ featuredEvent.location }}
                </span>
              </div>
            </div>
          </div>
        </Transition>

        <div class="events-grid">
          <div v-for="event in events" :key="event.id" class="event-card">
            <img v-if="event.image" :src="event.image" :alt="event.imageAlt || event.title" class="event-image" />
            <div v-else class="event-image image-fallback" role="img" :aria-label="event.imageAlt || event.title">
              <Calendar class="fallback-icon" aria-hidden="true" />
            </div>
            <div class="event-body">
              <div class="event-title">{{ event.title }}</div>
              <div class="event-meta">
                <span class="event-when">
                  <span class="event-day">{{ formatDay(event.startTime) }}</span>
                  <span class="event-time">
                    {{ formatTime(event.startTime) }} – {{ formatTime(event.endTime) }}
                  </span>
                </span>
                <span v-if="event.location" class="event-location">
                  <MapPin class="pin-icon" aria-hidden="true" />
                  {{ event.location }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!events.length" class="empty-state">
          Ingen kommende arrangementer
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

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

.close-btn {
  position: fixed;
  top: 24px;
  right: 24px;
  background: transparent;
  border: none;
  color: #cccccc;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  padding: 0;
  outline: none;
  box-shadow: none;
}

.content {
  flex: 1;
  padding: 1.7vw;
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
}

.section-title {
  font-size: 1.9vw;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
  margin-bottom: 1vw;
  flex-shrink: 0;
}

.events-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1.25vw;
  min-height: 0;
}

.event-card {
  background: #1e2746;
  border: 1px solid #2d3959;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.event-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  /* Cap so short viewports don't push the text out of the card */
  max-height: 55%;
  object-fit: cover;
  display: block;
}

.image-fallback {
  background: #232c4a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fallback-icon {
  width: 4vw;
  height: 4vw;
  color: #a8c6ec;
}

.event-body {
  padding: 1vw 1.25vw;
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.event-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* All font sizes in vw so text scales linearly with screen resolution */

.event-day {
  font-size: 1vw;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #ffffff;
  font-weight: 600;
  white-space: nowrap;
}

.event-title {
  font-size: 1.35vw;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
  letter-spacing: -0.01em;
  flex-shrink: 0;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2vw;
  font-size: 1vw;
  color: #ffffff;
  flex-shrink: 0;
}

.event-location {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pin-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  color: #a8c6ec;
}

/* Featured banner: registration opening soon */

.featured-banner {
  display: flex;
  border: 2px solid #4ade80;
  border-radius: 12px;
  background: #1e2746;
  overflow: hidden;
  margin-bottom: 1.25vw;
  box-shadow: 0 0 2vw rgba(74, 222, 128, 0.25);
  flex-shrink: 0;
  min-height: 0;
  /* Cap: the image's intrinsic 16:9 ratio would otherwise drive the height */
  max-height: 13vw;
}

.featured-image {
  width: 30%;
  align-self: stretch;
  min-height: 0;
  height: 100%;
  object-fit: cover;
  display: block;
}

.featured-image.image-fallback {
  display: flex;
}

.featured-body {
  padding: 0.8vw 1.7vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.3vw;
  flex: 1;
  min-width: 0;
}

.featured-label {
  font-size: 1.15vw;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: #4ade80;
}

.featured-title {
  font-size: 2.2vw;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.featured-meta {
  display: flex;
  gap: 1.2vw;
  font-size: 1.15vw;
  color: #ffffff;
}

.featured-meta span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-enter-active {
  animation: banner-in 0.35s ease;
}

.banner-leave-active {
  animation: banner-in 0.2s ease reverse;
}

@keyframes banner-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.event-time {
  font-weight: 600;
  color: #a8c6ec;
}

.event-when {
  display: flex;
  align-items: baseline;
  gap: 0.6vw;
  min-width: 0;
}

.event-location {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  grid-column: 1 / -1;
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
