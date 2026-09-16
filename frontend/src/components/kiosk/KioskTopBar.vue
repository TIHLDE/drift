<script setup lang="ts">
import { computed } from "vue";
import { X } from "@lucide/vue";
import { useNow } from "@/composables/useNow";

const emit = defineEmits<{ close: [] }>();

const now = useNow(() => 30_000);

const time = computed(() =>
  new Intl.DateTimeFormat("no-NO", { hour: "2-digit", minute: "2-digit" }).format(
    now.value,
  ),
);

const date = computed(() =>
  new Intl.DateTimeFormat("no-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now.value),
);
</script>

<template>
  <header class="top-bar">
    <button class="close-btn" aria-label="Lukk" @click="emit('close')">
      <X class="close-icon" aria-hidden="true" />
    </button>
    <div class="clock">
      <span class="clock-date">{{ date }}</span>
      <span class="clock-time">{{ time }}</span>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.8vw 1.7vw;
  background: #0d1830;
  border-bottom: 1px solid #223052;
  flex-shrink: 0;
}

.clock {
  display: flex;
  align-items: baseline;
  gap: 1.2vw;
  margin-left: auto;
}

.clock-date {
  font-size: 1.2vw;
  color: rgba(255, 255, 255, 0.65);
}

.clock-time {
  font-size: 2.2vw;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

.close-btn {
  background: transparent;
  border: none;
  color: #cccccc;
  width: 2.6vw;
  height: 2.6vw;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-right: 1.2vw;
  outline: none;
  box-shadow: none;
  /* The kiosk screen forces cursor: default !important on all children */
  cursor: pointer !important;
}

.close-btn:hover {
  color: #ffffff;
}

.close-icon {
  width: 1.6vw;
  height: 1.6vw;
}
</style>
