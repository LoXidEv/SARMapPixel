<template>
  <div class="pixels-sidebar" :class="{ 'visible': visible }">
    <div class="sidebar-header">
      <h3>{{ $t('sidebarTitle') }}</h3>
      <button class="close-btn" @click="$emit('close')" :title="$t('closeSidebar')">
        ×
      </button>
    </div>
    <div class="pixels-content">
      <div v-if="pixels.length === 0" class="empty-state">
        <p>{{ $t('noPixelsYet') }}</p>
        <p>{{ $t('startDrawing') }}</p>
      </div>
      <div v-else class="pixels-list">
        <div class="pixels-header">
          <span>{{ $t('totalPixels') }}: {{ pixels.length }}</span>
        </div>
        <div class="pixel-item" 
             v-for="(pixel, index) in pixels" 
             :key="index"
        >
          <div class="pixel-info">
            <div class="pixel-position">
              ({{ pixel.x }}, {{ pixel.y }})
            </div>
            <div class="pixel-color" 
                 :style="{ backgroundColor: pixel.color }"
                 :title="pixel.color"
            ></div>
          </div>
          <div class="pixel-actions">
            <button class="action-btn small danger" @click.stop="$emit('delete-pixel', pixel)">
              {{ $t('delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MyPixelsSidebar',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    pixels: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'delete-pixel']
}
</script>

<style scoped>
.pixels-sidebar {
  position: fixed;
  top: 0;
  right: -350px;
  width: 350px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.pixels-sidebar.visible {
  right: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #eee;
  background: var(--theme-color);
  color: white;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.pixels-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-state p {
  margin: 10px 0;
}

.pixels-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 2px solid #eee;
  margin-bottom: 15px;
  font-weight: bold;
  color: var(--theme-color);
}

.pixels-list {
  max-height: 400px;
  overflow-y: auto;
}

.pixel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.pixel-item:hover {
  background-color: #f8f9fa;
  border-color: var(--theme-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pixel-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pixel-position {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #333;
}

.pixel-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid #ddd;
  cursor: pointer;
}

.pixel-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid var(--theme-color);
  background-color: white;
  color: var(--theme-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.action-btn:hover {
  background-color: var(--theme-color);
  color: white;
}

.action-btn.small {
  padding: 4px 8px;
  font-size: 11px;
}

.action-btn.danger {
  border-color: #dc3545;
  color: #dc3545;
}

.action-btn.danger:hover {
  background-color: #dc3545;
  color: white;
}

/* 滚动条样式 */
.pixels-list::-webkit-scrollbar {
  width: 6px;
}

.pixels-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.pixels-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.pixels-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pixels-content {
    max-height: 50vh;
  }
  
  .pixel-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .pixel-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>