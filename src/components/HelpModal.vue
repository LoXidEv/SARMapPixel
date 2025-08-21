<template>
  <BaseModal :visible="visible" :title="$t('help')" modal-class="help-modal" @close="$emit('close')">
    <div class="help-content">
      <div class="modal-section">
        <h3>{{ $t('helpBasicOperations') }}</h3>
        <div class="modal-text" v-html="$t('helpBasicOperationsText').replace(/\n/g, '<br>')" />
      </div>

      <div class="modal-section">
        <h3>{{ $t('helpViewControls') }}</h3>
        <div class="modal-text" v-html="$t('helpViewControlsText').replace(/\n/g, '<br>')" />
      </div>

      <div class="modal-section">
        <h3>{{ $t('helpUserFeatures') }}</h3>
        <div class="modal-text" v-html="$t('helpUserFeaturesText').replace(/\n/g, '<br>')" />
      </div>

      <div class="modal-section">
        <h3>{{ $t('helpShortcuts') }}</h3>
        <div class="modal-text" v-html="$t('helpShortcutsText').replace(/\n/g, '<br>')" />
      </div>

      <div class="modal-section">
        <h3>{{ $t('helpStatusFeatures') }}</h3>
        <div class="modal-text" v-html="$t('helpStatusFeaturesText').replace(/\n/g, '<br>')" />
      </div>

      <div class="modal-section">
        <h3>{{ $t('helpSystemArchitecture') }}</h3>
        <div class="modal-text" v-html="$t('helpSystemArchitectureText').replace(/\n/g, '<br>')" />
      </div>

      <div class="modal-section">
        <h3>{{ $t('helpErrorHandling') }}</h3>
        <div class="modal-text" v-html="$t('helpErrorHandlingText').replace(/\n/g, '<br>')" />
      </div>
    </div>
  </BaseModal>
</template>

<script>
import BaseModal from './BaseModal.vue'

export default {
  name: 'HelpModal',
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
.help-modal {
  max-width: 600px;
}
</style>