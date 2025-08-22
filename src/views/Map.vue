<template>
  <div class="pixel-art-container">
    <transition name="fade">
      <GlobalLoading v-if="globalLoading.show" :loading-text="globalLoading.text"
        :show-progress="globalLoading.showProgress" :completed-tasks="globalLoading.completedTasks"
        :total-tasks="globalLoading.totalTasks" />
    </transition>

    <transition name="fade">
      <div v-if="chunkLoadingProgress.show" class="chunk-loading-overlay">
        <div class="chunk-loading-container">
          <div class="chunk-loading-header">
            <h3>{{ $t('loadingChunks') }}</h3>
            <div class="chunk-loading-progress">
              <div class="progress-bar">
                <div class="progress-fill"
                  :style="{ width: (chunkLoadingProgress.completedChunks / chunkLoadingProgress.totalChunks * 100) + '%' }">
                </div>
              </div>
              <span class="progress-text">{{ chunkLoadingProgress.completedChunks }} / {{
                chunkLoadingProgress.totalChunks }}</span>
            </div>
          </div>
          <div class="chunk-loading-current">
            <span v-if="chunkLoadingProgress.currentChunk">{{ $t('loadingChunk') }}: {{
              chunkLoadingProgress.currentChunk }}</span>
          </div>
        </div>
      </div>
    </transition>

    <LoginModal :visible="showLoginModal" :current-user-id="currentUserId" @close="showLoginModal = false"
      @login="handleLogin" @create-user="handleCreateUser" @show-help="showHelpModal = true" />

    <HelpModal :visible="showHelpModal" @close="closeHelpModal" />

    <ErrorDisplay :visible="errorState.show" :title="errorState.title" :message="errorState.message"
      :show-retry="errorState.showRetry" @retry="handleErrorRetry" @close="clearError" />

    <div class="toolbar">
      <div class="color-palette">
        <div class="color-title">{{ $t('historyColors') }}</div>
        <div class="colors">
          <div v-for="color in colors" :key="color" class="color-item"
            :class="{ active: selectedColor === color, disabled: !currentUserId }" :style="{ backgroundColor: color }"
            @click="currentUserId ? selectColor(color) : null" :title="color"></div>
        </div>
      </div>

      <div class="tools">
        <button class="tool-btn" @click="saveToCloud" :disabled="isAutoSaving || isManualSaving || !currentUserId">
          {{ $t('save') }}
        </button>
        <button class="tool-btn" @click="selectBrush" :class="{ active: !isErasing && !isColorPicking }"
          :disabled="!currentUserId">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
          {{ $t('pencil') }}
        </button>
        <button class="tool-btn" @click="selectEraser" :class="{ active: isErasing }" :disabled="!currentUserId">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l8.49-8.49c.79-.78 2.05-.78 2.84 0l2.1 2.1zm-2.12 10.61l-1.41-1.41L7.76 17.7a1 1 0 0 0 0 1.41l1.41 1.41a1 1 0 0 0 1.41 0l4.95-4.95z" />
          </svg>
          {{ $t('eraser') }}
        </button>
        <button class="tool-btn" @click="selectColorPicker" :class="{ active: isColorPicking }"
          :disabled="!currentUserId">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M20.71 5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.91-1.93 3.12-3.12c.39-.39.39-1.02 0-1.41zM6.92 19H5v-1.92l8.06-8.06 1.92 1.92L6.92 19z" />
          </svg>
          {{ $t('colorPicker') }}
        </button>
        <input type="color" v-model="customColor" @change="selectColor(customColor)" class="color-picker"
          :title="$t('customColor')" :disabled="!currentUserId">
      </div>

      <div class="zoom-controls">
        <button class="tool-btn" @click="zoomIn" :disabled="isLoading">+</button>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <button class="tool-btn" @click="zoomOut" :disabled="isLoading">-</button>
        <button class="tool-btn" @click="resetZoom" :disabled="isLoading">
          {{ $t('reset') }}
        </button>
      </div>

      <div class="user-controls">
        <button class="tool-btn" @click="showLoginModal = true">
          {{ $t('switchUser') }}
        </button>

        <button class="tool-btn" @click="showHelpModal = true">
          {{ $t('help') }}
        </button>

        <button class="tool-btn" @click="showAboutModal = true">
          {{ $t('about') }}
        </button>

        <LanguageSwitcher />
      </div>
    </div>

    <div class="canvas-container" ref="canvasContainer" @contextmenu.prevent @selectstart.prevent @dragstart.prevent>
      <div class="canvas-wrapper" :style="{ transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)` }"
        @mousedown="startPan" @mousemove="handlePan" @mouseup="endPan" @mouseleave="endPan"
        @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd" @contextmenu.prevent
        @selectstart.prevent @dragstart.prevent>
        <canvas ref="canvas" @click="drawPixel" @mousemove="handleMouseMove" @mouseleave="hidePreview"
          @touchstart="handleCanvasTouchStart" @touchmove="handleCanvasTouchMove" @touchend="handleCanvasTouchEnd"
          @contextmenu.prevent @selectstart.prevent @dragstart.prevent
          :style="{ cursor: isPanning ? 'grabbing' : (isColorPicking ? 'copy' : 'crosshair') }"></canvas>
      </div>

      <div v-if="previewPixel.show && !isColorPicking" class="pixel-preview" :style="{
        left: previewPixel.x + 'px',
        top: previewPixel.y + 'px',
        width: (pixelSize * zoomLevel) + 'px',
        height: (pixelSize * zoomLevel) + 'px',
        backgroundColor: selectedColor,
        transform: 'translate(-50%, -50%)'
      }"></div>

      <div v-if="pixelTooltip.show" class="pixel-tooltip" :style="{
        left: pixelTooltip.x + 'px',
        top: pixelTooltip.y + 'px'
      }">
        <div class="tooltip-content">
          <div class="tooltip-position">{{ $t('coordinates') }}: ({{ pixelTooltip.pixelX }}, {{ pixelTooltip.pixelY }})
          </div>
          <div class="tooltip-user" :class="{ 'own-pixel': pixelTooltip.isOwnPixel }">
            {{ pixelTooltip.isOwnPixel ? $t('ownPixel') : $t('userId') + ': ' + pixelTooltip.userId }}
          </div>
        </div>
      </div>
    </div>

    <div class="status-bar">
      <div class="status-item">
        {{ $t('totalPixels') }}: {{ totalPixels }}
      </div>

      <div class="status-item" v-if="lastSaved">
        {{ $t('lastSaved') }}: {{ formatTime(lastSaved) }}
      </div>
    </div>

    <div class="floating-status-indicator" v-if="isLoading">
      <span v-if="isLoading">{{ $t('loading') }}</span>
    </div>

    <div v-if="showExitPrompt" class="modal-overlay" @click="cancelExit">
      <div class="modal-content exit-prompt" @click.stop>
        <h3>{{ $t('unsavedChanges') }}</h3>
        <p>{{ $t('unsavedChangesMessage') }}</p>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="saveAndExit">{{ $t('saveAndExit') }}</button>
          <button class="btn btn-secondary" @click="confirmExit">{{ $t('exitWithoutSaving') }}</button>
          <button class="btn btn-cancel" @click="cancelExit">{{ $t('cancel') }}</button>
        </div>
      </div>
    </div>

    <div v-if="showColorPreview" class="color-preview" :style="{
      left: magnifierPosition.x + 20 + 'px',
      top: magnifierPosition.y - 60 + 'px'
    }">
      <div class="color-preview-swatch" :style="{ backgroundColor: colorPreview }"></div>
      <div class="color-preview-text">{{ colorPreview }}</div>
    </div>

    <div v-if="showMagnifier" class="magnifier" :style="{
      left: magnifierPosition.x - 50 + 'px',
      top: magnifierPosition.y - 50 + 'px'
    }">
      <div class="magnifier-circle">
        <div class="magnifier-crosshair"></div>
      </div>
    </div>

    <AboutModal :visible="showAboutModal" @close="showAboutModal = false" />

    <!-- 底边栏自动保存状态指示器 -->
    <div v-if="isAutoSaving" class="auto-save-indicator">
      <div class="auto-save-content">
        <div class="auto-save-spinner"></div>
        <span class="auto-save-text">{{ $t('autoSaving') || '自动保存中...' }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import AV from 'leancloud-storage'
import LoginModal from '@/components/LoginModal.vue'
import HelpModal from '@/components/HelpModal.vue'
import AboutModal from '@/components/AboutModal.vue'
import GlobalLoading from '@/components/GlobalLoading.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

export default {
  name: 'PixelArtMap',
  components: {
    LoginModal,
    HelpModal,
    AboutModal,
    GlobalLoading,
    ErrorDisplay,
    LanguageSwitcher
  },
  data() {
    return {
      canvas: null,
      ctx: null,
      mapImage: null,
      pixelSize: 16,

      selectedColor: '#FF0000',
      colors: [],
      isColorPickerVisible: false,
      customColor: '#FF0000',
      isErasing: false,
      isColorPicking: false,

      colorPreview: '#000000',
      showColorPreview: false,
      magnifierPosition: { x: 0, y: 0 },
      showMagnifier: false,

      zoomLevel: 1,
      panX: 0,
      panY: 0,
      isPanning: false,
      lastPanPoint: { x: 0, y: 0 },
      panTimer: null,
      panStartTime: null,
      panStartPoint: null,
      panEndTime: null,
      drawingDisabled: false,

      chunk_ABCD_1234: new Map(),
      chunk_ABCD_5678: new Map(),
      chunk_EFGH_1234: new Map(),
      chunk_EFGH_5678: new Map(),
      userAddedPixels: new Map(),

      chunkSize: 200,
      loadedChunks: new Set(),
      chunkErrors: new Map(),
      visibleChunks: new Set(),

      chunkLoadingProgress: {
        show: false,
        currentChunk: '',
        completedChunks: 0,
        totalChunks: 4,
        isLoading: false
      },

      chunkCache: new Map(),
      cacheExpireTime: 5 * 60 * 1000,
      lastCloudRequestTime: 0,

      previewPixel: {
        show: false,
        x: 0,
        y: 0
      },

      pixelTooltip: {
        show: false,
        x: 0,
        y: 0,
        pixelX: 0,
        pixelY: 0,
        userId: '',
        isOwnPixel: false
      },

      isLoading: false,
      lastSaved: null,
      loadingStartTime: null,
      minLoadingDuration: 2000,

      globalLoading: {
        show: true,
        text: '',
        showProgress: true,
        completedTasks: 0,
        totalTasks: 3
      },

      currentUserId: null,
      showLoginModal: true,
      showHelpModal: false,
      showAboutModal: false,

      errorState: {
        show: false,
        title: '',
        message: '',
        showRetry: true,
        retryAction: null
      },

      touchState: {
        isTouching: false,
        lastTouchPoint: null,
        touchStartTime: 0,
        isPanningTouch: false
      },

      showExitPrompt: false,
      hasUnsavedChanges: false,
      isAutoSaving: false,
      isManualSaving: false,
      autoLoadTimer: null,
      autoLoadInterval: 120000,
      userValidationCache: new Map(),
      userValidationCacheTimeout: 300000

    }
  },

  computed: {
    totalPixels() {
      return this.chunk_ABCD_1234.size + this.chunk_ABCD_5678.size +
        this.chunk_EFGH_1234.size + this.chunk_EFGH_5678.size
    },

  },

  async mounted() {
    this.globalLoading.text = this.$t('initializingApp')
    await this.initializeApp()
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown)
    this.$refs.canvasContainer?.removeEventListener('wheel', this.handleWheel)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)

    if (this.autoLoadTimer) {
      clearInterval(this.autoLoadTimer)
    }
  },

  methods: {

    async initializeApp() {
      try {
        this.loadingStartTime = Date.now()

        this.globalLoading.text = this.$t('loadingMap')
        await this.initCanvas()
        this.updateLoadingProgress(1)

        this.globalLoading.text = this.$t('loadingUserData')
        if (!this.currentUserId) {
          await this.checkExistingUser()
        }
        this.loadColorsFromLocal()
        this.updateLoadingProgress(2)

        this.globalLoading.text = this.$t('loadingPixelData')
        if (this.currentUserId) {
          await this.loadPixelData()
        }

        this.updateLoadingProgress(3)
        this.startAutoLoadTimer()

        window.addEventListener('keydown', this.handleKeydown)
        this.$refs.canvasContainer.addEventListener('wheel', this.handleWheel, { passive: false })

        this.globalLoading.text = this.$t('initializationComplete')

        const elapsedTime = Date.now() - this.loadingStartTime
        const remainingTime = Math.max(0, this.minLoadingDuration - elapsedTime)

        setTimeout(() => {
          this.globalLoading.show = false
        }, remainingTime + 500)

      } catch (error) {
        console.error(this.$t('initializationFailed') + ':', error)
        this.globalLoading.show = false
        this.showError(
          this.$t('initializationFailed'),
          error.message || this.$t('initializationFailed'),
          () => this.initializeApp()
        )
      }
    },

    getChunkFromCache(chunkKey) {
      try {
        const cacheKey = `chunk_cache_${chunkKey}`
        const cachedData = localStorage.getItem(cacheKey)

        if (!cachedData) return null

        const cache = JSON.parse(cachedData)
        const cacheTimestamp = cache.cacheTimestamp || cache.timestamp

        if (Date.now() - cacheTimestamp > this.cacheExpireTime) {
          localStorage.removeItem(cacheKey)
          return null
        }

        const chunkData = new Map()
        cache.data.forEach(pixel => {
          const timestamp = pixel.createdAt ? new Date(pixel.createdAt) : new Date(pixel.timestamp)
          chunkData.set(`${pixel.x},${pixel.y}`, {
            x: pixel.x,
            y: pixel.y,
            color: pixel.color,
            userId: pixel.userId,
            timestamp,
            status: 'saved',
            objectId: pixel.objectId,
            createdAt: timestamp,
            updatedAt: pixel.updatedAt ? new Date(pixel.updatedAt) : timestamp
          })
        })

        return chunkData
      } catch (error) {
        console.error(`获取区块 ${chunkKey} 缓存失败:`, error)
        return null
      }
    },

    saveChunkToCache(chunkKey, chunkData, chunkX = null, chunkY = null) {
      try {
        if (!chunkData?.size) return

        if (chunkX === null || chunkY === null) {
          const coords = this.parseChunkKey(chunkKey)
          chunkX = coords.chunkX
          chunkY = coords.chunkY
        }

        const pixelArray = Array.from(chunkData.values()).map(pixel => {
          const timestamp = pixel.timestamp instanceof Date ? pixel.timestamp : new Date(pixel.timestamp)
          return {
            objectId: pixel.objectId || `cache_${pixel.x}_${pixel.y}_${Date.now()}`,
            x: pixel.x,
            y: pixel.y,
            color: pixel.color,
            userId: pixel.userId,
            createdAt: timestamp,
            updatedAt: timestamp,
            timestamp
          }
        })

        const cacheData = {
          chunkKey,
          chunkX,
          chunkY,
          tableName: this.getChunkTableName(chunkX, chunkY),
          data: pixelArray,
          cacheTimestamp: Date.now(),
          dataFormat: 'cloud_compatible',
          version: '2.0'
        }

        localStorage.setItem(`chunk_cache_${chunkKey}`, JSON.stringify(cacheData))
      } catch (error) {
        console.error(`保存区块 ${chunkKey} 到缓存失败:`, error)
      }
    },

    parseChunkKey(chunkKey) {
      const parts = chunkKey.split('_')
      if (parts.length >= 2) {
        const chunkX = parseInt(parts[0])
        const chunkY = parseInt(parts[1])
        return { chunkX, chunkY }
      }
      return { chunkX: 0, chunkY: 0 }
    },

    clearChunkCache(chunkKey) {
      try {
        localStorage.removeItem(`chunk_cache_${chunkKey}`)
      } catch (error) {
        console.error(`清除区块 ${chunkKey} 缓存失败:`, error)
      }
    },

    async refreshChunkCache(chunkKey, chunkX, chunkY) {
      try {
        this.clearChunkCache(chunkKey)
        const tableName = this.getChunkTableName(chunkX, chunkY)
        const ChunkTable = AV.Object.extend(tableName)
        const query = new AV.Query(ChunkTable)

        query.limit(1000)

        const results = await query.find()
        const chunkData = new Map()

        results.forEach(result => {
          const x = result.get('x')
          const y = result.get('y')
          const key = `${x},${y}`

          const pixelData = {
            x,
            y,
            color: result.get('color'),
            userId: result.get('userId'),
            timestamp: result.get('createdAt'),
            status: 'saved',

            objectId: result.id,
            createdAt: result.get('createdAt'),
            updatedAt: result.get('updatedAt')
          }

          chunkData.set(key, pixelData)
        })

        this.saveChunkToCache(chunkKey, chunkData, chunkX, chunkY)
        return chunkData
      } catch (error) {
        console.error(`刷新区块 ${chunkKey} 缓存失败:`, error)
        return null
      }
    },

    async deleteChunkData(chunkKey, chunkX, chunkY) {
      try {

        const tableName = this.getChunkTableName(chunkX, chunkY)
        const ChunkTable = AV.Object.extend(tableName)
        const query = new AV.Query(ChunkTable)

        query.limit(1000)
        const results = await query.find()

        if (results.length > 0) {
          await AV.Object.destroyAll(results)
        }

        this.clearChunkCache(chunkKey)
        this.loadedChunks.delete(chunkKey)
        const chunkVariable = this.getChunkVariable(chunkX, chunkY)

        const bigChunkWidth = Math.ceil((this.canvas?.width || 800) / 2)
        const bigChunkHeight = Math.ceil((this.canvas?.height || 600) / 2)

        const minX = chunkX * bigChunkWidth
        const maxX = Math.min((chunkX + 1) * bigChunkWidth - 1, (this.canvas?.width || 800) - 1)
        const minY = chunkY * bigChunkHeight
        const maxY = Math.min((chunkY + 1) * bigChunkHeight - 1, (this.canvas?.height || 600) - 1)

        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            const pixelKey = `${x},${y}`
            this.userAddedPixels.delete(pixelKey)
          }
        }

        chunkVariable.clear()

        this.drawBackground()
        this.drawAllPixels()
        return true
      } catch (error) {
        console.error(`删除区块 ${chunkKey} 数据失败:`, error)
        return false
      }
    },

    updateLoadingProgress(completedTasks) {
      this.globalLoading.completedTasks = completedTasks
    },

    // 缓存画布尺寸计算
    getCanvasDimensions() {
      if (!this._canvasDimensions || this._lastCanvasWidth !== this.canvas?.width) {
        const canvasWidth = this.canvas?.width || 800
        const canvasHeight = this.canvas?.height || 600
        this._canvasDimensions = {
          width: canvasWidth,
          height: canvasHeight,
          bigChunkWidth: Math.ceil(canvasWidth / 2),
          bigChunkHeight: Math.ceil(canvasHeight / 2)
        }
        this._lastCanvasWidth = canvasWidth
      }
      return this._canvasDimensions
    },

    pixelToChunk(x, y) {
      const { bigChunkWidth, bigChunkHeight } = this.getCanvasDimensions()
      return {
        chunkX: Math.floor(x / bigChunkWidth),
        chunkY: Math.floor(y / bigChunkHeight)
      }
    },

    getChunkKey(chunkX, chunkY) {
      return `${chunkX},${chunkY}`
    },

    // 优化表名获取，使用数组索引
    getChunkTableName(chunkX, chunkY) {
      const tableNames = [
        ['GlobalPixelsABCD1234', 'GlobalPixelsEFGH1234'],
        ['GlobalPixelsABCD5678', 'GlobalPixelsEFGH5678']
      ]
      return tableNames[chunkY & 1][chunkX & 1] // 使用位运算替代模运算
    },

    // 优化区块变量获取，使用数组映射
    getChunkVariable(chunkX, chunkY) {
      const chunkMap = [
        [this.chunk_ABCD_1234, this.chunk_EFGH_1234],
        [this.chunk_ABCD_5678, this.chunk_EFGH_5678]
      ]

      if (chunkX >= 0 && chunkX <= 1 && chunkY >= 0 && chunkY <= 1) {
        return chunkMap[chunkY][chunkX]
      }
      throw new Error(`无效的区块坐标: (${chunkX}, ${chunkY})`)
    },

    getPixelChunkVariable(pixelX, pixelY) {
      const { chunkX, chunkY } = this.pixelToChunk(pixelX, pixelY)
      return this.getChunkVariable(chunkX, chunkY)
    },

    getVisibleChunks() {
      if (!this.canvas) return []

      const viewportLeft = -this.panX / this.zoomLevel
      const viewportTop = -this.panY / this.zoomLevel
      const viewportRight = viewportLeft + (window.innerWidth / this.zoomLevel)
      const viewportBottom = viewportTop + (window.innerHeight / this.zoomLevel)

      const startChunkX = Math.max(0, Math.floor(viewportLeft / this.chunkSize))
      const endChunkX = Math.ceil(viewportRight / this.chunkSize)
      const startChunkY = Math.max(0, Math.floor(viewportTop / this.chunkSize))
      const endChunkY = Math.ceil(viewportBottom / this.chunkSize)
      const maxChunkX = Math.ceil(this.canvas.width / this.chunkSize)
      const maxChunkY = Math.ceil(this.canvas.height / this.chunkSize)

      const visibleChunks = []
      for (let chunkX = startChunkX; chunkX < Math.min(endChunkX, maxChunkX); chunkX++) {
        for (let chunkY = startChunkY; chunkY < Math.min(endChunkY, maxChunkY); chunkY++) {
          const chunkKey = this.getChunkKey(chunkX, chunkY)
          const tableName = this.getChunkTableName(chunkX, chunkY)
          visibleChunks.push({ chunkX, chunkY, chunkKey, tableName })
        }
      }

      return visibleChunks
    },

    async loadPixelData() {
      try {

        this.chunk_ABCD_1234.clear()
        this.chunk_ABCD_5678.clear()
        this.chunk_EFGH_1234.clear()
        this.chunk_EFGH_5678.clear()
        this.userAddedPixels.clear()
        this.loadedChunks.clear()
        this.chunkErrors = new Map()

        await this.loadAllChunksSequentially()

      } catch (error) {
        console.error(this.$t('loadPixelDataFailed') + ':', error)
      }
    },

    async loadAllChunksSequentially() {

      const chunks = [
        { name: 'ABCD1234', chunkX: 0, chunkY: 0, tableName: 'GlobalPixelsABCD1234' },
        { name: 'EFGH1234', chunkX: 1, chunkY: 0, tableName: 'GlobalPixelsEFGH1234' },
        { name: 'ABCD5678', chunkX: 0, chunkY: 1, tableName: 'GlobalPixelsABCD5678' },
        { name: 'EFGH5678', chunkX: 1, chunkY: 1, tableName: 'GlobalPixelsEFGH5678' }
      ]

      this.chunkLoadingProgress.show = true
      this.chunkLoadingProgress.isLoading = true
      this.chunkLoadingProgress.completedChunks = 0
      this.chunkLoadingProgress.totalChunks = chunks.length
      this.chunkLoadingProgress.currentChunk = ''

      for (let i = 0; i < chunks.length; i++) {
        const { name, chunkX, chunkY } = chunks[i]
        const chunkKey = `${chunkX},${chunkY}`
        const tableName = this.getChunkTableName(chunkX, chunkY)

        this.chunkLoadingProgress.currentChunk = name

        const chunk = {
          chunkX,
          chunkY,
          chunkKey,
          tableName
        }

        try {

          const cachedData = this.getChunkFromCache(chunkKey)
          const now = Date.now()
          const shouldRequestCloud = !cachedData || (now - this.lastCloudRequestTime > this.cacheExpireTime)

          if (cachedData && !shouldRequestCloud) {

            const chunkVariable = this.getChunkVariable(chunkX, chunkY)
            chunkVariable.clear()
            cachedData.forEach((pixel, key) => {
              chunkVariable.set(key, pixel)
            })
          } else {
            if (cachedData && shouldRequestCloud) {

            } else {

            }

            await this.loadSingleChunk(chunk)

            this.lastCloudRequestTime = now

            const chunkVariable = this.getChunkVariable(chunkX, chunkY)
            this.saveChunkToCache(chunkKey, chunkVariable, chunkX, chunkY)
          }

          this.loadLocalDraftForChunk(chunkX, chunkY)

          this.drawChunk(chunkX, chunkY)
        } catch (error) {
          console.error(`区块 ${name} 加载失败:`, error)
          this.chunkErrors.set(chunkKey, error.message || '加载失败')

          this.showError(
            this.$t('loadFailed'),
            `区块 ${name} 加载失败: ${error.message || '网络连接错误'}`,
            null
          )

          this.loadLocalDraftForChunk(chunkX, chunkY)

          this.drawChunkError(chunkX, chunkY, name)
        }

        this.chunkLoadingProgress.completedChunks++

        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      this.chunkLoadingProgress.show = false
      this.chunkLoadingProgress.isLoading = false
      this.chunkLoadingProgress.currentChunk = ''
    },

    getPixelChunkKey(x, y) {
      const canvasWidth = this.canvas?.width || 800
      const canvasHeight = this.canvas?.height || 600

      const bigChunkWidth = Math.ceil(canvasWidth / 2)
      const bigChunkHeight = Math.ceil(canvasHeight / 2)

      const chunkX = Math.floor(x / bigChunkWidth)
      const chunkY = Math.floor(y / bigChunkHeight)

      return `${chunkX},${chunkY}`
    },

    loadLocalDraftForChunk(chunkX, chunkY) {
      try {
        const chunkKey = `${chunkX},${chunkY}`
        const draftKey = `pixelArtDraft_${chunkKey}`
        const draftData = localStorage.getItem(draftKey)

        if (!draftData) {
          this.loadLegacyDraftForChunk(chunkX, chunkY)
          return
        }

        const draft = JSON.parse(draftData)
        if (draft.userId !== this.currentUserId) {
          return
        }

        let loadedCount = 0

        draft.pixels.forEach(pixel => {
          const pixelInfo = {
            x: pixel.x,
            y: pixel.y,
            color: pixel.color,
            userId: this.currentUserId,
            timestamp: new Date(pixel.timestamp),
            status: 'cached',

            objectId: `draft_${pixel.key}`,
            createdAt: new Date(pixel.timestamp),
            updatedAt: new Date(pixel.timestamp)
          }

          this.userAddedPixels.set(pixel.key, pixelInfo)

          const chunkVariable = this.getChunkVariable(chunkX, chunkY)
          chunkVariable.set(pixel.key, pixelInfo)

          loadedCount++
        })

        if (loadedCount > 0) {

          this.hasUnsavedChanges = true
        }
      } catch (error) {
        console.error(`加载区块 ${chunkX},${chunkY} 的本地草稿失败:`, error)
      }
    },

    loadLegacyDraftForChunk(chunkX, chunkY) {
      try {
        const draftData = localStorage.getItem('pixelArtDraft')
        if (!draftData) return

        const draft = JSON.parse(draftData)
        if (draft.userId !== this.currentUserId) {
          return
        }

        const canvasWidth = this.canvas?.width || 800
        const canvasHeight = this.canvas?.height || 600

        const bigChunkWidth = Math.ceil(canvasWidth / 2)
        const bigChunkHeight = Math.ceil(canvasHeight / 2)

        const minX = chunkX * bigChunkWidth
        const maxX = Math.min((chunkX + 1) * bigChunkWidth - 1, canvasWidth - 1)
        const minY = chunkY * bigChunkHeight
        const maxY = Math.min((chunkY + 1) * bigChunkHeight - 1, canvasHeight - 1)

        let loadedCount = 0
        const chunkKey = `${chunkX},${chunkY}`

        draft.pixels.forEach(pixel => {
          if (pixel.x >= minX && pixel.x <= maxX &&
            pixel.y >= minY && pixel.y <= maxY) {

            const pixelInfo = {
              x: pixel.x,
              y: pixel.y,
              color: pixel.color,
              userId: this.currentUserId,
              timestamp: new Date(pixel.timestamp),
              status: 'cached',

              objectId: `draft_${pixel.key}`,
              createdAt: new Date(pixel.timestamp),
              updatedAt: new Date(pixel.timestamp)
            }

            this.userAddedPixels.set(pixel.key, pixelInfo)

            const chunkVariable = this.getChunkVariable(chunkX, chunkY)
            chunkVariable.set(pixel.key, pixelInfo)

            loadedCount++
          }
        })

        if (loadedCount > 0) {

          this.hasUnsavedChanges = true
        }
      } catch (error) {
        console.error(`加载区块 ${chunkX},${chunkY} 的本地草稿失败:`, error)
      }
    },

    async loadChunks(chunks) {
      const loadPromises = chunks.map(chunk => this.loadSingleChunk(chunk))
      await Promise.all(loadPromises)
    },

    async loadSingleChunk(chunk) {
      const { chunkX, chunkY, chunkKey, tableName } = chunk

      if (this.loadedChunks.has(chunkKey)) {
        return
      }

      try {

        const ChunkTable = AV.Object.extend(tableName)
        const query = new AV.Query(ChunkTable)

        const canvasWidth = this.canvas?.width || 800
        const canvasHeight = this.canvas?.height || 600

        const bigChunkWidth = Math.ceil(canvasWidth / 2)
        const bigChunkHeight = Math.ceil(canvasHeight / 2)

        const minX = chunkX * bigChunkWidth
        const maxX = Math.min((chunkX + 1) * bigChunkWidth - 1, canvasWidth - 1)
        const minY = chunkY * bigChunkHeight
        const maxY = Math.min((chunkY + 1) * bigChunkHeight - 1, canvasHeight - 1)

        query.greaterThanOrEqualTo('x', minX)
        query.lessThanOrEqualTo('x', maxX)
        query.greaterThanOrEqualTo('y', minY)
        query.lessThanOrEqualTo('y', maxY)

        query.limit(1000)

        const results = await query.find()

        const chunkVariable = this.getChunkVariable(chunkX, chunkY)

        chunkVariable.clear()

        results.forEach(result => {
          const x = result.get('x')
          const y = result.get('y')
          const pixelKey = `${x},${y}`

          const pixelData = {
            x,
            y,
            color: result.get('color'),
            userId: result.get('userId'),
            timestamp: result.get('createdAt'),
            status: 'saved',

            objectId: result.id,
            createdAt: result.get('createdAt'),
            updatedAt: result.get('updatedAt')
          }

          chunkVariable.set(pixelKey, pixelData)
        })

        this.loadedChunks.add(chunkKey)

        this.saveChunkToCache(chunkKey, chunkVariable, chunkX, chunkY)

      } catch (error) {
        console.error(`加载区块 ${chunkKey} (${tableName}) 失败:`, error)

        throw error
      }
    },

    async initCanvas() {
      this.canvas = this.$refs.canvas
      this.ctx = this.canvas.getContext('2d')

      return new Promise((resolve, reject) => {
        this.mapImage = new Image()
        this.mapImage.onload = () => {
          try {

            this.canvas.width = this.mapImage.width
            this.canvas.height = this.mapImage.height

            this.drawBackground()

            resolve()
          } catch (error) {
            reject(error)
          }
        }

        this.mapImage.onerror = () => {
          console.error('Failed to load map image')

          this.canvas.width = 800
          this.canvas.height = 600
          this.ctx.fillStyle = '#f0f0f0'
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
          resolve()
        }

        this.mapImage.src = '/img/Map.webp'
      })
    },

    drawBackground() {
      if (this.mapImage?.complete) {
        this.ctx.globalAlpha = 1.0
        this.ctx.drawImage(this.mapImage, 0, 0)
      }
    },

    drawAllPixels() {
      const chunkVariables = [
        this.chunk_ABCD_1234,
        this.chunk_ABCD_5678,
        this.chunk_EFGH_1234,
        this.chunk_EFGH_5678
      ]

      const cachedPixels = []
      const savedPixels = []

      chunkVariables.forEach(chunkVariable => {
        chunkVariable.forEach((pixelInfo, key) => {
          const [x, y] = key.split(',').map(Number)
          const color = typeof pixelInfo === 'string' ? pixelInfo : pixelInfo.color
          const status = typeof pixelInfo === 'object' ? pixelInfo.status : 'saved'

          const pixel = { x, y, color }
          if (status === 'cached') {
            cachedPixels.push(pixel)
          } else {
            savedPixels.push(pixel)
          }
        })
      })

      this.ctx.globalAlpha = 1.0
      savedPixels.forEach(({ x, y, color }) => {
        this.ctx.fillStyle = color
        this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize)
      })

      this.ctx.globalAlpha = 0.5
      cachedPixels.forEach(({ x, y, color }) => {
        this.ctx.fillStyle = color
        this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize)
      })

      this.ctx.globalAlpha = 1.0
    },

    drawSinglePixel(x, y, color, status = 'saved') {
      this.ctx.globalAlpha = status === 'cached' ? 0.5 : 1.0
      this.ctx.fillStyle = color
      this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize)
      this.ctx.globalAlpha = 1.0
    },

    drawChunk(chunkX, chunkY) {
      const chunkVariable = this.getChunkVariable(chunkX, chunkY)
      if (!chunkVariable?.size) return

      const cachedPixels = []
      const savedPixels = []

      chunkVariable.forEach((pixelInfo, pixelKey) => {
        const [x, y] = pixelKey.split(',').map(Number)
        const pixel = { x, y, color: pixelInfo.color }

        if (pixelInfo.status === 'cached') {
          cachedPixels.push(pixel)
        } else {
          savedPixels.push(pixel)
        }
      })

      this.ctx.globalAlpha = 1.0
      savedPixels.forEach(({ x, y, color }) => {
        this.ctx.fillStyle = color
        this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize)
      })

      this.ctx.globalAlpha = 0.5
      cachedPixels.forEach(({ x, y, color }) => {
        this.ctx.fillStyle = color
        this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize)
      })

      this.ctx.globalAlpha = 1.0
    },

    drawChunkError(chunkX, chunkY, chunkName) {

      const canvasWidth = this.canvas?.width || 800
      const canvasHeight = this.canvas?.height || 600

      const bigChunkWidth = Math.ceil(canvasWidth / 2)
      const bigChunkHeight = Math.ceil(canvasHeight / 2)

      const startX = chunkX * bigChunkWidth
      const startY = chunkY * bigChunkHeight
      const chunkWidth = Math.min(bigChunkWidth, canvasWidth - startX)
      const chunkHeight = Math.min(bigChunkHeight, canvasHeight - startY)

      this.ctx.globalAlpha = 0.3
      this.ctx.fillStyle = '#ff0000'
      this.ctx.fillRect(startX, startY, chunkWidth, chunkHeight)

      this.ctx.globalAlpha = 1.0
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'

      const centerX = startX + chunkWidth / 2
      const centerY = startY + chunkHeight / 2

      this.ctx.fillText('加载失败', centerX, centerY - 6)
      this.ctx.fillText(chunkName, centerX, centerY + 6)

      this.ctx.globalAlpha = 1.0
      this.ctx.textAlign = 'start'
      this.ctx.textBaseline = 'alphabetic'
    },

    selectColor(color) {
      if (!this.isErasing) {
        this.selectedColor = color
        this.customColor = color

        if (!this.colors.includes(color)) {
          this.colors.unshift(color)
          if (this.colors.length > 10) {
            this.colors.pop()
          }
          this.saveColorsToLocal()
        }
      }
    },

    saveColorsToLocal() {
      localStorage.setItem('pixelArtColors', JSON.stringify(this.colors))
    },

    loadColorsFromLocal() {
      const savedColors = localStorage.getItem('pixelArtColors')
      if (savedColors) {
        this.colors = JSON.parse(savedColors)
      }
    },

    selectBrush() {
      if (this.isErasing) {
        this.isErasing = false
        this.selectedColor = this.previousColor
      }
      this.isColorPicking = false
    },

    selectEraser() {
      if (!this.isErasing) {
        this.isErasing = true
        this.isColorPicking = false
        this.previousColor = this.selectedColor
      }
    },

    async selectColorPicker() {

      if ('EyeDropper' in window) {
        try {
          const eyeDropper = new EyeDropper()
          const result = await eyeDropper.open()

          this.selectColor(result.sRGBHex)

          this.isColorPicking = false
          this.isErasing = false
          this.hidePreview()
          return
        } catch (error) {
          console.log('EyeDropper cancelled or failed:', error)
        }
      }

      const wasColorPicking = this.isColorPicking
      this.isColorPicking = !this.isColorPicking
      this.isErasing = false

      if (wasColorPicking) {
        this.hidePreview()
      }
    },

    // 提取公共的坐标计算逻辑
    getPixelCoordinates(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      const x = Math.floor((clientX - rect.left) * scaleX / this.pixelSize) * this.pixelSize
      const y = Math.floor((clientY - rect.top) * scaleY / this.pixelSize) * this.pixelSize
      return { x, y, rect, scaleX, scaleY }
    },

    // 统一的像素绘制逻辑
    performPixelAction(x, y) {
      if (!this.currentUserId) {
        this.showLoginModal = true
        return
      }

      if (this.drawingDisabled || this.isPanning || this.isLoading) return
      if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) return

      const key = `${x},${y}`
      const chunkVariable = this.getPixelChunkVariable(x, y)
      const existingPixel = chunkVariable.get(key)

      if (this.isColorPicking) {
        const color = existingPixel?.color || this.getPixelColorFromCanvas(x, y)
        this.selectColor(color)
        this.isColorPicking = false
      } else if (this.isErasing) {
        if (existingPixel?.userId === this.currentUserId) {
          chunkVariable.delete(key)
          this.userAddedPixels.delete(key)
          this.redrawPixelArea(x, y)
          this.hasUnsavedChanges = this.userAddedPixels.size > 0
          this.autoSaveDraft()
        }
      } else {
        this.addPixel(x, y, chunkVariable, existingPixel)
      }
    },

    // 提取颜色获取逻辑
    getPixelColorFromCanvas(x, y) {
      const imageData = this.ctx.getImageData(x, y, 1, 1)
      const data = imageData.data
      return `#${((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1)}`
    },

    // 提取重绘逻辑
    redrawPixelArea(x, y) {
      this.ctx.clearRect(x, y, this.pixelSize, this.pixelSize)
      this.drawBackground()
      this.drawAllPixels()
    },

    // 提取添加像素逻辑
    addPixel(x, y, chunkVariable, existingPixel) {
      if (existingPixel?.status === 'cached' && existingPixel.userId === this.currentUserId) {
        this.ctx.clearRect(x, y, this.pixelSize, this.pixelSize)
        this.ctx.globalAlpha = 1.0
        if (this.mapImage?.complete) {
          this.ctx.drawImage(this.mapImage, x, y, this.pixelSize, this.pixelSize, x, y, this.pixelSize, this.pixelSize)
        }
      }

      const pixelInfo = {
        x, y,
        color: this.selectedColor,
        userId: this.currentUserId,
        timestamp: new Date(),
        status: 'cached',
        objectId: null,
        createdAt: null,
        updatedAt: null
      }

      chunkVariable.set(`${x},${y}`, pixelInfo)
      this.userAddedPixels.set(`${x},${y}`, pixelInfo)
      this.drawSinglePixel(x, y, this.selectedColor, 'cached')
      this.hasUnsavedChanges = true
      this.autoSaveDraft()
    },

    drawPixel(event) {
      const { x, y } = this.getPixelCoordinates(event.clientX, event.clientY)
      this.performPixelAction(x, y)
    },

    // 统一的预览更新逻辑
    updatePreview(clientX, clientY, isTouch = false) {
      const { x, y } = this.getPixelCoordinates(clientX, clientY)

      if (x >= 0 && y >= 0 && x < this.canvas.width && y < this.canvas.height) {
        if (this.isColorPicking) {
          this.magnifierPosition = { x: clientX, y: clientY }
          this.showMagnifier = true

          const chunkVariable = this.getPixelChunkVariable(x, y)
          const existingPixel = chunkVariable.get(`${x},${y}`)
          this.colorPreview = existingPixel?.color || this.getPixelColorFromCanvas(x, y)
          this.showColorPreview = true
          this.previewPixel.show = false
          this.pixelTooltip.show = false
        } else {
          this.previewPixel = {
            show: true,
            x: clientX,
            y: clientY
          }

          const chunkVariable = this.getPixelChunkVariable(x, y)
          const pixelInfo = chunkVariable.get(`${x},${y}`)

          if (pixelInfo) {
            this.pixelTooltip = {
              show: true,
              x: clientX + (isTouch ? 10 : 15),
              y: clientY + (isTouch ? -30 : 15),
              pixelX: x,
              pixelY: y,
              userId: pixelInfo.userId,
              isOwnPixel: pixelInfo.userId === this.currentUserId
            }
          } else {
            this.pixelTooltip.show = false
          }
        }
      } else {
        this.hidePreview()
      }
    },

    handleMouseMove(event) {
      if (this.isPanning || this.isLoading) {
        this.hidePreview()
        return
      }
      this.updatePreview(event.clientX, event.clientY)
    },

    hidePreview() {
      this.previewPixel.show = false
      this.pixelTooltip.show = false
      this.showColorPreview = false
      this.showMagnifier = false
    },

    startPan(event) {
      if (event.button === 0) {

        this.panStartTime = Date.now()
        this.panStartPoint = { x: event.clientX, y: event.clientY }
        this.panTimer = setTimeout(() => {

          this.isPanning = true
          this.lastPanPoint = { x: event.clientX, y: event.clientY }
        }, 500)
        event.preventDefault()
      }
    },

    handlePan(event) {
      if (this.isPanning) {
        const deltaX = event.clientX - this.lastPanPoint.x
        const deltaY = event.clientY - this.lastPanPoint.y

        this.panX += deltaX / this.zoomLevel
        this.panY += deltaY / this.zoomLevel

        this.lastPanPoint = { x: event.clientX, y: event.clientY }

        event.preventDefault()
      }
    },

    endPan(event) {

      if (this.panTimer) {
        clearTimeout(this.panTimer)
        this.panTimer = null
      }

      if (this.isPanning) {
        this.panEndTime = Date.now()
        this.drawingDisabled = true
        setTimeout(() => {
          this.drawingDisabled = false
        }, 500)
      }

      if (!this.isPanning && this.panStartTime) {
        const clickDuration = Date.now() - this.panStartTime
        if (clickDuration < 500 && event) {

          this.drawPixel(event)
        }
      }

      this.isPanning = false
      this.panStartTime = null
      this.panStartPoint = null
    },

    zoomIn() {
      this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5)

    },

    zoomOut() {
      this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.1)

    },

    resetZoom() {
      this.zoomLevel = 1
      this.panX = 0
      this.panY = 0

    },

    handleWheel(event) {
      event.preventDefault()

      const delta = event.deltaY > 0 ? 0.9 : 1.1
      this.zoomLevel = Math.max(0.1, Math.min(5, this.zoomLevel * delta))

    },

    handleKeydown(event) {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '=':
          case '+':
            event.preventDefault()
            this.zoomIn()
            break
          case '-':
            event.preventDefault()
            this.zoomOut()
            break
          case '0':
            event.preventDefault()
            this.resetZoom()
            break
          case 's':
            event.preventDefault()
            this.saveToCloud()
            break
        }
      }
    },

    async checkExistingUser() {
      const savedUserId = localStorage.getItem('pixelArtUserId')
      if (savedUserId) {
        try {

          const userExists = await this.validateUser(savedUserId)
          if (userExists) {
            this.currentUserId = savedUserId
            this.showLoginModal = false

            await this.updateUserLastLogin(savedUserId)
          } else {

            localStorage.removeItem('pixelArtUserId')
            this.showLoginModal = true
          }
        } catch (error) {
          console.error(this.$t('checkUserFailed') + ':', error)

          this.showLoginModal = true
        }
      } else {

        this.showLoginModal = true
      }
    },

    generateUserId() {
      return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    },

    async setLoadingState(isLoading) {
      if (isLoading) {
        this.loadingStartTime = Date.now()
        this.isLoading = true
      } else {
        if (this.loadingStartTime) {
          const elapsedTime = Date.now() - this.loadingStartTime
          const remainingTime = Math.max(0, this.minLoadingDuration - elapsedTime)

          if (remainingTime > 0) {
            setTimeout(() => {

              const statusIndicator = document.querySelector('.floating-status-indicator')
              if (statusIndicator) {
                statusIndicator.classList.add('fade-out')
                setTimeout(() => {
                  this.isLoading = false
                  statusIndicator.classList.remove('fade-out')
                }, 300)
              } else {
                this.isLoading = false
              }
            }, remainingTime)
          } else {

            const statusIndicator = document.querySelector('.floating-status-indicator')
            if (statusIndicator) {
              statusIndicator.classList.add('fade-out')
              setTimeout(() => {
                this.isLoading = false
                statusIndicator.classList.remove('fade-out')
              }, 300)
            } else {
              this.isLoading = false
            }
          }
        } else {
          this.isLoading = false
        }
      }
    },

    async handleLogin(userId) {
      try {

        if (!userId.startsWith('user_')) {
          this.showError(
            this.$t('loginFailed'),
            this.$t('userIdPrefixRequired'),
            null
          )
          return
        }

        await this.setLoadingState(true)

        const userExists = await this.validateUser(userId)
        if (!userExists) {

          await this.createUserRecord(userId)
        }

        this.currentUserId = userId
        localStorage.setItem('pixelArtUserId', userId)
        this.showLoginModal = false

        await this.updateUserLastLogin(userId)

        this.globalLoading.show = true
        this.globalLoading.text = this.$t('initializingApp')
        this.globalLoading.showProgress = true
        this.globalLoading.completedTasks = 0
        this.globalLoading.totalTasks = 3

        await this.initializeApp()
      } catch (error) {
        console.error(this.$t('loginFailed') + ':', error)
        this.showError(
          this.$t('loginFailed'),
          error.message || this.$t('loginFailed'),
          () => this.handleLogin(userId)
        )
      } finally {
        await this.setLoadingState(false)
      }
    },

    async handleCreateUser(userId) {
      try {

        if (!userId.startsWith('user_')) {
          this.showError(
            this.$t('createUserFailed'),
            this.$t('userIdPrefixRequired'),
            null
          )
          return
        }

        await this.setLoadingState(true)

        const userExists = await this.validateUser(userId)
        if (userExists) {
          this.showError(
            this.$t('userIdExists'),
            this.$t('userIdExists'),
            null
          )
          return
        }

        await this.createUserRecord(userId)

        this.currentUserId = userId
        localStorage.setItem('pixelArtUserId', userId)
        this.showLoginModal = false

        this.globalLoading.show = true
        this.globalLoading.text = this.$t('initializingApp')
        this.globalLoading.showProgress = true
        this.globalLoading.completedTasks = 0
        this.globalLoading.totalTasks = 3

        await this.initializeApp()
      } catch (error) {
        console.error(this.$t('createUserFailed') + ':', error)
        this.showError(
          this.$t('createUserFailed'),
          error.message || this.$t('createUserFailed'),
          () => this.handleCreateUser(userId)
        )
      } finally {
        await this.setLoadingState(false)
      }
    },

    closeHelpModal() {
      this.showHelpModal = false
    },

    async saveToCloud() {
      if (this.isLoading || this.isManualSaving) return

      this.isManualSaving = true
      await this.setLoadingState(true)

      try {

        if (this.userAddedPixels.size === 0) {

          this.showError(
            this.$t('save'),
            this.$t('noNewPixelsToSave'),
            null
          )
          this.hasUnsavedChanges = false
          return
        }

        const chunkGroups = new Map()

        for (const [pixelKey, pixelInfo] of this.userAddedPixels) {
          const [x, y] = pixelKey.split(',').map(Number)
          const { chunkX, chunkY } = this.pixelToChunk(x, y)
          const chunkKey = this.getChunkKey(chunkX, chunkY)
          const tableName = this.getChunkTableName(chunkX, chunkY)

          if (!chunkGroups.has(chunkKey)) {
            chunkGroups.set(chunkKey, {
              tableName,
              chunkX,
              chunkY,
              pixels: new Map()
            })
          }

          chunkGroups.get(chunkKey).pixels.set(pixelKey, pixelInfo)
        }

        let totalSavedCount = 0
        let totalSkippedCount = 0

        const chunkArray = Array.from(chunkGroups.entries())
        for (let i = 0; i < chunkArray.length; i++) {
          const [chunkKey, chunkGroup] = chunkArray[i]

          try {
            const { savedCount, skippedCount } = await this.saveChunkData(chunkGroup)
            totalSavedCount += savedCount
            totalSkippedCount += skippedCount

          } catch (error) {
            console.error(`区块 ${chunkKey} 保存失败:`, error)
            throw error
          }

          if (i < chunkArray.length - 1) {

            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        for (const [key, pixelInfo] of this.userAddedPixels) {
          pixelInfo.status = 'saved'

          const [x, y] = key.split(',').map(Number)
          const chunkVariable = this.getPixelChunkVariable(x, y)
          const mainPixelInfo = chunkVariable.get(key)
          if (mainPixelInfo) {
            mainPixelInfo.status = 'saved'
          }
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.drawBackground()

        this.drawAllPixels()

        this.userAddedPixels.clear()

        this.clearLocalDraft()

        for (let i = 0; i < chunkArray.length; i++) {
          const [chunkKey, chunkGroup] = chunkArray[i]

          try {
            await this.refreshChunkCache(chunkKey, chunkGroup.chunkX, chunkGroup.chunkY)

          } catch (error) {
            console.error(`刷新区块 ${chunkKey} 缓存失败:`, error)
          }

          if (i < chunkArray.length - 1) {

            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        this.lastSaved = new Date()
        this.hasUnsavedChanges = false

      } catch (error) {
        console.error(this.$t('saveFailed') + ':', error)
        this.showError(
          this.$t('saveFailed'),
          error.message || this.$t('saveFailed'),
          () => this.saveToCloud()
        )
      } finally {
        await this.setLoadingState(false)
        this.isManualSaving = false
      }
    },

    checkAndLoadNewChunks() {
      const currentVisibleChunks = this.getVisibleChunks()
      const newChunks = currentVisibleChunks.filter(chunk =>
        !this.loadedChunks.has(chunk.chunkKey)
      )

      if (newChunks.length > 0) {
        this.loadChunks(newChunks)
      }

      this.visibleChunks = new Set(currentVisibleChunks.map(chunk => chunk.chunkKey))
    },

    async saveChunkData(chunkGroup) {
      const { tableName, pixels } = chunkGroup
      const ChunkTable = AV.Object.extend(tableName)

      if (pixels.size === 0) return { savedCount: 0, skippedCount: 0 }

      // 批量查询现有像素，优化查询性能
      const coordinates = Array.from(pixels.keys(), key => {
        const [x, y] = key.split(',').map(Number)
        return { x, y, key }
      })

      const existingPixelsMap = new Map()

      // 分批查询以避免查询限制
      const batchSize = 100
      for (let i = 0; i < coordinates.length; i += batchSize) {
        const batch = coordinates.slice(i, i + batchSize)
        const orQueries = batch.map(coord => {
          const query = new AV.Query(tableName)
          query.equalTo('x', coord.x)
          query.equalTo('y', coord.y)
          return query
        })

        if (orQueries.length > 0) {
          const compoundQuery = AV.Query.or(...orQueries)
          compoundQuery.limit(1000)
          const existingPixels = await compoundQuery.find()

          existingPixels.forEach(pixel => {
            const key = `${pixel.get('x')},${pixel.get('y')}`
            existingPixelsMap.set(key, pixel)
          })
        }
      }

      const objectsToSave = []
      let savedCount = 0
      let skippedCount = 0

      // 优化像素处理逻辑
      for (const [key, pixelInfo] of pixels) {
        const existingPixel = existingPixelsMap.get(key)

        if (existingPixel) {
          if (pixelInfo.timestamp > existingPixel.get('timestamp')) {
            existingPixel.set({
              color: pixelInfo.color,
              userId: pixelInfo.userId,
              timestamp: pixelInfo.timestamp
            })
            objectsToSave.push(existingPixel)
            savedCount++
          } else {
            skippedCount++
          }
        } else {
          const [x, y] = key.split(',').map(Number)
          const pixelRecord = new ChunkTable()
          pixelRecord.set({
            x, y,
            color: pixelInfo.color,
            userId: pixelInfo.userId,
            timestamp: pixelInfo.timestamp
          })
          objectsToSave.push(pixelRecord)
          savedCount++
        }
      }

      // 批量保存
      if (objectsToSave.length > 0) {
        await AV.Object.saveAll(objectsToSave)
      }

      return { savedCount, skippedCount }
    },

    async loadFromCloud() {
      if (this.isLoading) return

      await this.setLoadingState(true)

      try {

        await this.loadPixelData()

      } catch (error) {
        console.error(this.$t('loadFailed') + ':', error)
        this.showError(
          this.$t('loadFailed'),
          error.message || this.$t('loadFailed'),
          () => this.loadFromCloud()
        )
      } finally {
        await this.setLoadingState(false)
      }
    },

    async autoLoadFromCloud() {
      try {

        const localDraftPixels = new Map(this.userAddedPixels)
        let totalProcessedPixels = 0

        for (let chunkY = 0; chunkY < 2; chunkY++) {
          for (let chunkX = 0; chunkX < 2; chunkX++) {
            const chunkKey = this.getChunkKey(chunkX, chunkY)

            try {

              const chunkData = await this.refreshChunkCache(chunkKey, chunkX, chunkY)

              if (chunkData) {

                chunkData.forEach((cloudPixelInfo, pixelKey) => {
                  const localPixel = localDraftPixels.get(pixelKey)

                  if (localPixel && localPixel.status === 'cached') {

                    if (cloudPixelInfo.timestamp > localPixel.timestamp) {
                      this.pixelData.set(pixelKey, cloudPixelInfo)
                      this.userAddedPixels.delete(pixelKey)

                    } else {

                      this.pixelData.set(pixelKey, localPixel)
                    }
                  } else {

                    this.pixelData.set(pixelKey, cloudPixelInfo)
                  }

                  totalProcessedPixels++
                })
              }
            } catch (error) {
              console.error(`自动加载区块 ${chunkKey} 失败:`, error)
            }
          }
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.drawBackground()
        this.drawAllPixels()

      } catch (error) {
        console.error('自动加载失败:', error)

      }
    },

    formatTime(date) {
      if (!date) return ''
      return date.toLocaleTimeString()
    },

    async validateUser(userId) {
      try {

        const cached = this.userValidationCache.get(userId)
        if (cached && (Date.now() - cached.timestamp) < this.userValidationCacheTimeout) {

          return cached.exists
        }

        const Users = AV.Object.extend('Users')
        const query = new AV.Query(Users)
        query.equalTo('userId', userId)
        const user = await query.first()
        const exists = !!user

        this.userValidationCache.set(userId, {
          exists: exists,
          timestamp: Date.now()
        })

        return exists
      } catch (error) {
        console.error(this.$t('validateUserFailed') + ':', error)
        return false
      }
    },

    async createUserRecord(userId) {
      try {
        const Users = AV.Object.extend('Users')
        const user = new Users()
        user.set('userId', userId)
        user.set('lastLoginAt', new Date())
        await user.save()

        this.userValidationCache.set(userId, {
          exists: true,
          timestamp: Date.now()
        })

      } catch (error) {
        console.error(this.$t('createUserRecordFailed') + ':', error)
        throw error
      }
    },

    clearUserValidationCache(userId = null) {
      if (userId) {
        this.userValidationCache.delete(userId)

      } else {
        this.userValidationCache.clear()

      }
    },

    async updateUserLastLogin(userId) {
      try {
        const Users = AV.Object.extend('Users')
        const query = new AV.Query(Users)
        query.equalTo('userId', userId)
        const user = await query.first()
        if (user) {
          user.set('lastLoginAt', new Date())
          await user.save()
        }
      } catch (error) {
        console.error(this.$t('updateUserLoginTimeFailed') + ':', error)
      }
    },

    showError(title, message, retryAction = null) {
      this.errorState = {
        show: true,
        title: title || this.$t('errorOccurred'),
        message,
        showRetry: !!retryAction,
        retryAction
      }
    },

    clearError() {
      this.errorState.show = false
      this.errorState.retryAction = null
    },

    handleErrorRetry() {
      if (this.errorState.retryAction) {
        this.clearError()
        this.errorState.retryAction()
      }
    },

    handleBeforeUnload(event) {
      if (this.hasUnsavedChanges) {
        const message = this.$t('unsavedChangesWarning') || '您有未保存的更改，确定要离开吗？'
        event.preventDefault()
        event.returnValue = message
        return message
      }
    },

    showExitConfirmation() {
      if (this.hasUnsavedChanges) {
        this.showExitPrompt = true
      }
    },

    confirmExit() {
      this.hasUnsavedChanges = false
      this.showExitPrompt = false

    },

    cancelExit() {
      this.showExitPrompt = false
    },

    async saveAndExit() {
      try {
        await this.saveToCloud()
        this.hasUnsavedChanges = false
        this.showExitPrompt = false

      } catch (error) {
        console.error('保存失败:', error)

      }
    },

    autoSaveDraft() {
      if (!this.currentUserId || this.userAddedPixels.size === 0) {
        return
      }

      this.isAutoSaving = true

      try {

        const chunkDrafts = new Map()

        for (const [key, pixel] of this.userAddedPixels) {
          const [x, y] = key.split(',').map(Number)
          const chunkKey = this.getPixelChunkKey(x, y)

          if (!chunkDrafts.has(chunkKey)) {
            chunkDrafts.set(chunkKey, [])
          }

          chunkDrafts.get(chunkKey).push({
            key,
            x,
            y,
            color: pixel.color,
            timestamp: pixel.timestamp
          })
        }

        for (const [chunkKey, pixels] of chunkDrafts) {
          const draftData = {
            userId: this.currentUserId,
            chunkKey,
            pixels,
            savedAt: Date.now()
          }

          const draftKey = `pixelArtDraft_${chunkKey}`
          localStorage.setItem(draftKey, JSON.stringify(draftData))
        }

      } catch (error) {
        console.error('自动保存草稿失败:', error)
      } finally {

        setTimeout(() => {
          this.isAutoSaving = false
        }, 1000)
      }
    },

    loadDraftFromLocal() {

    },

    clearLocalDraft() {

      localStorage.removeItem('pixelArtDraft')

      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('pixelArtDraft_')) {
          localStorage.removeItem(key)
        }
      })

    },

    startAutoLoadTimer() {

      if (this.autoLoadTimer) {
        clearInterval(this.autoLoadTimer)
      }

      this.autoLoadTimer = setInterval(() => {
        if (this.currentUserId && !this.isLoading) {
          this.autoLoadFromCloud()
        }
      }, this.autoLoadInterval)
    },

    handleTouchStart(event) {
      if (event.touches.length === 1) {
        const touch = event.touches[0]
        this.touchState.isTouching = true
        this.touchState.lastTouchPoint = { x: touch.clientX, y: touch.clientY }
        this.touchState.touchStartTime = Date.now()
        this.touchState.isPanningTouch = false
      }
    },

    handleTouchMove(event) {
      event.preventDefault()
      if (this.touchState.isTouching && event.touches.length === 1) {
        const touch = event.touches[0]
        const deltaX = touch.clientX - this.touchState.lastTouchPoint.x
        const deltaY = touch.clientY - this.touchState.lastTouchPoint.y
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        if (distance > 10 || this.touchState.isPanningTouch) {
          this.touchState.isPanningTouch = true
          this.isPanning = true

          this.panX += deltaX / this.zoomLevel
          this.panY += deltaY / this.zoomLevel

          this.touchState.lastTouchPoint = { x: touch.clientX, y: touch.clientY }
        }
      }
    },

    handleTouchEnd(event) {
      this.touchState.isTouching = false
      this.isPanning = false
      this.touchState.isPanningTouch = false
    },

    handleCanvasTouchStart(event) {
      event.preventDefault()
      if (event.touches.length === 1) {
        const touch = event.touches[0]
        this.touchState.lastTouchPoint = { x: touch.clientX, y: touch.clientY }
        this.touchState.touchStartTime = Date.now()

        this.handleTouchMove(event)
      }
    },

    handleCanvasTouchMove(event) {
      event.preventDefault()
      if (event.touches.length === 1 && !this.touchState.isPanningTouch) {
        const touch = event.touches[0]
        this.updatePreview(touch.clientX, touch.clientY, true)
      }
    },

    handleCanvasTouchEnd(event) {
      event.preventDefault()

      const touchDuration = Date.now() - this.touchState.touchStartTime
      if (touchDuration < 300 && !this.touchState.isPanningTouch) {
        this.drawPixelFromTouch(event.changedTouches[0])
      }

      this.hidePreview()
    },

    drawPixelFromTouch(touch) {
      const { x, y } = this.getPixelCoordinates(touch.clientX, touch.clientY)

      // 特殊处理触摸擦除时的错误提示
      if (this.isErasing) {
        const chunkVariable = this.getPixelChunkVariable(x, y)
        const existingPixel = chunkVariable.get(`${x},${y}`)

        if (existingPixel && existingPixel.userId !== this.currentUserId) {
          this.showError(
            this.$t('errorOccurred'),
            this.$t('cannotEraseOthersPixels'),
            null
          )
          return
        }
      }

      this.performPixelAction(x, y)
    }

  }
}
</script>

<style scoped>
.pixel-art-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  font-family: 'Poppins Regular', sans-serif;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background-color: white;
  border-bottom: 2px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  gap: 20px;
}

