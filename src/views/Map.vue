<template>
    <div class="pixel-art-container">
        <!-- 全屏加载组件 -->
        <transition name="fade">
            <GlobalLoading 
                v-if="globalLoading.show"
                :loading-text="globalLoading.text"
                :show-progress="globalLoading.showProgress"
                :completed-tasks="globalLoading.completedTasks"
                :total-tasks="globalLoading.totalTasks"
            />
        </transition>

        <!-- 登录弹窗组件 -->
        <LoginModal 
            :visible="showLoginModal"
            :current-user-id="currentUserId"
            @close="showLoginModal = false"
            @login="handleLogin"
            @create-user="handleCreateUser"
            @show-help="showHelpModal = true"
        />

        <!-- 帮助弹窗组件 -->
        <HelpModal 
            :visible="showHelpModal"
            @close="closeHelpModal"
        />

        <!-- 错误显示组件 -->
        <ErrorDisplay
            :visible="errorState.show"
            :title="errorState.title"
            :message="errorState.message"
            :show-retry="errorState.showRetry"
            @retry="handleErrorRetry"
            @close="clearError"
        />



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
        <button class="tool-btn" @click="loadFromCloud" :disabled="isLoading || !currentUserId">
          {{ $t('load') }}
        </button>
        <button class="tool-btn" @click="selectBrush" :class="{ active: !isErasing }" :disabled="!currentUserId">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          {{ $t('pencil') }}
        </button>
        <button class="tool-btn" @click="selectEraser" :class="{ active: isErasing }" :disabled="!currentUserId">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l8.49-8.49c.79-.78 2.05-.78 2.84 0l2.1 2.1zm-2.12 10.61l-1.41-1.41L7.76 17.7a1 1 0 0 0 0 1.41l1.41 1.41a1 1 0 0 0 1.41 0l4.95-4.95z"/>
          </svg>
          {{ $t('eraser') }}
        </button>
        <input type="color" v-model="customColor" @change="selectColor(customColor)" class="color-picker" :title="$t('customColor')" :disabled="!currentUserId">
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
        <div class="canvas-container" ref="canvasContainer">
            <div class="canvas-wrapper" :style="{ transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)` }"
                @mousedown="startPan" @mousemove="handlePan" @mouseup="endPan" @mouseleave="endPan">
                <canvas ref="canvas" @click="drawPixel" @mousemove="handleMouseMove" @mouseleave="hidePreview"
                    :style="{ cursor: isPanning ? 'grabbing' : 'crosshair' }"></canvas>

                <!-- 像素预览 -->
                <div v-if="previewPixel.show" class="pixel-preview" :style="{
                    left: previewPixel.x + 'px',
                    top: previewPixel.y + 'px',
                    backgroundColor: selectedColor
                }"></div>
                
                <!-- 像素悬停提示 -->
                <div v-if="pixelTooltip.show" class="pixel-tooltip" :style="{
                    left: pixelTooltip.x + 'px',
                    top: pixelTooltip.y + 'px'
                }">
                    <div class="tooltip-content">
                        <div class="tooltip-position">{{ $t('coordinates') }}: ({{ pixelTooltip.pixelX }}, {{ pixelTooltip.pixelY }})</div>
                        <div class="tooltip-user" :class="{ 'own-pixel': pixelTooltip.isOwnPixel }">
                            {{ pixelTooltip.isOwnPixel ? $t('ownPixel') : $t('userId') + ': ' + pixelTooltip.userId }}
                        </div>
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
        <div class="floating-status-indicator" v-if="isLoading || saveCountdown > 0">
          <span v-if="isLoading">{{ $t('loading') }}</span>
          <span v-else-if="saveCountdown > 0">{{ $t('autoSaveIn') }}: {{ saveCountdown }}{{ $t('seconds') }}</span>
        </div>

    <!-- 关于模态框 -->
    <AboutModal :visible="showAboutModal" @close="showAboutModal = false" />
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
            pixelSize: 4, // 每个像素的大小

            // 颜色相关
            selectedColor: '#FF0000',
            colors: [], // 常用颜色列表
            isColorPickerVisible: false, // 颜色选择器显示状态
            customColor: '#FF0000', // 自定义颜色
            isErasing: false, // 是否处于橡皮擦模式

            // 缩放和平移
            zoomLevel: 1,
            panX: 0,
            panY: 0,
            isPanning: false,
            lastPanPoint: { x: 0, y: 0 },

            // 像素数据
            pixelData: new Map(), // 存储所有像素数据 {key: {color, userId, timestamp}}

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
            
            // 自动保存倒计时
            saveCountdown: 0,
            countdownTimer: null,
            autoSaveTimer: null,

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
            }
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
    },

    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeydown)
        this.$refs.canvasContainer?.removeEventListener('wheel', this.handleWheel)
        
        // 清理定时器
        clearTimeout(this.autoSaveTimer)
        clearInterval(this.countdownTimer)
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
                this.checkExistingUser()
                this.loadColorsFromLocal()
                this.updateLoadingProgress(2)

                // 任务3: 加载像素数据
                this.globalLoading.text = this.$t('loadingPixelData')
                await this.loadPixelData()
                this.updateLoadingProgress(3)

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
                console.error('初始化失败:', error)
                this.globalLoading.show = false
                this.showError(
                    this.$t('initializationFailed'),
                    error.message || this.$t('initializationFailed'),
                    () => this.initializeApp()
                )
            }
        },

        /**
         * 更新加载进度
         */
        updateLoadingProgress(completedTasks) {
            this.globalLoading.completedTasks = completedTasks
        },

        /**
         * 加载像素数据（模拟异步操作）
         */
        async loadPixelData() {
            // 这里可以添加实际的API调用来加载像素数据
            return new Promise(resolve => {
                setTimeout(() => {
                    // 模拟加载完成
                    resolve()
                }, 300)
            })
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

                        // 绘制现有像素
                        this.drawAllPixels()
                        
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

                this.mapImage.src = '/img/Map.png'
            })
        },

        /**
         * 绘制背景地图
         */
        drawBackground() {
            if (this.mapImage && this.mapImage.complete) {
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
                this.drawSinglePixel(x, y, color)
            })
        },

        /**
         * 绘制单个像素
         */
        drawSinglePixel(x, y, color) {
            this.ctx.fillStyle = color
            this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize)
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
        },

        /**
         * 选择橡皮擦模式
         */
        selectEraser() {
            if (!this.isErasing) {
                this.isErasing = true
                this.previousColor = this.selectedColor
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

            if (this.isErasing) {
                // 检查是否是自己的像素
                const existingPixel = this.pixelData.get(key)
                if (existingPixel && existingPixel.userId === this.currentUserId) {
                    // 删除像素
                    this.pixelData.delete(key)
                    // 重绘被删除的区域
                    this.ctx.clearRect(x, y, this.pixelSize, this.pixelSize)
                    this.drawBackground()
                    this.drawAllPixels()
                } else {
                    this.showError(
                        this.$t('errorOccurred'),
                        this.$t('cannotEraseOthersPixels'),
                        null
                    )
                    return
                }
            } else {
                // 更新像素数据
                const pixelInfo = {
                    color: this.selectedColor,
                    userId: this.currentUserId,
                    timestamp: Date.now()
                }
                this.pixelData.set(key, pixelInfo)
                // 绘制像素
                this.drawSinglePixel(x, y, this.selectedColor)
            }

            // 自动保存到云端
            this.debounceAutoSave()
        },

        /**
         * 处理鼠标移动事件
         */
        handleMouseMove(event) {
            if (this.isPanning || this.isLoading) return

            const rect = this.canvas.getBoundingClientRect()
            const scaleX = this.canvas.width / rect.width
            const scaleY = this.canvas.height / rect.height

            const x = Math.floor((event.clientX - rect.left) * scaleX / this.pixelSize) * this.pixelSize
            const y = Math.floor((event.clientY - rect.top) * scaleY / this.pixelSize) * this.pixelSize

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
                    // 显示像素悬停提示
                    this.pixelTooltip = {
                        show: true,
                        x: event.clientX + 10,
                        y: event.clientY - 30,
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
        },

        /**
         * 隐藏像素预览
         */
        hidePreview() {
            this.previewPixel.show = false
            this.pixelTooltip.show = false
        },

        /**
         * 开始平移
         */
        startPan(event) {
            if (event.button === 1 || event.ctrlKey) { // 中键或Ctrl+左键
                this.isPanning = true
                this.lastPanPoint = { x: event.clientX, y: event.clientY }
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
                event.preventDefault()
            }
        },

        /**
         * 结束平移
         */
        endPan() {
            this.isPanning = false
        },

        /**
         * 放大
         */
        zoomIn() {
            this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5)
        },

        /**
         * 缩小
         */
        zoomOut() {
            this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.1)
        },

        /**
         * 重置缩放
         */
        resetZoom() {
            this.zoomLevel = 1
            this.panX = 0
            this.panY = 0
        },

        /**
         * 处理鼠标滚轮缩放
         */
        handleWheel(event) {
            event.preventDefault()

            const delta = event.deltaY > 0 ? 0.9 : 1.1
            this.zoomLevel = Math.max(0.1, Math.min(5, this.zoomLevel * delta))
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
                        this.loadFromCloud()
                    } else {
                        // 用户不存在，清除本地存储并显示登录弹窗
                        localStorage.removeItem('pixelArtUserId')
                        this.showLoginModal = true
                    }
                } catch (error) {
                    console.error('检查用户失败:', error)
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
                await this.setLoadingState(true)
                
                // 验证用户是否存在
                const userExists = await this.validateUser(userId)
                if (!userExists) {
                    // 如果用户不存在，自动创建用户记录
                    console.log('用户不存在，自动创建用户记录:', userId)
                    await this.createUserRecord(userId)
                }
                
                this.currentUserId = userId
                localStorage.setItem('pixelArtUserId', userId)
                this.showLoginModal = false
                
                // 更新最后登录时间
                await this.updateUserLastLogin(userId)
                
                // 重新加载新用户的数据
                this.loadFromCloud()
            } catch (error) {
                console.error('登录失败:', error)
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
                
                // 重新加载新用户的数据
                this.loadFromCloud()
            } catch (error) {
                console.error('创建用户失败:', error)
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
                // 将Map转换为普通对象
                const pixelDataObj = Object.fromEntries(this.pixelData)

                // 保存全局像素数据
                const GlobalPixels = AV.Object.extend('GlobalPixels')
                let globalPixels = await new AV.Query(GlobalPixels).first()

                if (!globalPixels) {
                    globalPixels = new GlobalPixels()
                }

                globalPixels.set('pixelData', pixelDataObj)
                globalPixels.set('lastUpdated', new Date())
                await globalPixels.save()

                this.lastSaved = new Date()

                console.log('数据保存成功')
            } catch (error) {
                console.error('保存失败:', error)
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
        async loadFromCloud() {
            if (this.isLoading) return

            await this.setLoadingState(true)

            try {
                // 加载全局像素数据
                const GlobalPixels = AV.Object.extend('GlobalPixels')
                const globalPixels = await new AV.Query(GlobalPixels).first()

                if (globalPixels) {
                    const pixelDataObj = globalPixels.get('pixelData') || {}
                    this.pixelData = new Map(Object.entries(pixelDataObj))
                }

                // 重新绘制画布
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
                this.drawBackground()
                this.drawAllPixels()

                console.log('数据加载成功')
            } catch (error) {
                console.error('加载失败:', error)
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
         * 防抖自动保存
         */
        debounceAutoSave() {
            // 清除之前的定时器
            clearTimeout(this.autoSaveTimer)
            clearInterval(this.countdownTimer)
            
            // 重置倒计时
            this.saveCountdown = 2
            
            // 启动倒计时显示
            this.countdownTimer = setInterval(() => {
                this.saveCountdown--
                if (this.saveCountdown <= 0) {
                    clearInterval(this.countdownTimer)
                }
            }, 1000)
            
            // 设置自动保存
            this.autoSaveTimer = setTimeout(() => {
                this.saveToCloud()
                this.saveCountdown = 0
                clearInterval(this.countdownTimer)
            }, 2000) // 2秒后自动保存
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
                console.error('验证用户失败:', error)
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
                console.log('用户记录创建成功:', userId)
            } catch (error) {
                console.error('创建用户记录失败:', error)
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
                console.error('更新用户登录时间失败:', error)
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

.tool-btn:hover:not(:disabled), .tool-btn.active {
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
}

.canvas-wrapper {
    position: relative;
    transform-origin: center;
    transition: transform 0.1s ease-out;
}

canvas {
    border: 2px solid #ccc;
    border-radius: var(--border-radius);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background-color: white;
}

/* 像素预览样式 */
.pixel-preview {
    position: fixed;
    width: 4px;
    height: 4px;
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
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>