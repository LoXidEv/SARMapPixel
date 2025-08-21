<template>
  <div class="pixel-art-container">
    <!-- 全屏加载组件 -->
    <transition name="fade">
      <GlobalLoading v-if="globalLoading.show" :loading-text="globalLoading.text"
        :show-progress="globalLoading.showProgress" :completed-tasks="globalLoading.completedTasks"
        :total-tasks="globalLoading.totalTasks" />
    </transition>

    <!-- 区块加载进度组件 -->
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

    <!-- 登录弹窗组件 -->
    <LoginModal :visible="showLoginModal" :current-user-id="currentUserId" @close="showLoginModal = false"
      @login="handleLogin" @create-user="handleCreateUser" @show-help="showHelpModal = true" />

    <!-- 帮助弹窗组件 -->
    <HelpModal :visible="showHelpModal" @close="closeHelpModal" />

    <!-- 错误显示组件 -->
    <ErrorDisplay :visible="errorState.show" :title="errorState.title" :message="errorState.message"
      :show-retry="errorState.showRetry" @retry="handleErrorRetry" @close="clearError" />



    <!-- 顶部工具栏 -->
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
        <button class="tool-btn" @click="saveToCloud" :disabled="isLoading || !currentUserId">
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



    <!-- 画布容器 -->
    <div class="canvas-container" ref="canvasContainer" 
         @contextmenu.prevent @selectstart.prevent @dragstart.prevent>
      <div class="canvas-wrapper" :style="{ transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)` }"
        @mousedown="startPan" @mousemove="handlePan" @mouseup="endPan" @mouseleave="endPan"
        @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd"
        @contextmenu.prevent @selectstart.prevent @dragstart.prevent>
        <canvas ref="canvas" @click="drawPixel" @mousemove="handleMouseMove" @mouseleave="hidePreview"
          @touchstart="handleCanvasTouchStart" @touchmove="handleCanvasTouchMove" @touchend="handleCanvasTouchEnd"
          @contextmenu.prevent @selectstart.prevent @dragstart.prevent
          :style="{ cursor: isPanning ? 'grabbing' : (isColorPicking ? 'copy' : 'crosshair') }"></canvas>
      </div>

      <!-- 像素预览 -->
      <div v-if="previewPixel.show && !isColorPicking" class="pixel-preview" :style="{
        left: previewPixel.x + 'px',
        top: previewPixel.y + 'px',
        width: (pixelSize * zoomLevel) + 'px',
        height: (pixelSize * zoomLevel) + 'px',
        backgroundColor: selectedColor,
        transform: 'translate(-50%, -50%)'
      }"></div>

      <!-- 像素悬停提示 -->
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

    <!-- 状态信息 -->
    <div class="status-bar">
      <div class="status-item">
        {{ $t('totalPixels') }}: {{ totalPixels }}
      </div>

      <div class="status-item" v-if="lastSaved">
        {{ $t('lastSaved') }}: {{ formatTime(lastSaved) }}
      </div>
    </div>

    <!-- 悬挂式状态指示器 -->
    <div class="floating-status-indicator" v-if="isLoading">
      <span v-if="isLoading">{{ $t('loading') }}</span>
    </div>

    <!-- 退出确认弹窗 -->
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

    <!-- 取色器颜色预览 -->
    <div v-if="showColorPreview" class="color-preview" :style="{
      left: magnifierPosition.x + 20 + 'px',
      top: magnifierPosition.y - 60 + 'px'
    }">
      <div class="color-preview-swatch" :style="{ backgroundColor: colorPreview }"></div>
      <div class="color-preview-text">{{ colorPreview }}</div>
    </div>

    <!-- 取色器放大镜 -->
    <div v-if="showMagnifier" class="magnifier" :style="{
      left: magnifierPosition.x - 50 + 'px',
      top: magnifierPosition.y - 50 + 'px'
    }">
      <div class="magnifier-circle">
        <div class="magnifier-crosshair"></div>
      </div>
    </div>

    <!-- 关于模态框 -->
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
      // 画布相关
      canvas: null,
      ctx: null,
      mapImage: null,
      pixelSize: 8, // 每个像素的大小（增大以提升视觉效果）

      // 颜色相关
      selectedColor: '#FF0000',
      colors: [], // 常用颜色列表
      isColorPickerVisible: false, // 颜色选择器显示状态
      customColor: '#FF0000', // 自定义颜色
      isErasing: false, // 是否处于橡皮擦模式
      isColorPicking: false, // 是否处于取色器模式

      // 取色器预览和放大镜
      colorPreview: '#000000', // 预览颜色
      showColorPreview: false, // 是否显示颜色预览
      magnifierPosition: { x: 0, y: 0 }, // 放大镜位置
      showMagnifier: false, // 是否显示放大镜

      // 缩放和平移
      zoomLevel: 1,
      panX: 0,
      panY: 0,
      isPanning: false,
      lastPanPoint: { x: 0, y: 0 },
      panTimer: null, // 长按定时器
      panStartTime: null, // 长按开始时间
      panStartPoint: null, // 长按开始位置
      panEndTime: null, // 拖拽结束时间
      drawingDisabled: false, // 拖拽结束后短时间内禁用绘制

      // 像素数据
      pixelData: new Map(), // 存储所有像素数据 {key: {color, userId, timestamp, status: 'saved'|'cached'}}
      userAddedPixels: new Map(), // 存储用户在当前会话中新添加的像素

      // 区块系统（简化为2x2）
      chunkSize: 200, // 每个区块的像素大小 (200x200像素，增大区块减少请求)
      loadedChunks: new Set(), // 已加载的区块集合
      chunkData: new Map(), // 区块数据缓存 {chunkKey: Map<pixelKey, pixelData>}
      chunkErrors: new Map(), // 区块加载错误记录 {chunkKey: errorMessage}
      visibleChunks: new Set(), // 当前视口可见的区块

      // 区块加载进度（动态计算总数）
      chunkLoadingProgress: {
        show: false,
        currentChunk: '',
        completedChunks: 0,
        totalChunks: 4, // 默认值，会在加载时动态计算
        isLoading: false
      },

      // 区块缓存系统
      chunkCache: new Map(), // 本地缓存的区块数据
      cacheExpireTime: 5 * 60 * 1000, // 5分钟缓存过期时间

      // 预览
      previewPixel: {
        show: false,
        x: 0,
        y: 0
      },

      // 像素悬停提示
      pixelTooltip: {
        show: false,
        x: 0,
        y: 0,
        pixelX: 0,
        pixelY: 0,
        userId: '',
        isOwnPixel: false
      },

      // 状态
      isLoading: false,
      lastSaved: null,
      loadingStartTime: null,
      minLoadingDuration: 2000, // 最小加载时间2秒



      // 全屏加载状态
      globalLoading: {
        show: true,
        text: '',
        showProgress: true,
        completedTasks: 0,
        totalTasks: 3 // 初始化任务数量：加载地图、获取像素数据、获取颜色列表
      },

      // 用户标识
      currentUserId: null,
      showLoginModal: true,
      showHelpModal: false,
      showAboutModal: false,

      // 错误状态
      errorState: {
        show: false,
        title: '',
        message: '',
        showRetry: true,
        retryAction: null
      },

      // 触摸相关状态
      touchState: {
        isTouching: false,
        lastTouchPoint: null,
        touchStartTime: 0,
        isPanningTouch: false
      },

      // 退出提示
      showExitPrompt: false,
      hasUnsavedChanges: false,

      // 自动保存草稿相关
      autoSaveTimer: null,
      autoSaveDelay: 3000, // 3秒无操作后自动保存
      isAutoSaving: false,
      lastActivityTime: null,

      // 自动加载相关
      autoLoadTimer: null,
      autoLoadInterval: 120000 // 2分钟自动加载一次


    }
  },

  computed: {
    totalPixels() {
      return this.pixelData.size
    },


  },

  async mounted() {
    // 设置初始加载文本
    this.globalLoading.text = this.$t('initializingApp')
    // 开始初始化流程
    await this.initializeApp()

    // 添加页面关闭前的提示
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown)
    this.$refs.canvasContainer?.removeEventListener('wheel', this.handleWheel)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)

    // 清理自动保存定时器
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
    }

    // 清理自动加载定时器
    if (this.autoLoadTimer) {
      clearInterval(this.autoLoadTimer)
    }
  },

  methods: {
    /**
     * 初始化应用程序
     */
    async initializeApp() {
      try {
        // 记录加载开始时间
        this.loadingStartTime = Date.now()

        // 任务1: 初始化画布
        this.globalLoading.text = this.$t('loadingMap')
        await this.initCanvas()
        this.updateLoadingProgress(1)

        // 任务2: 检查用户并加载颜色
        this.globalLoading.text = this.$t('loadingUserData')
        if (!this.currentUserId) {
          await this.checkExistingUser()
        }
        this.loadColorsFromLocal()
        this.updateLoadingProgress(2)

        // 任务3: 加载像素数据
        this.globalLoading.text = this.$t('loadingPixelData')
        if (this.currentUserId) {
          await this.loadPixelData()
        } else {
          console.log('用户未登录，跳过数据加载')
        }

        // 任务4: 本地草稿现在通过区块加载系统自动处理
        this.updateLoadingProgress(3)

        // 启动自动加载定时器
        this.startAutoLoadTimer()

        // 添加事件监听
        window.addEventListener('keydown', this.handleKeydown)
        this.$refs.canvasContainer.addEventListener('wheel', this.handleWheel, { passive: false })

        // 完成初始化
        this.globalLoading.text = this.$t('initializationComplete')

        // 确保加载状态至少显示3秒
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

    /**
     * 从本地缓存获取区块数据
     * @param {string} chunkKey - 区块键值
     * @returns {Map|null} - 缓存的区块数据或null
     */
    getChunkFromCache(chunkKey) {
      try {
        const cacheKey = `chunk_cache_${chunkKey}`
        const cachedData = localStorage.getItem(cacheKey)

        if (!cachedData) {
          return null
        }

        const cache = JSON.parse(cachedData)
        const now = Date.now()

        // 检查缓存是否过期
        if (now - cache.timestamp > this.cacheExpireTime) {
          console.log(`区块 ${chunkKey} 缓存已过期，删除缓存`)
          localStorage.removeItem(cacheKey)
          return null
        }

        // 将缓存数据转换为Map格式
        const chunkData = new Map()
        cache.data.forEach(pixel => {
          const pixelKey = `${pixel.x},${pixel.y}`
          chunkData.set(pixelKey, {
            x: pixel.x,
            y: pixel.y,
            color: pixel.color,
            userId: pixel.userId,
            timestamp: new Date(pixel.timestamp),
            status: 'saved'
          })
        })

        console.log(`区块 ${chunkKey} 从缓存加载了 ${chunkData.size} 个像素`)
        return chunkData
      } catch (error) {
        console.error(`获取区块 ${chunkKey} 缓存失败:`, error)
        return null
      }
    },

    /**
     * 将区块数据保存到本地缓存
     * @param {string} chunkKey - 区块键值
     * @param {Map} chunkData - 区块数据
     */
    saveChunkToCache(chunkKey, chunkData) {
      try {
        if (!chunkData || chunkData.size === 0) {
          return
        }

        // 将Map数据转换为可序列化的数组
        const pixelArray = []
        chunkData.forEach((pixel, pixelKey) => {
          pixelArray.push({
            x: pixel.x,
            y: pixel.y,
            color: pixel.color,
            userId: pixel.userId,
            timestamp: pixel.timestamp.toISOString()
          })
        })

        const cacheData = {
          data: pixelArray,
          timestamp: Date.now()
        }

        const cacheKey = `chunk_cache_${chunkKey}`
        localStorage.setItem(cacheKey, JSON.stringify(cacheData))

        console.log(`区块 ${chunkKey} 已保存到缓存，包含 ${pixelArray.length} 个像素`)
      } catch (error) {
        console.error(`保存区块 ${chunkKey} 到缓存失败:`, error)
      }
    },

    /**
     * 更新加载进度
     */
    updateLoadingProgress(completedTasks) {
      this.globalLoading.completedTasks = completedTasks
    },

    /**
     * 区块坐标系统方法
     */

    /**
     * 将像素坐标转换为区块坐标
     * @param {number} x - 像素X坐标
     * @param {number} y - 像素Y坐标
     * @returns {object} 区块坐标 {chunkX, chunkY}
     */
    pixelToChunk(x, y) {
      // 计算大区块的实际尺寸
      const canvasWidth = this.canvas?.width || 800
      const canvasHeight = this.canvas?.height || 600
      
      const bigChunkWidth = Math.ceil(canvasWidth / 2)
      const bigChunkHeight = Math.ceil(canvasHeight / 2)
      
      return {
        chunkX: Math.floor(x / bigChunkWidth),
        chunkY: Math.floor(y / bigChunkHeight)
      }
    },

    /**
     * 生成区块标识符
     * @param {number} chunkX - 区块X坐标
     * @param {number} chunkY - 区块Y坐标
     * @returns {string} 区块标识符
     */
    getChunkKey(chunkX, chunkY) {
      return `${chunkX},${chunkY}`
    },

    /**
     * 根据区块坐标获取对应的数据库表名
     * @param {number} chunkX - 区块X坐标
     * @param {number} chunkY - 区块Y坐标
     * @returns {string} 数据库表名
     */
    getChunkTableName(chunkX, chunkY) {
      // 4个大区块系统的表名映射
      // 使用2x2网格：(0,0)左上、(1,0)右上、(0,1)左下、(1,1)右下
      const tableNames = [
        ['GlobalPixelsABCD1234', 'GlobalPixelsEFGH1234'], // 上排：左上、右上
        ['GlobalPixelsABCD5678', 'GlobalPixelsEFGH5678']  // 下排：左下、右下
      ]
      return tableNames[chunkY % 2][chunkX % 2]
    },

    /**
     * 获取当前视口可见的区块列表
     * @returns {Array} 可见区块列表 [{chunkX, chunkY, chunkKey, tableName}]
     */
    getVisibleChunks() {
      if (!this.canvas) return []

      // 计算视口范围（考虑缩放和平移）
      const viewportLeft = -this.panX / this.zoomLevel
      const viewportTop = -this.panY / this.zoomLevel
      const viewportRight = viewportLeft + (window.innerWidth / this.zoomLevel)
      const viewportBottom = viewportTop + (window.innerHeight / this.zoomLevel)

      // 计算涉及的区块范围
      const startChunkX = Math.max(0, Math.floor(viewportLeft / this.chunkSize))
      const endChunkX = Math.ceil(viewportRight / this.chunkSize)
      const startChunkY = Math.max(0, Math.floor(viewportTop / this.chunkSize))
      const endChunkY = Math.ceil(viewportBottom / this.chunkSize)
      
      // 计算画布需要的总区块数，确保完全覆盖
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

    /**
     * 加载像素数据并自动绘制到画布（区块加载模式）
     */
    async loadPixelData() {
      try {
        // 清空现有数据
        this.pixelData.clear()
        this.userAddedPixels.clear()
        this.chunkData.clear()
        this.loadedChunks.clear()
        this.chunkErrors = new Map() // 记录区块加载错误

        // 按顺序加载所有区块 A1-H8
        await this.loadAllChunksSequentially()

        console.log('所有区块加载完成')
      } catch (error) {
        console.error(this.$t('loadPixelDataFailed') + ':', error)
      }
    },

    /**
     * 按顺序加载所有区块，使用4个大区块系统覆盖整个画布
     */
    async loadAllChunksSequentially() {
      // 固定的4个大区块系统，每个区块覆盖画布的1/4区域
      // ABCD1234 = 左上, EFGH1234 = 右上, ABCD5678 = 左下, EFGH5678 = 右下
      const chunks = [
        { name: 'ABCD1234', chunkX: 0, chunkY: 0, tableName: 'GlobalPixelsABCD1234' },
        { name: 'EFGH1234', chunkX: 1, chunkY: 0, tableName: 'GlobalPixelsEFGH1234' },
        { name: 'ABCD5678', chunkX: 0, chunkY: 1, tableName: 'GlobalPixelsABCD5678' },
        { name: 'EFGH5678', chunkX: 1, chunkY: 1, tableName: 'GlobalPixelsEFGH5678' }
      ]

      // 显示区块加载进度
      this.chunkLoadingProgress.show = true
      this.chunkLoadingProgress.isLoading = true
      this.chunkLoadingProgress.completedChunks = 0
      this.chunkLoadingProgress.totalChunks = chunks.length
      this.chunkLoadingProgress.currentChunk = ''

      for (let i = 0; i < chunks.length; i++) {
        const { name, chunkX, chunkY } = chunks[i]
        const chunkKey = `${chunkX},${chunkY}`
        const tableName = this.getChunkTableName(chunkX, chunkY)

        // 更新当前加载的区块
        this.chunkLoadingProgress.currentChunk = name

        const chunk = {
          chunkX,
          chunkY,
          chunkKey,
          tableName
        }

        console.log(`开始加载区块 ${name}...`)

        try {
          // 检查缓存
          const cachedData = this.getChunkFromCache(chunkKey)
          if (cachedData) {
            console.log(`区块 ${name} 从缓存加载`)
            this.chunkData.set(chunkKey, cachedData)
          } else {
            // 从云端加载数据
            await this.loadSingleChunk(chunk)
            console.log(`区块 ${name} 云端数据加载成功`)

            // 保存到缓存
            this.saveChunkToCache(chunkKey, this.chunkData.get(chunkKey))
          }

          // 加载该区块的本地草稿数据
          this.loadLocalDraftForChunk(chunkX, chunkY)

          // 加载成功后立即绘制该区块
          this.drawChunk(chunkX, chunkY)
        } catch (error) {
          console.error(`区块 ${name} 加载失败:`, error)
          this.chunkErrors.set(chunkKey, error.message || '加载失败')

          // 即使云端加载失败，也尝试加载本地数据
          this.loadLocalDraftForChunk(chunkX, chunkY)

          // 在该区块显示错误
          this.drawChunkError(chunkX, chunkY, name)
        }

        // 更新进度
        this.chunkLoadingProgress.completedChunks++

        // 等待2秒再加载下一个区块
        if (i < chunks.length - 1) { // 最后一个区块不需要等待
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      // 隐藏加载进度
      this.chunkLoadingProgress.show = false
      this.chunkLoadingProgress.isLoading = false
      this.chunkLoadingProgress.currentChunk = ''
    },

    /**
     * 加载指定区块的本地草稿数据
     * @param {number} chunkX - 区块X坐标
     * @param {number} chunkY - 区块Y坐标
     */
    loadLocalDraftForChunk(chunkX, chunkY) {
      try {
        const draftData = localStorage.getItem('pixelArtDraft')
        if (!draftData) return

        const draft = JSON.parse(draftData)
        if (draft.userId !== this.currentUserId) {
          return
        }

        // 计算大区块范围
        const canvasWidth = this.canvas?.width || 800
        const canvasHeight = this.canvas?.height || 600
        
        // 计算大区块的实际尺寸
        const bigChunkWidth = Math.ceil(canvasWidth / 2)
        const bigChunkHeight = Math.ceil(canvasHeight / 2)
        
        const minX = chunkX * bigChunkWidth
        const maxX = Math.min((chunkX + 1) * bigChunkWidth - 1, canvasWidth - 1)
        const minY = chunkY * bigChunkHeight
        const maxY = Math.min((chunkY + 1) * bigChunkHeight - 1, canvasHeight - 1)

        let loadedCount = 0

        // 只加载属于当前区块的草稿像素
        draft.pixels.forEach(pixel => {
          if (pixel.x >= minX && pixel.x <= maxX &&
            pixel.y >= minY && pixel.y <= maxY) {

            const pixelInfo = {
              x: pixel.x,
              y: pixel.y,
              color: pixel.color,
              userId: this.currentUserId,
              timestamp: new Date(pixel.timestamp),
              status: 'cached'
            }

            this.pixelData.set(pixel.key, pixelInfo)
            this.userAddedPixels.set(pixel.key, pixelInfo)

            // 同时更新区块数据缓存
            const chunkKey = `${chunkX},${chunkY}`
            if (!this.chunkData.has(chunkKey)) {
              this.chunkData.set(chunkKey, new Map())
            }
            this.chunkData.get(chunkKey).set(pixel.key, pixelInfo)

            loadedCount++
          }
        })

        if (loadedCount > 0) {
          console.log(`区块 ${String.fromCharCode(65 + chunkX)}${chunkY + 1} 加载了 ${loadedCount} 个本地草稿像素`)
          this.hasUnsavedChanges = true
        }
      } catch (error) {
        console.error(`加载区块 ${chunkX},${chunkY} 的本地草稿失败:`, error)
      }
    },

    /**
     * 加载指定区块的数据
     * @param {Array} chunks - 要加载的区块列表
     */
    async loadChunks(chunks) {
      const loadPromises = chunks.map(chunk => this.loadSingleChunk(chunk))
      await Promise.all(loadPromises)
    },

    /**
     * 加载单个区块的数据
     * @param {object} chunk - 区块信息 {chunkX, chunkY, chunkKey, tableName}
     */
    async loadSingleChunk(chunk) {
      const { chunkX, chunkY, chunkKey, tableName } = chunk

      // 如果区块已经加载，跳过
      if (this.loadedChunks.has(chunkKey)) {
        return
      }

      try {
        // 从对应的数据库表加载区块数据
        const ChunkTable = AV.Object.extend(tableName)
        const query = new AV.Query(ChunkTable)

        // 查询该区块范围内的像素
        // 4个大区块系统：每个区块覆盖画布的1/4区域
        const canvasWidth = this.canvas?.width || 800
        const canvasHeight = this.canvas?.height || 600
        
        // 计算大区块的实际尺寸
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

        const results = await query.find()

        // 创建区块数据映射
        const chunkPixelData = new Map()

        // 加载区块数据到本地
        results.forEach(result => {
          const pixelKey = `${result.get('x')},${result.get('y')}`
          const pixelData = {
            color: result.get('color'),
            userId: result.get('userId'),
            timestamp: result.get('timestamp'),
            status: 'saved'
          }

          chunkPixelData.set(pixelKey, pixelData)
          this.pixelData.set(pixelKey, pixelData)
        })

        // 缓存区块数据
        this.chunkData.set(chunkKey, chunkPixelData)
        this.loadedChunks.add(chunkKey)

        console.log(`已加载区块 ${chunkKey} (${tableName}): ${results.length} 个像素`)
      } catch (error) {
        console.error(`加载区块 ${chunkKey} (${tableName}) 失败:`, error)
        // 抛出错误，让上层处理
        throw error
      }
    },

    /**
     * 初始化画布
     */
    async initCanvas() {
      this.canvas = this.$refs.canvas
      this.ctx = this.canvas.getContext('2d')

      // 加载地图图片
      return new Promise((resolve, reject) => {
        this.mapImage = new Image()
        this.mapImage.onload = () => {
          try {
            // 设置画布尺寸
            this.canvas.width = this.mapImage.width
            this.canvas.height = this.mapImage.height

            // 绘制背景地图
            this.drawBackground()

            // 不再自动绘制所有像素，改为通过顺序加载逐步绘制

            resolve()
          } catch (error) {
            reject(error)
          }
        }

        this.mapImage.onerror = () => {
          console.error('Failed to load map image')
          // 如果图片加载失败，创建一个默认画布
          this.canvas.width = 800
          this.canvas.height = 600
          this.ctx.fillStyle = '#f0f0f0'
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
          resolve() // 即使图片加载失败也要resolve，让应用继续运行
        }

        this.mapImage.src = '/img/Map.webp'
      })
    },

    /**
     * 绘制背景地图
     */
    drawBackground() {
      if (this.mapImage && this.mapImage.complete) {
        // 确保透明度为100%
        this.ctx.globalAlpha = 1.0
        this.ctx.drawImage(this.mapImage, 0, 0)
      }
    },



    /**
     * 绘制所有像素
     */
    drawAllPixels() {
      this.pixelData.forEach((pixelInfo, key) => {
        const [x, y] = key.split(',').map(Number)
        const color = typeof pixelInfo === 'string' ? pixelInfo : pixelInfo.color
        const status = typeof pixelInfo === 'object' ? pixelInfo.status : 'saved'
        this.drawSinglePixel(x, y, color, status)
      })
    },

    /**
     * 绘制单个像素
     */
    drawSinglePixel(x, y, color, status = 'saved') {
      // 根据像素状态设置透明度
      if (status === 'cached') {
        // 缓存像素使用50%透明度
        this.ctx.globalAlpha = 0.5
      } else {
        // 正式像素使用100%不透明度
        this.ctx.globalAlpha = 1.0
      }

      this.ctx.fillStyle = color
      this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize)

      // 重置透明度
      this.ctx.globalAlpha = 1.0
    },

    /**
     * 绘制单个区块的所有像素
     */
    drawChunk(chunkX, chunkY) {
      const chunkKey = `${chunkX},${chunkY}`
      const chunkData = this.chunkData.get(chunkKey)

      if (chunkData) {
        chunkData.forEach((pixelInfo, pixelKey) => {
          const [x, y] = pixelKey.split(',').map(Number)
          this.drawSinglePixel(x, y, pixelInfo.color, pixelInfo.status)
        })
      }
    },

    /**
     * 在区块中显示错误信息
     */
    drawChunkError(chunkX, chunkY, chunkName) {
      // 计算大区块的实际尺寸和位置
      const canvasWidth = this.canvas?.width || 800
      const canvasHeight = this.canvas?.height || 600
      
      const bigChunkWidth = Math.ceil(canvasWidth / 2)
      const bigChunkHeight = Math.ceil(canvasHeight / 2)
      
      const startX = chunkX * bigChunkWidth
      const startY = chunkY * bigChunkHeight
      const chunkWidth = Math.min(bigChunkWidth, canvasWidth - startX)
      const chunkHeight = Math.min(bigChunkHeight, canvasHeight - startY)

      // 绘制红色半透明背景
      this.ctx.globalAlpha = 0.3
      this.ctx.fillStyle = '#ff0000'
      this.ctx.fillRect(startX, startY, chunkWidth, chunkHeight)

      // 绘制错误文字
      this.ctx.globalAlpha = 1.0
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'

      const centerX = startX + chunkWidth / 2
      const centerY = startY + chunkHeight / 2

      this.ctx.fillText('加载失败', centerX, centerY - 6)
      this.ctx.fillText(chunkName, centerX, centerY + 6)

      // 重置设置
      this.ctx.globalAlpha = 1.0
      this.ctx.textAlign = 'start'
      this.ctx.textBaseline = 'alphabetic'
    },

    /**
     * 选择颜色
     */
    selectColor(color) {
      if (!this.isErasing) {
        this.selectedColor = color
        this.customColor = color // 更新颜色选择器的显示颜色
        // 将选中的颜色添加到常用颜色列表
        if (!this.colors.includes(color)) {
          this.colors.unshift(color)
          if (this.colors.length > 10) { // 限制常用颜色数量为10种
            this.colors.pop()
          }
          this.saveColorsToLocal()
        }
      }
    },

    /**
     * 保存常用颜色到本地存储
     */
    saveColorsToLocal() {
      localStorage.setItem('pixelArtColors', JSON.stringify(this.colors))
    },

    /**
     * 从本地存储加载常用颜色
     */
    loadColorsFromLocal() {
      const savedColors = localStorage.getItem('pixelArtColors')
      if (savedColors) {
        this.colors = JSON.parse(savedColors)
      }
    },

    /**
     * 选择画笔模式
     */
    selectBrush() {
      if (this.isErasing) {
        this.isErasing = false
        this.selectedColor = this.previousColor
      }
      this.isColorPicking = false
    },

    /**
     * 选择橡皮擦模式
     */
    selectEraser() {
      if (!this.isErasing) {
        this.isErasing = true
        this.isColorPicking = false
        this.previousColor = this.selectedColor
      }
    },

    /**
     * 选择取色器模式
     */
    async selectColorPicker() {
      // 检查是否支持EyeDropper API
      if ('EyeDropper' in window) {
        try {
          const eyeDropper = new EyeDropper()
          const result = await eyeDropper.open()
          // 使用EyeDropper API获取的颜色
          this.selectColor(result.sRGBHex)
          // 不需要进入取色器模式，直接使用API结果
          this.isColorPicking = false
          this.isErasing = false
          this.hidePreview()
          return
        } catch (error) {
          // 用户取消或其他错误，回退到画布取色模式
          console.log('EyeDropper cancelled or failed:', error)
        }
      }

      // 回退到原有的画布取色模式
      const wasColorPicking = this.isColorPicking
      this.isColorPicking = !this.isColorPicking
      this.isErasing = false

      // 如果退出取色器模式，隐藏预览效果
      if (wasColorPicking) {
        this.hidePreview()
      }
    },

    /**
     * 绘制像素
     */
    drawPixel(event) {
      // 检查用户是否已登录
      if (!this.currentUserId) {
        this.showLoginModal = true
        return
      }

      // 检查是否在拖拽结束后的禁用期内
      if (this.drawingDisabled) {
        return
      }

      if (this.isPanning || this.isLoading) return

      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height

      const x = Math.floor((event.clientX - rect.left) * scaleX / this.pixelSize) * this.pixelSize
      const y = Math.floor((event.clientY - rect.top) * scaleY / this.pixelSize) * this.pixelSize

      // 检查坐标是否在画布范围内
      if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) {
        return
      }

      const key = `${x},${y}`

      if (this.isColorPicking) {
        // 取色器模式：从画布上提取颜色
        const existingPixel = this.pixelData.get(key)
        if (existingPixel) {
          // 如果该位置有像素，提取其颜色
          this.selectColor(existingPixel.color)
          // 退出取色器模式
          this.isColorPicking = false
        } else {
          // 如果该位置没有像素，从背景图像中提取颜色
          const imageData = this.ctx.getImageData(x, y, 1, 1)
          const data = imageData.data
          const color = `#${((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1)}`
          this.selectColor(color)
          // 退出取色器模式
          this.isColorPicking = false
        }
        return
      } else if (this.isErasing) {
        // 检查是否是自己的像素
        const existingPixel = this.pixelData.get(key)
        if (existingPixel && existingPixel.userId === this.currentUserId) {
          // 删除像素
          this.pixelData.delete(key)
          // 如果是用户新添加的像素，也从userAddedPixels中移除
          this.userAddedPixels.delete(key)
          // 重绘被删除的区域
          this.ctx.clearRect(x, y, this.pixelSize, this.pixelSize)
          this.drawBackground()
          this.drawAllPixels()
          // 标记有未保存的更改
          this.hasUnsavedChanges = true
        }
        // 在橡皮擦模式下，无论是否成功擦除，都直接返回，不执行后续的绘制逻辑
        return
      } else {
        // 检查是否已存在像素
        const existingPixel = this.pixelData.get(key)

        // 如果存在未保存的像素且是自己的，先清除该区域
        if (existingPixel && existingPixel.status === 'cached' && existingPixel.userId === this.currentUserId) {
          this.ctx.clearRect(x, y, this.pixelSize, this.pixelSize)
          // 重绘该区域的背景
          this.ctx.globalAlpha = 1.0
          if (this.mapImage && this.mapImage.complete) {
            this.ctx.drawImage(this.mapImage, x, y, this.pixelSize, this.pixelSize, x, y, this.pixelSize, this.pixelSize)
          }
        }

        // 更新像素数据
        const pixelInfo = {
          color: this.selectedColor,
          userId: this.currentUserId,
          timestamp: new Date(),
          status: 'cached' // 新绘制的像素标记为缓存状态
        }
        this.pixelData.set(key, pixelInfo)
        // 记录用户新添加的像素
        this.userAddedPixels.set(key, pixelInfo)
        // 绘制像素（缓存状态，带透明度）
        this.drawSinglePixel(x, y, this.selectedColor, 'cached')
        // 标记有未保存的更改
        this.hasUnsavedChanges = true
        // 重置自动保存定时器
        this.resetAutoSaveTimer()
      }
    },

    /**
     * 处理鼠标移动事件
     */
    handleMouseMove(event) {
      if (this.isPanning || this.isLoading) return

      // 在拖拽时不显示预览像素
      if (this.isPanning) {
        this.previewPixel.show = false
        this.pixelTooltip.show = false
        return
      }

      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height

      const x = Math.floor((event.clientX - rect.left) * scaleX / this.pixelSize) * this.pixelSize
      const y = Math.floor((event.clientY - rect.top) * scaleY / this.pixelSize) * this.pixelSize

      if (x >= 0 && y >= 0 && x < this.canvas.width && y < this.canvas.height) {
        // 取色器模式下的特殊处理
        if (this.isColorPicking) {
          // 更新放大镜位置
          this.magnifierPosition = {
            x: event.clientX,
            y: event.clientY
          }
          this.showMagnifier = true

          // 获取当前位置的颜色进行预览
          const key = `${x},${y}`
          const existingPixel = this.pixelData.get(key)
          if (existingPixel) {
            this.colorPreview = existingPixel.color
          } else {
            // 从背景图像中获取颜色
            const imageData = this.ctx.getImageData(x, y, 1, 1)
            const data = imageData.data
            this.colorPreview = `#${((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1)}`
          }
          this.showColorPreview = true

          // 在取色器模式下不显示普通预览
          this.previewPixel.show = false
          this.pixelTooltip.show = false
          return
        }

        // 普通模式下的预览
        this.previewPixel = {
          show: true,
          x: event.clientX,
          y: event.clientY
        }

        // 检查是否有像素存在
        const key = `${x},${y}`
        const pixelInfo = this.pixelData.get(key)

        if (pixelInfo) {
          // 显示像素悬停提示
          this.pixelTooltip = {
            show: true,
            x: event.clientX + 15,
            y: event.clientY + 15,
            pixelX: x,
            pixelY: y,
            userId: pixelInfo.userId,
            isOwnPixel: pixelInfo.userId === this.currentUserId
          }
        } else {
          this.pixelTooltip.show = false
        }
      } else {
        this.previewPixel.show = false
        this.pixelTooltip.show = false
        this.showColorPreview = false
        this.showMagnifier = false
      }
    },

    /**
     * 隐藏像素预览
     */
    hidePreview() {
      this.previewPixel.show = false
      this.pixelTooltip.show = false
      this.showColorPreview = false
      this.showMagnifier = false
    },

    /**
     * 开始平移
     */
    startPan(event) {
      if (event.button === 0) { // 鼠标左键
        // 开始长按检测
        this.panStartTime = Date.now()
        this.panStartPoint = { x: event.clientX, y: event.clientY }
        this.panTimer = setTimeout(() => {
          // 长按500ms后开始平移
          this.isPanning = true
          this.lastPanPoint = { x: event.clientX, y: event.clientY }
        }, 500)
        event.preventDefault()
      }
    },

    /**
     * 处理平移
     */
    handlePan(event) {
      if (this.isPanning) {
        const deltaX = event.clientX - this.lastPanPoint.x
        const deltaY = event.clientY - this.lastPanPoint.y

        this.panX += deltaX / this.zoomLevel
        this.panY += deltaY / this.zoomLevel

        this.lastPanPoint = { x: event.clientX, y: event.clientY }

        // 检查是否需要加载新的区块
        // 已取消自动加载功能

        event.preventDefault()
      }
    },

    /**
     * 结束平移
     */
    endPan(event) {
      // 清除长按定时器
      if (this.panTimer) {
        clearTimeout(this.panTimer)
        this.panTimer = null
      }

      // 如果进入了平移状态，设置拖拽结束时间并禁用绘制500ms
      if (this.isPanning) {
        this.panEndTime = Date.now()
        this.drawingDisabled = true
        setTimeout(() => {
          this.drawingDisabled = false
        }, 500)
      }

      // 如果没有进入平移状态且是短时间点击，则执行绘制
      if (!this.isPanning && this.panStartTime) {
        const clickDuration = Date.now() - this.panStartTime
        if (clickDuration < 500 && event) {
          // 短时间点击，执行绘制操作
          this.drawPixel(event)
        }
      }

      this.isPanning = false
      this.panStartTime = null
      this.panStartPoint = null
    },

    /**
     * 放大
     */
    zoomIn() {
      this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5)
      // 已取消自动加载功能
    },

    /**
     * 缩小
     */
    zoomOut() {
      this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.1)
      // 已取消自动加载功能
    },

    /**
     * 重置缩放
     */
    resetZoom() {
      this.zoomLevel = 1
      this.panX = 0
      this.panY = 0
      // 已取消自动加载功能
    },

    /**
     * 处理鼠标滚轮缩放
     */
    handleWheel(event) {
      event.preventDefault()

      const delta = event.deltaY > 0 ? 0.9 : 1.1
      this.zoomLevel = Math.max(0.1, Math.min(5, this.zoomLevel * delta))
      // 已取消自动加载功能
    },

    /**
     * 处理键盘事件
     */
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



    /**
     * 检查现有用户
     */
    async checkExistingUser() {
      const savedUserId = localStorage.getItem('pixelArtUserId')
      if (savedUserId) {
        try {
          // 验证用户是否仍然存在
          const userExists = await this.validateUser(savedUserId)
          if (userExists) {
            this.currentUserId = savedUserId
            this.showLoginModal = false
            // 更新最后登录时间
            await this.updateUserLastLogin(savedUserId)
          } else {
            // 用户不存在，清除本地存储并显示登录弹窗
            localStorage.removeItem('pixelArtUserId')
            this.showLoginModal = true
          }
        } catch (error) {
          console.error(this.$t('checkUserFailed') + ':', error)
          // 出错时显示登录弹窗
          this.showLoginModal = true
        }
      } else {
        // 强制显示登录弹窗，用户必须登录才能使用
        this.showLoginModal = true
      }
    },

    /**
     * 生成用户ID
     */
    generateUserId() {
      return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    },

    /**
     * 设置加载状态（确保最小显示时间）
     */
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
              // 添加淡出动画
              const statusIndicator = document.querySelector('.floating-status-indicator')
              if (statusIndicator) {
                statusIndicator.classList.add('fade-out')
                setTimeout(() => {
                  this.isLoading = false
                  statusIndicator.classList.remove('fade-out')
                }, 300) // 0.3秒淡出动画
              } else {
                this.isLoading = false
              }
            }, remainingTime)
          } else {
            // 添加淡出动画
            const statusIndicator = document.querySelector('.floating-status-indicator')
            if (statusIndicator) {
              statusIndicator.classList.add('fade-out')
              setTimeout(() => {
                this.isLoading = false
                statusIndicator.classList.remove('fade-out')
              }, 300) // 0.3秒淡出动画
            } else {
              this.isLoading = false
            }
          }
        } else {
          this.isLoading = false
        }
      }
    },

    /**
     * 处理登录事件
     */
    async handleLogin(userId) {
      try {
        // 验证用户ID是否以'user_'开头
        if (!userId.startsWith('user_')) {
          this.showError(
            this.$t('loginFailed'),
            this.$t('userIdPrefixRequired'),
            null
          )
          return
        }

        await this.setLoadingState(true)

        // 验证用户是否存在
        const userExists = await this.validateUser(userId)
        if (!userExists) {
          // 如果用户不存在，自动创建用户记录
          console.log(this.$t('userNotExistCreating') + ':', userId)
          await this.createUserRecord(userId)
        }

        this.currentUserId = userId
        localStorage.setItem('pixelArtUserId', userId)
        this.showLoginModal = false

        // 更新最后登录时间
        await this.updateUserLastLogin(userId)

        // 启动全屏初始化界面
        this.globalLoading.show = true
        this.globalLoading.text = this.$t('initializingApp')
        this.globalLoading.showProgress = true
        this.globalLoading.completedTasks = 0
        this.globalLoading.totalTasks = 3
        
        // 重新初始化应用程序
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

    /**
     * 处理创建用户事件
     */
    async handleCreateUser(userId) {
      try {
        // 验证用户ID是否以'user_'开头
        if (!userId.startsWith('user_')) {
          this.showError(
            this.$t('createUserFailed'),
            this.$t('userIdPrefixRequired'),
            null
          )
          return
        }

        await this.setLoadingState(true)

        // 检查用户ID是否已存在
        const userExists = await this.validateUser(userId)
        if (userExists) {
          this.showError(
            this.$t('userIdExists'),
            this.$t('userIdExists'),
            null
          )
          return
        }

        // 创建新用户记录
        await this.createUserRecord(userId)

        this.currentUserId = userId
        localStorage.setItem('pixelArtUserId', userId)
        this.showLoginModal = false

        // 启动全屏初始化界面
        this.globalLoading.show = true
        this.globalLoading.text = this.$t('initializingApp')
        this.globalLoading.showProgress = true
        this.globalLoading.completedTasks = 0
        this.globalLoading.totalTasks = 3
        
        // 重新初始化应用程序
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





    /**
     * 关闭帮助弹窗
     */
    closeHelpModal() {
      this.showHelpModal = false
    },

    /**
     * 保存到云端
     */
    async saveToCloud() {
      if (this.isLoading) return

      await this.setLoadingState(true)

      try {
        // 只保存用户新添加的像素
        if (this.userAddedPixels.size === 0) {
          console.log(this.$t('noNewPixelsToSave'))
          this.hasUnsavedChanges = false
          return
        }

        // 按区块分组用户新添加的像素
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

        // 逐个处理每个区块
        for (const [chunkKey, chunkGroup] of chunkGroups) {
          const { savedCount, skippedCount } = await this.saveChunkData(chunkGroup)
          totalSavedCount += savedCount
          totalSkippedCount += skippedCount
        }

        // 更新本地像素状态为已保存
        for (const [key, pixelInfo] of this.userAddedPixels) {
          pixelInfo.status = 'saved'
          // 同时更新主像素数据中的状态
          const mainPixelInfo = this.pixelData.get(key)
          if (mainPixelInfo) {
            mainPixelInfo.status = 'saved'
          }
        }

        // 重新绘制画布以移除透明度
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.drawBackground()
        this.drawAllPixels()

        // 清空用户新添加的像素记录
        this.userAddedPixels.clear()

        // 清除本地草稿
        this.clearLocalDraft()

        this.lastSaved = new Date()
        this.hasUnsavedChanges = false

        console.log(`保存完成: ${totalSavedCount} 个像素已保存，${totalSkippedCount} 个像素因时间戳较旧被跳过，涉及 ${chunkGroups.size} 个区块`)
      } catch (error) {
        console.error(this.$t('saveFailed') + ':', error)
        this.showError(
          this.$t('saveFailed'),
          error.message || this.$t('saveFailed'),
          () => this.saveToCloud()
        )
      } finally {
        await this.setLoadingState(false)
      }
    },

    /**
     * 从云端加载
     */

    checkAndLoadNewChunks() {
      // 获取当前视口可见的区块
      const currentVisibleChunks = this.getVisibleChunks()

      // 找出新的区块（当前可见但未加载的）
      const newChunks = currentVisibleChunks.filter(chunkKey => !this.loadedChunks.has(chunkKey))

      // 如果有新区块需要加载
      if (newChunks.length > 0) {
        console.log(`检测到 ${newChunks.length} 个新区块需要加载:`, newChunks)
        this.loadChunks(newChunks)
      }

      // 更新可见区块列表
      this.visibleChunks = new Set(currentVisibleChunks)
    },

    async saveChunkData(chunkGroup) {
      const { tableName, pixels } = chunkGroup

      // 获取对应区块的数据库表
      const ChunkTable = AV.Object.extend(tableName)

      // 批量查询现有像素
      const coordinates = Array.from(pixels.keys()).map(key => {
        const [x, y] = key.split(',').map(Number)
        return { x, y, key }
      })

      // 构建批量查询
      const existingPixelsMap = new Map()

      // 使用or查询批量获取现有像素
      if (coordinates.length > 0) {
        const orQueries = coordinates.map(coord => {
          const query = new AV.Query(tableName)
          query.equalTo('x', coord.x)
          query.equalTo('y', coord.y)
          return query
        })

        const compoundQuery = AV.Query.or(...orQueries)
        const existingPixels = await compoundQuery.find()

        // 建立现有像素的映射
        existingPixels.forEach(pixel => {
          const key = `${pixel.get('x')},${pixel.get('y')}`
          existingPixelsMap.set(key, pixel)
        })
      }

      // 准备批量保存的对象
      const objectsToSave = []
      let savedCount = 0
      let skippedCount = 0

      for (const [key, pixelInfo] of pixels) {
        const [x, y] = key.split(',').map(Number)
        const existingPixel = existingPixelsMap.get(key)

        if (existingPixel) {
          // 获取现有像素的时间戳
          const existingTimestamp = existingPixel.get('timestamp')
          const newTimestamp = pixelInfo.timestamp

          // 只有当新像素的时间戳更新时才更新数据
          if (newTimestamp > existingTimestamp) {
            existingPixel.set('color', pixelInfo.color)
            existingPixel.set('userId', pixelInfo.userId)
            existingPixel.set('timestamp', pixelInfo.timestamp)
            objectsToSave.push(existingPixel)
            savedCount++
            console.log(`更新像素 (${x},${y}) 在表 ${tableName}: 新时间戳 ${newTimestamp.toISOString()} > 旧时间戳 ${existingTimestamp.toISOString()}`)
          } else {
            skippedCount++
            console.log(`跳过像素 (${x},${y}) 在表 ${tableName}: 新时间戳 ${newTimestamp.toISOString()} <= 旧时间戳 ${existingTimestamp.toISOString()}`)
          }
        } else {
          // 如果不存在，创建新记录
          const pixelRecord = new ChunkTable()
          pixelRecord.set('x', x)
          pixelRecord.set('y', y)
          pixelRecord.set('color', pixelInfo.color)
          pixelRecord.set('userId', pixelInfo.userId)
          pixelRecord.set('timestamp', pixelInfo.timestamp)
          objectsToSave.push(pixelRecord)
          savedCount++
          console.log(`创建新像素 (${x},${y}) 在表 ${tableName}`)
        }
      }

      // 使用批量保存
      if (objectsToSave.length > 0) {
        await AV.Object.saveAll(objectsToSave)
      }

      return { savedCount, skippedCount }
    },

    async loadFromCloud() {
      if (this.isLoading) return

      await this.setLoadingState(true)

      try {
        // 使用区块加载模式重新加载数据
        await this.loadPixelData()

        console.log('已使用区块模式重新加载像素数据')
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

    /**
     * 自动从云端加载（处理数据冲突）
     */
    async autoLoadFromCloud() {
      try {
        // 加载全局像素数据
        const GlobalPixels = AV.Object.extend('GlobalPixels')
        const query = new AV.Query(GlobalPixels)
        const results = await query.find()

        // 保存当前用户的本地草稿
        const localDraftPixels = new Map(this.userAddedPixels)

        // 处理加载的像素数据
        results.forEach(result => {
          const x = result.get('x')
          const y = result.get('y')
          const key = `${x},${y}`
          const cloudTimestamp = result.get('timestamp')

          const cloudPixelInfo = {
            color: result.get('color'),
            userId: result.get('userId'),
            timestamp: cloudTimestamp,
            status: 'saved'
          }

          // 检查是否与本地操作冲突
          const localPixel = localDraftPixels.get(key)
          if (localPixel && localPixel.status === 'cached') {
            // 如果云端时间戳更新，直接替换本地数据
            if (cloudTimestamp > localPixel.timestamp) {
              this.pixelData.set(key, cloudPixelInfo)
              this.userAddedPixels.delete(key) // 移除本地草稿
              console.log(`像素 ${key} 被云端数据替换`)
            } else {
              // 保留本地数据
              this.pixelData.set(key, localPixel)
            }
          } else {
            // 没有冲突，直接使用云端数据
            this.pixelData.set(key, cloudPixelInfo)
          }
        })

        // 重新绘制画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.drawBackground()
        this.drawAllPixels()

        console.log(`自动加载完成，处理了 ${results.length} 个云端像素`)
      } catch (error) {
        console.error('自动加载失败:', error)
        // 自动加载失败时不显示错误提示，避免打扰用户
      }
    },

    /**
     * 格式化时间
     */
    formatTime(date) {
      if (!date) return ''
      return date.toLocaleTimeString()
    },

    /**
     * 验证用户是否存在
     */
    async validateUser(userId) {
      try {
        const Users = AV.Object.extend('Users')
        const query = new AV.Query(Users)
        query.equalTo('userId', userId)
        const user = await query.first()
        return !!user
      } catch (error) {
        console.error(this.$t('validateUserFailed') + ':', error)
        return false
      }
    },

    /**
     * 创建用户记录
     */
    async createUserRecord(userId) {
      try {
        const Users = AV.Object.extend('Users')
        const user = new Users()
        user.set('userId', userId)
        user.set('lastLoginAt', new Date())
        await user.save()
        console.log(this.$t('userRecordCreated') + ':', userId)
      } catch (error) {
        console.error(this.$t('createUserRecordFailed') + ':', error)
        throw error
      }
    },

    /**
     * 更新用户最后登录时间
     */
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

    /**
     * 显示错误信息
     */
    showError(title, message, retryAction = null) {
      this.errorState = {
        show: true,
        title: title || this.$t('errorOccurred'),
        message,
        showRetry: !!retryAction,
        retryAction
      }
    },

    /**
     * 清除错误状态
     */
    clearError() {
      this.errorState.show = false
      this.errorState.retryAction = null
    },

    /**
     * 处理错误重试
     */
    handleErrorRetry() {
      if (this.errorState.retryAction) {
        this.clearError()
        this.errorState.retryAction()
      }
    },

    /**
     * 处理页面关闭前事件
     */
    handleBeforeUnload(event) {
      if (this.hasUnsavedChanges) {
        const message = this.$t('unsavedChangesWarning') || '您有未保存的更改，确定要离开吗？'
        event.preventDefault()
        event.returnValue = message
        return message
      }
    },

    /**
     * 显示退出确认弹窗
     */
    showExitConfirmation() {
      if (this.hasUnsavedChanges) {
        this.showExitPrompt = true
      }
    },

    /**
     * 确认退出（不保存）
     */
    confirmExit() {
      this.hasUnsavedChanges = false
      this.showExitPrompt = false
      // 这里可以添加实际的退出逻辑，比如跳转到其他页面
    },

    /**
     * 取消退出
     */
    cancelExit() {
      this.showExitPrompt = false
    },

    /**
     * 保存并退出
     */
    async saveAndExit() {
      try {
        await this.saveToCloud()
        this.hasUnsavedChanges = false
        this.showExitPrompt = false
        // 这里可以添加实际的退出逻辑
      } catch (error) {
        console.error('保存失败:', error)
        // 保存失败时不退出
      }
    },

    /**
     * 自动保存草稿到本地存储
     */
    autoSaveDraft() {
      if (!this.currentUserId || this.userAddedPixels.size === 0) {
        return
      }

      this.isAutoSaving = true

      try {
        const draftData = {
          userId: this.currentUserId,
          pixels: Array.from(this.userAddedPixels.entries()).map(([key, pixel]) => {
            const [x, y] = key.split(',').map(Number)
            return {
              key,
              x,
              y,
              color: pixel.color,
              timestamp: pixel.timestamp
            }
          }),
          savedAt: Date.now()
        }

        localStorage.setItem('pixelArtDraft', JSON.stringify(draftData))
        console.log('草稿已自动保存到本地')
      } catch (error) {
        console.error('自动保存草稿失败:', error)
      } finally {
        // 延迟隐藏保存状态，让用户能看到
        setTimeout(() => {
          this.isAutoSaving = false
        }, 1000)
      }
    },

    /**
     * 从本地存储加载草稿（已废弃，现在通过区块加载系统处理）
     * 保留此方法以防其他地方调用
     */
    loadDraftFromLocal() {
      // 本地草稿数据现在通过区块加载系统自动处理
      // 在loadAllChunksSequentially中会调用loadLocalDraftForChunk
      console.log('本地草稿数据将通过区块加载系统自动处理')
    },

    /**
     * 清除本地草稿
     */
    clearLocalDraft() {
      localStorage.removeItem('pixelArtDraft')
    },

    /**
     * 重置自动保存定时器
     */
    resetAutoSaveTimer() {
      // 清除现有定时器
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer)
      }

      // 更新最后活动时间
      this.lastActivityTime = Date.now()

      // 设置新的定时器
      this.autoSaveTimer = setTimeout(() => {
        this.autoSaveDraft()
      }, this.autoSaveDelay)
    },

    /**
     * 启动自动加载定时器
     */
    startAutoLoadTimer() {
      // 清除现有定时器
      if (this.autoLoadTimer) {
        clearInterval(this.autoLoadTimer)
      }

      // 设置新的定时器，每2分钟自动加载一次
      this.autoLoadTimer = setInterval(() => {
        if (this.currentUserId && !this.isLoading) {
          this.autoLoadFromCloud()
        }
      }, this.autoLoadInterval)
    },

    /**
     * 处理画布包装器的触摸开始事件
     */
    handleTouchStart(event) {
      if (event.touches.length === 1) {
        const touch = event.touches[0]
        this.touchState.isTouching = true
        this.touchState.lastTouchPoint = { x: touch.clientX, y: touch.clientY }
        this.touchState.touchStartTime = Date.now()
        this.touchState.isPanningTouch = false
      }
    },

    /**
     * 处理画布包装器的触摸移动事件
     */
    handleTouchMove(event) {
      event.preventDefault()
      if (this.touchState.isTouching && event.touches.length === 1) {
        const touch = event.touches[0]
        const deltaX = touch.clientX - this.touchState.lastTouchPoint.x
        const deltaY = touch.clientY - this.touchState.lastTouchPoint.y
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        // 如果移动距离超过阈值，开始平移
        if (distance > 10 || this.touchState.isPanningTouch) {
          this.touchState.isPanningTouch = true
          this.isPanning = true

          this.panX += deltaX / this.zoomLevel
          this.panY += deltaY / this.zoomLevel

          this.touchState.lastTouchPoint = { x: touch.clientX, y: touch.clientY }
        }
      }
    },

    /**
     * 处理画布包装器的触摸结束事件
     */
    handleTouchEnd(event) {
      this.touchState.isTouching = false
      this.isPanning = false
      this.touchState.isPanningTouch = false
    },

    /**
     * 处理画布的触摸开始事件
     */
    handleCanvasTouchStart(event) {
      event.preventDefault()
      if (event.touches.length === 1) {
        const touch = event.touches[0]
        this.touchState.lastTouchPoint = { x: touch.clientX, y: touch.clientY }
        this.touchState.touchStartTime = Date.now()

        // 显示触摸预览
        this.handleTouchMove(event)
      }
    },

    /**
     * 处理画布的触摸移动事件
     */
    handleCanvasTouchMove(event) {
      event.preventDefault()
      if (event.touches.length === 1 && !this.touchState.isPanningTouch) {
        const touch = event.touches[0]
        const rect = this.canvas.getBoundingClientRect()
        const scaleX = this.canvas.width / rect.width
        const scaleY = this.canvas.height / rect.height

        const x = Math.floor((touch.clientX - rect.left) * scaleX / this.pixelSize) * this.pixelSize
        const y = Math.floor((touch.clientY - rect.top) * scaleY / this.pixelSize) * this.pixelSize

        if (x >= 0 && y >= 0 && x < this.canvas.width && y < this.canvas.height) {
          // 显示预览
          this.previewPixel = {
            show: true,
            x: x / scaleX + rect.left,
            y: y / scaleY + rect.top
          }

          // 检查是否有像素存在
          const key = `${x},${y}`
          const pixelInfo = this.pixelData.get(key)

          if (pixelInfo) {
            this.pixelTooltip = {
              show: true,
              x: touch.clientX + 10,
              y: touch.clientY - 30,
              pixelX: x,
              pixelY: y,
              userId: pixelInfo.userId,
              isOwnPixel: pixelInfo.userId === this.currentUserId
            }
          } else {
            this.pixelTooltip.show = false
          }
        } else {
          this.previewPixel.show = false
          this.pixelTooltip.show = false
        }
      }
    },

    /**
     * 处理画布的触摸结束事件
     */
    handleCanvasTouchEnd(event) {
      event.preventDefault()

      // 如果是短时间的触摸且没有平移，则视为点击绘制
      const touchDuration = Date.now() - this.touchState.touchStartTime
      if (touchDuration < 300 && !this.touchState.isPanningTouch) {
        this.drawPixelFromTouch(event.changedTouches[0])
      }

      this.hidePreview()
    },

    /**
     * 从触摸事件绘制像素
     */
    drawPixelFromTouch(touch) {
      // 检查用户是否已登录
      if (!this.currentUserId) {
        this.showLoginModal = true
        return
      }

      // 检查是否在拖拽结束后的禁用期内
      if (this.drawingDisabled) {
        return
      }

      if (this.isLoading) return

      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height

      const x = Math.floor((touch.clientX - rect.left) * scaleX / this.pixelSize) * this.pixelSize
      const y = Math.floor((touch.clientY - rect.top) * scaleY / this.pixelSize) * this.pixelSize

      // 检查坐标是否在画布范围内
      if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) {
        return
      }

      const key = `${x},${y}`
      const existingPixel = this.pixelData.get(key)

      if (this.isErasing) {
        // 橡皮擦模式：只能擦除自己的像素
        if (existingPixel && existingPixel.userId === this.currentUserId) {
          this.pixelData.delete(key)
          // 如果是用户新添加的像素，也从userAddedPixels中移除
          this.userAddedPixels.delete(key)
          // 重绘被删除的区域
          this.ctx.clearRect(x, y, this.pixelSize, this.pixelSize)
          this.drawBackground()
          this.drawAllPixels()
          // 标记有未保存的更改
          this.hasUnsavedChanges = true
        } else if (existingPixel) {
          // 尝试擦除他人像素时显示提示
          this.showError(
            this.$t('errorOccurred'),
            this.$t('cannotEraseOthersPixels'),
            null
          )
          return
        }
      } else {
        // 绘制模式
        // 如果存在未保存的像素且是自己的，先清除该区域
        if (existingPixel && existingPixel.status === 'cached' && existingPixel.userId === this.currentUserId) {
          this.ctx.clearRect(x, y, this.pixelSize, this.pixelSize)
          // 重绘该区域的背景
          this.ctx.globalAlpha = 1.0
          if (this.mapImage && this.mapImage.complete) {
            this.ctx.drawImage(this.mapImage, x, y, this.pixelSize, this.pixelSize, x, y, this.pixelSize, this.pixelSize)
          }
        }

        const pixelInfo = {
          color: this.selectedColor,
          userId: this.currentUserId,
          timestamp: new Date(),
          status: 'cached' // 新绘制的像素标记为缓存状态
        }

        this.pixelData.set(key, pixelInfo)
        // 记录用户新添加的像素
        this.userAddedPixels.set(key, pixelInfo)
        this.drawSinglePixel(x, y, this.selectedColor, 'cached')
        // 标记有未保存的更改
        this.hasUnsavedChanges = true
        // 重置自动保存定时器
        this.resetAutoSaveTimer()
      }
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

/* 工具栏样式 */
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

/* 画布容器样式 */
.canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 禁用用户选择和拖拽 */
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
  /* 禁用用户选择和拖拽 */
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
  /* 禁用用户选择和拖拽 */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
  /* 禁用图像平滑 */
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* 像素预览样式 */
.pixel-preview {
  position: fixed;
  pointer-events: none;
  border: 1px solid #333;
  z-index: 1000;
  opacity: 0.7;
}



/* 状态栏样式 */
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





/* 用户控制按钮样式 */
.user-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}





/* 响应式设计 */
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

/* 加载动画 */
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

/* 悬挂式状态指示器样式 */
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

/* 像素悬停提示样式 */
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

/* 取色器颜色预览样式 */
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

/* 取色器放大镜样式 */
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

/* 全屏加载过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 自动保存状态指示器 */
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

/* 区块加载进度样式 */
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