.color-palette {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-title {
  font-weight: bold;
  color: var(--text-color);
  font-size: 14px;
}

.colors {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.color-item {
  width: 30px;
  height: 30px;
  border-radius: var(--border-radius);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-item:hover {
  transform: scale(1.1);
  border-color: #333;
}

.color-item.active {
  border-color: #333;
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.color-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.color-item.disabled:hover {
  transform: none;
  border-color: transparent;
}

.tools {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tool-btn {
  padding: 8px 16px;
  border: 2px solid var(--theme-color);
  background-color: white;
  color: var(--theme-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-family: 'Poppins Regular', sans-serif;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tool-btn:hover:not(:disabled),
.tool-btn.active {
  background-color: var(--theme-color);
  color: white;
}

.color-picker {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 2px solid var(--theme-color) !important;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: none;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-level {
  font-weight: bold;
  color: var(--text-color);
  min-width: 50px;
  text-align: center;
}

.canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}

.canvas-wrapper {
  position: relative;
  transform-origin: center;
  transition: transform 0.1s ease-out;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}

canvas {
  border: 2px solid #ccc;
  border-radius: var(--border-radius);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: white;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.pixel-preview {
  position: fixed;
  pointer-events: none;
  border: 1px solid #333;
  z-index: 1000;
  opacity: 0.7;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background-color: white;
  border-top: 2px solid #e0e0e0;
  font-size: 12px;
  color: var(--text-color);
  flex-wrap: wrap;
  gap: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

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

.user-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .color-palette,
  .tools,
  .zoom-controls {
    justify-content: center;
  }

  .colors {
    justify-content: center;
  }

  .status-bar {
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }

  .tool-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .color-item {
    width: 25px;
    height: 25px;
  }

  .user-controls {
    flex-wrap: wrap;
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.floating-status-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #4CAF50;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  z-index: 1000;
  font-size: 14px;
  transition: all 0.3s ease-out;
  animation: slideInUp 0.3s ease-out;
}

.floating-status-indicator.fade-out {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.pixel-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tooltip-position {
  font-family: monospace;
}

.color-preview {
  position: fixed;
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1002;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-family: monospace;
  min-width: 120px;
}

.color-preview-swatch {
  width: 24px;
  height: 24px;
  border: 1px solid #ccc;
  border-radius: 4px;
  flex-shrink: 0;
}

.color-preview-text {
  font-weight: bold;
  color: #333;
}

.magnifier {
  position: fixed;
  width: 100px;
  height: 100px;
  pointer-events: none;
  z-index: 1001;
}

.magnifier-circle {
  width: 100%;
  height: 100%;
  border: 3px solid #333;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.magnifier-crosshair {
  width: 20px;
  height: 20px;
  position: relative;
}

.magnifier-crosshair::before,
.magnifier-crosshair::after {
  content: '';
  position: absolute;
  background: #333;
}

.magnifier-crosshair::before {
  width: 2px;
  height: 20px;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
}

.magnifier-crosshair::after {
  width: 20px;
  height: 2px;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

.tooltip-position {
  color: #ccc;
  font-size: 11px;
}

.tooltip-user {
  font-weight: bold;
}

.tooltip-user.own-pixel {
  color: #4CAF50;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.auto-save-indicator {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 1000;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

.auto-save-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auto-save-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.auto-save-text {
  font-weight: 500;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.chunk-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1003;
}

.chunk-loading-container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 400px;
}

.chunk-loading-header h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.chunk-loading-progress {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 600;
  color: #666;
  min-width: 60px;
  text-align: right;
}

.chunk-loading-current {
  color: #666;
  font-size: 14px;
  margin-top: 10px;
}

.chunk-loading-current span {
  font-weight: 500;
  color: #4CAF50;
}
</style>