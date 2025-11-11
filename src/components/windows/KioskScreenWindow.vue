<template>
  <div class="kiosk-screen-window">
    <h2>Velg skjermtype</h2>
    <div class="button-container">
      <button @click="openExternalScreen">Ekstern skjerm</button>
      <button @click="openInternalScreen">Intern skjerm</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  openExternalScreen: [];
  openInternalScreen: [];
}>();

const openExternalScreen = () => {
  emit('openExternalScreen');
};

const openInternalScreen = () => {
  emit('openInternalScreen');
};
</script>

<style scoped>
.kiosk-screen-window {
  padding: 20px;
}

h2 {
  margin-bottom: 10px;
}

.button-container {
  display: flex;
  gap: 10px;
  flex-direction: column;
}

button {
  padding: 10px 20px;
  min-width: 200px;
  cursor: pointer;
}
</style>