<template>
  <BaseModal :visible="visible" :title="$t('about')" modal-class="about-modal" @close="$emit('close')">
    <div class="about-content">
      <div class="modal-section">
        <h3>{{ $t('aboutProject') }}</h3>
        <div class="modal-text" v-html="$t('aboutProjectText').replace(/\n/g, '<br>')" />
      </div>

      <div class="modal-section">
        <h3>{{ $t('aboutAI') }}</h3>
        <div class="modal-text" v-html="$t('aboutAIText').replace(/\n/g, '<br>')" />
      </div>

      <div class="modal-section">
        <h3>{{ $t('aboutOpenSource') }}</h3>
        <div class="modal-text" v-html="$t('aboutOpenSourceText').replace(/\n/g, '<br>')" />
      </div>

      <div class="modal-section">
        <h3>{{ $t('aboutTesting') }}</h3>
        <div class="modal-text" v-html="$t('aboutTestingText').replace(/\n/g, '<br>')" />
      </div>

      <div class="modal-section">
        <h3>{{ $t('aboutTechnology') }}</h3>
        <div class="modal-text" v-html="$t('aboutTechnologyText').replace(/\n/g, '<br>')" />
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
</style>