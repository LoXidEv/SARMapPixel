<template>
  <div v-if="visible" class="error-overlay">
    <div class="error-container">
      <div class="error-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="#ff4444"/>
        </svg>
      </div>
      <div class="error-content">
        <h2 class="error-title">{{ title || $t('errorOccurred') }}</h2>
        <p class="error-message">{{ message }}</p>
        
        <!-- 倒计时进度条 -->
        <div v-if="autoClose" class="countdown-container">
          <div class="countdown-text">{{ Math.ceil(remainingTime / 1000) }}秒后自动关闭</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
          </div>
        </div>
        
        <div class="error-actions" v-if="showRetry">
          <button class="error-btn primary" @click="$emit('retry')">
            {{ $t('retry') }}
          </button>
          <button class="error-btn secondary" @click="handleClose">
            {{ $t('close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onUnmounted } from 'vue'

export default {
  name: 'ErrorDisplay',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      required: true
    },
    showRetry: {
      type: Boolean,
      default: true
    },
    autoClose: {
      type: Boolean,
      default: true
    },
    autoCloseDelay: {
      type: Number,
      default: 3000
    }
  },
  emits: ['retry', 'close'],
  setup(props, { emit }) {
    const remainingTime = ref(props.autoCloseDelay)
    const timer = ref(null)
    const interval = ref(null)
    
    const progressWidth = computed(() => {
      return ((props.autoCloseDelay - remainingTime.value) / props.autoCloseDelay) * 100
    })
    
    const startCountdown = () => {
      if (!props.autoClose) return
      
      remainingTime.value = props.autoCloseDelay
      
      clearTimeout(timer.value)
      clearInterval(interval.value)
      
      timer.value = setTimeout(() => {
        emit('close')
      }, props.autoCloseDelay)
      interval.value = setInterval(() => {
        remainingTime.value -= 100
        if (remainingTime.value <= 0) {
          clearInterval(interval.value)
        }
      }, 100)
    }
    
    const handleClose = () => {
      clearTimeout(timer.value)
      clearInterval(interval.value)
      emit('close')
    }
    
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        startCountdown()
      } else {
        clearTimeout(timer.value)
        clearInterval(interval.value)
      }
    })
    
    onUnmounted(() => {
      clearTimeout(timer.value)
      clearInterval(interval.value)
    })
    
    return {
      remainingTime,
      progressWidth,
      handleClose
    }
  }
}
</script>

<style scoped>
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
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

.error-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 2px solid #ff4444;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.error-icon {
  margin-bottom: 24px;
  color: #ff4444;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.error-title {
  color: #ff4444;
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 16px 0;
  font-family: 'Poppins Regular', sans-serif;
}

.error-message {
  color: #666;
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.countdown-container {
  margin-bottom: 24px;
}

.countdown-text {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
  font-family: 'Poppins Regular', sans-serif;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #ff4444;
  border-radius: 2px;
  transition: width 0.1s linear;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.error-btn {
  padding: 12px 24px;
  border: 2px solid #ff4444;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Poppins Regular', sans-serif;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
  min-width: 100px;
}

.error-btn.primary {
  background-color: #ff4444;
  color: white;
}

.error-btn.primary:hover {
  background-color: #ff2222;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
}

.error-btn.secondary {
  background-color: white;
  color: #ff4444;
}

.error-btn.secondary:hover {
  background-color: #ff4444;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
}

@media (max-width: 768px) {
  .error-container {
    padding: 24px;
    margin: 20px;
  }
  
  .error-title {
    font-size: 20px;
  }
  
  .error-message {
    font-size: 14px;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .error-btn {
    width: 100%;
  }
}
</style>