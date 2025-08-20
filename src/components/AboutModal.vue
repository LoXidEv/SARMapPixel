<template>
  <BaseModal :visible="visible" :title="$t('about')" modal-class="about-modal" @close="$emit('close')">
    <div class="about-content">
      <div class="about-section">
        <h3>{{ $t('aboutProject') }}</h3>
        <div class="about-text" v-html="$t('aboutProjectText').replace(/\n/g, '<br>')" />
      </div>

      <div class="about-section">
        <h3>{{ $t('aboutAI') }}</h3>
        <div class="about-text" v-html="$t('aboutAIText').replace(/\n/g, '<br>')" />
      </div>

      <div class="about-section">
        <h3>{{ $t('aboutOpenSource') }}</h3>
        <div class="about-text" v-html="$t('aboutOpenSourceText').replace(/\n/g, '<br>')" />
      </div>

      <div class="about-section">
        <h3>{{ $t('aboutTesting') }}</h3>
        <div class="about-text" v-html="$t('aboutTestingText').replace(/\n/g, '<br>')" />
      </div>

      <div class="about-section">
        <h3>{{ $t('aboutTechnology') }}</h3>
        <div class="about-text" v-html="$t('aboutTechnologyText').replace(/\n/g, '<br>')" />
      </div>
    </div>
  </BaseModal>
</template>

<script>
import BaseModal from './BaseModal.vue'

export default {
  name: 'AboutModal',
  components: {
    BaseModal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close']
}
</script>

<style scoped>
.about-modal {
  max-width: 600px;
}

.about-section {
  margin-bottom: 25px;
}

.about-section:last-child {
  margin-bottom: 0;
}

.about-section h3 {
  color: var(--theme-color);
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 2px solid var(--theme-color);
  padding-bottom: 5px;
}

.about-text {
  margin: 0;
  padding: 0;
  line-height: 1.6;
  color: #666;
}

.about-text a {
  color: var(--theme-color);
  text-decoration: none;
}

.about-text a:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .about-section h3 {
    font-size: 16px;
  }

  .about-text {
    font-size: 14px;
  }
}
</style>