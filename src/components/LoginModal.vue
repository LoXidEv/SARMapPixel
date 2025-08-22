<template>
  <BaseModal 
    :visible="visible" 
    :title="$t('welcome')"
    :close-on-overlay="false"
    modal-class="login-modal"
    :show-footer="false"
    @close="$emit('close')"
  >
    <div class="login-content">
      <div class="input-group">
        <label>{{ $t('enterUserId') }}:</label>
        <input 
          v-model="inputUserId" 
          type="text" 
          :placeholder="$t('userIdPlaceholder')"
          @keyup.enter="loginWithUserId"
        >
      </div>
      <div class="login-buttons">
        <button class="login-btn primary" @click="loginWithUserId" :disabled="!inputUserId || !inputUserId.trim()">
          {{ $t('login') }}
        </button>
        <button class="login-btn secondary" @click="createNewUser">
          {{ $t('createNewAccount') }}
        </button>
      </div>
      <div v-if="currentUserId" class="current-user-info">
        <p>{{ $t('currentUserId') }}: <strong>{{ currentUserId }}</strong></p>
        <button class="login-btn secondary" @click="copyUserId">
          {{ $t('copyUserId') }}
        </button>
      </div>
      <div class="help-section">
        <button class="login-btn secondary" @click="$emit('show-help')">
          {{ $t('help') }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script>
import BaseModal from './BaseModal.vue'

export default {
  name: 'LoginModal',
  components: {
    BaseModal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentUserId: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'login', 'create-user', 'show-help'],
  data() {
    return {
      inputUserId: ''
    }
  },
  watch: {
    currentUserId: {
      immediate: true,
      handler(newVal) {
        this.inputUserId = newVal
      }
    }
  },
  methods: {
    /**
     * 生成用户ID
     */
    generateUserId() {
      return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    },

    /**
     * 使用用户ID登录
     */
    loginWithUserId() {
      if (!this.inputUserId.trim()) return
      
      const userId = this.inputUserId.trim()
      
      if (!userId.startsWith('user_')) {
        alert(this.$t('userIdPrefixRequired'))
        return
      }
      
      this.$emit('login', userId)
    },

    /**
     * 创建新用户
     */
    createNewUser() {
      const newUserId = this.generateUserId()
      this.inputUserId = newUserId
      this.$emit('create-user', newUserId)
    },

    /**
     * 复制用户ID
     */
    copyUserId() {
      navigator.clipboard.writeText(this.currentUserId).then(() => {
        alert(this.$t('userIdCopied'))
      })
    }
  }
}
</script>

<style scoped>
.login-modal {
  max-width: 400px;
}

.login-content .input-group {
  margin-bottom: 20px;
}

.login-content label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.login-content input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
}

.login-content input:focus {
  outline: none;
  border-color: #007bff;
}

.login-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.login-btn {
  flex: 1;
  padding: 8px 16px;
  border: 2px solid var(--theme-color);
  background-color: white;
  color: var(--theme-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-family: 'Poppins Regular', sans-serif;
  font-size: 14px;
  transition: all 0.3s;
}

.login-btn.primary {
  background-color: var(--theme-color);
  color: white;
}

.login-btn.primary:hover:not(:disabled) {
  background-color: var(--theme-color);
  color: white;
  transform: scale(1.05);
}

.login-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-btn.secondary {
  background-color: white;
  color: var(--theme-color);
}

.login-btn.secondary:hover {
  background-color: var(--theme-color);
  color: white;
}

.current-user-info {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 20px;
}

.help-section {
  text-align: center;
}
</style>