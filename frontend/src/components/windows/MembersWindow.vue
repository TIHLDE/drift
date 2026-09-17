<script setup lang="ts">
import { ref } from 'vue';
import membersData from '@/data/members.json';

interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  image?: string;
}

const members = ref<Member[]>(membersData);
</script>

<template>
  <div class="window-body">
    <div class="members-content">
      <h2>Drift-medlemmer</h2>
      <div class="members-list">
        <div v-for="member in members" :key="member.id" class="member-card">
          <div class="field-row-stacked">
            <label>{{ member.name }}</label>
            <p class="role-label">Ansvarsområde:</p>
            <p class="role-value">{{ member.role }}</p>
            <a :href="`mailto:${member.email}`" class="member-email">{{ member.email }}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.members-content {
  padding: 20px;
}

.members-content h2 {
  margin-top: 0;
  color: #000080;
}

.members-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.member-card {
  padding: 10px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  background: #c0c0c0;
}

.member-card label {
  font-weight: bold;
  font-size: 14px;
}

.member-card .role-label {
  margin: 10px 0 0 0;
  font-weight: bold;
  font-size: 14px;
}

.member-card .role-value {
  margin: 2px 0 0 0;
  font-size: 14px;
}

.member-email {
  display: inline-block;
  margin-top: 5px;
  font-size: 14px;
  color: #0000ff;
  text-decoration: underline;
}

.member-email:hover {
  color: #ff00ff;
}
</style>
