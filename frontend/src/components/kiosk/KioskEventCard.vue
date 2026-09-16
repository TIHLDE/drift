<script setup lang="ts">
import Logo from "@/assets/images/logos/Logo.png";
import type { EventItem } from "./types";

defineProps<{ event: EventItem }>();

const formatDay = (iso: string) =>
  new Intl.DateTimeFormat("no-NO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("no-NO", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
</script>

<template>
  <article class="event-card">
    <img
      v-if="event.image"
      :src="event.image"
      :alt="event.imageAlt || event.title"
      class="card-image"
    />
    <div
      v-else
      class="card-image image-fallback"
      role="img"
      :aria-label="event.imageAlt || event.title"
    >
      <img :src="Logo" alt="" class="fallback-logo" aria-hidden="true" />
    </div>
    <div class="card-body">
      <div class="card-title">{{ event.title }}</div>
      <div class="card-when">
        <span class="card-day">{{ formatDay(event.startTime) }}</span>
        <span class="card-time">
          {{ formatTime(event.startTime) }} – {{ formatTime(event.endTime) }}
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  background: #1e2746;
  border: 1px solid #2d3959;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.card-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}

.image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2f5da8;
}

.fallback-logo {
  width: 55%;
  border-radius: 0.6vw;
  background: #ffffff;
  padding: 0.6vw;
  box-sizing: border-box;
  object-fit: contain;
}

.card-body {
  padding: 0.8vw 1vw 1vw;
  display: flex;
  flex-direction: column;
  gap: 0.35vw;
  flex-shrink: 0;
}

.card-title {
  font-size: 1.35vw;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-when {
  display: flex;
  align-items: baseline;
  gap: 0.6vw;
  min-width: 0;
}

.card-day {
  font-size: 1.15vw;
  font-weight: 700;
  color: #5b9df5;
  white-space: nowrap;
}

.card-time {
  font-size: 1.15vw;
  font-weight: 600;
  color: #a8c6ec;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
