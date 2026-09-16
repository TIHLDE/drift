import { onUnmounted, ref, watchPostEffect } from "vue";

export const useNow = (getIntervalMs: () => number) => {
  const now = ref(Date.now());
  let timer: ReturnType<typeof setInterval> | null = null;

  watchPostEffect(() => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => (now.value = Date.now()), getIntervalMs());
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });

  return now;
};
