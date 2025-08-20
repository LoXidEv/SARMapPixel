<template>
  <BaseModal :visible="visible" :title="$t('help')" modal-class="help-modal" @close="$emit('close')">
    <div class="help-content">
      <div class="help-section">
        <h3>{{ $t('helpBasicOperations') }}</h3>
        <div class="help-text" v-html="$t('helpBasicOperationsText').replace(/\n/g, '<br>')" />
      </div>

      <div class="help-section">
        <h3>{{ $t('helpViewControls') }}</h3>
        <div class="help-text" v-html="$t('helpViewControlsText').replace(/\n/g, '<br>')" />
      </div>

      <div class="help-section">
        <h3>{{ $t('helpUserFeatures') }}</h3>
        <div class="help-text" v-html="$t('helpUserFeaturesText').replace(/\n/g, '<br>')" />
      </div>

      <div class="help-section">
        <h3>{{ $t('helpShortcuts') }}</h3>
        <div class="help-text" v-html="$t('helpShortcutsText').replace(/\n/g, '<br>')" />
      </div>

      <div class="help-section">
        <h3>{{ $t('helpStatusFeatures') }}</h3>
        <div class="help-text" v-html="$t('helpStatusFeaturesText').replace(/\n/g, '<br>')" />
      </div>

      <div class="help-section">
        <h3>{{ $t('helpErrorHandling') }}</h3>
        <div class="help-text" v-html="$t('helpErrorHandlingText').replace(/\n/g, '<br>')" />
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

.help-section {
  margin-bottom: 25px;
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section h3 {
  color: var(--theme-color);
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 2px solid var(--theme-color);
  padding-bottom: 5px;
}

.help-text {
  margin: 0;
  padding: 0;
  line-height: 1.6;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .help-section h3 {
    font-size: 16px;
  }

  .help-section li {
    font-size: 14px;
  }
}
</style>