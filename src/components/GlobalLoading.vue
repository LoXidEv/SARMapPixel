<template>
  <div class="global-loading">
    <div class="loading-progress" v-if="showProgress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GlobalLoading',
  props: {
    loadingText: {
      type: String,
      default: '正在加载...'
    },
    showProgress: {
      type: Boolean,
      default: false
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    totalTasks: {
      type: Number,
      default: 1
    }
  },
  computed: {
    progressPercent() {
      if (this.totalTasks === 0) return 0
      return Math.round((this.completedTasks / this.totalTasks) * 100)
    }
  }
}
</script>

<style scoped>
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-progress {
  width: 300px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>