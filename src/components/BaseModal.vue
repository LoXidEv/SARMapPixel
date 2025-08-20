<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal" @click.stop :class="modalClass">
      <div class="modal-header" v-if="showHeader">
        <h2>{{ title }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>
      <div class="modal-content">
        <slot></slot>
      </div>
      <div class="modal-footer" v-if="showFooter">
        <slot name="footer">
          <button class="modal-btn" @click="close">
            {{ $t('close') || '关闭' }}
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BaseModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    showFooter: {
      type: Boolean,
      default: true
    },
    modalClass: {
      type: String,
      default: ''
    },
    closeOnOverlay: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close'],
  methods: {
    close() {
      this.$emit('close')
    },
    handleOverlayClick() {
      if (this.closeOnOverlay) {
        this.close()
      }
    }
  }
}
</script>

<style scoped>
/* 弹窗遮罩层样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
}

.modal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: var(--theme-color);
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #ddd;
}

.modal-content {
  padding: 20px 30px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 20px 30px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.modal-btn {
  padding: 8px 16px;
  border: 2px solid var(--theme-color);
  background-color: white;
  color: var(--theme-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-family: 'Poppins Regular', sans-serif;
  font-size: 14px;
  transition: all 0.3s;
  min-width: 120px;
}

.modal-btn:hover {
  background-color: var(--theme-color);
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal {
    margin: 20px;
    width: calc(100% - 40px);
  }
  
  .modal-header,
  .modal-content,
  .modal-footer {
    padding: 15px 20px;
  }
}
</style>