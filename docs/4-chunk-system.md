# 4区块加载系统技术文档

## 概述

4区块加载系统是SAR Map Pixel项目中的核心性能优化机制，将原本的64个小区块系统重构为4个大区块系统，显著提升了画布加载性能和用户体验。

## 系统架构

### 区块划分策略

画布被智能分割为4个大区块，按照以下规则进行划分：

```
+----------+----------+
| 区块 0   | 区块 1   |
| (左上)   | (右上)   |
+----------+----------+
| 区块 2   | 区块 3   |
| (左下)   | (右下)   |
+----------+----------+
```

### 动态区块计算

每个区块的尺寸根据画布总尺寸动态计算：

```javascript
const bigChunkWidth = Math.ceil(canvasWidth / 2)
const bigChunkHeight = Math.ceil(canvasHeight / 2)
```

### 区块范围计算

每个区块的像素范围按照以下逻辑计算：

- **区块 0 (左上)**：`(0, 0)` 到 `(bigChunkWidth-1, bigChunkHeight-1)`
- **区块 1 (右上)**：`(bigChunkWidth, 0)` 到 `(canvasWidth-1, bigChunkHeight-1)`
- **区块 2 (左下)**：`(0, bigChunkHeight)` 到 `(bigChunkWidth-1, canvasHeight-1)`
- **区块 3 (右下)**：`(bigChunkWidth, bigChunkHeight)` 到 `(canvasWidth-1, canvasHeight-1)`

## 核心功能实现

### 1. 顺序加载机制

```javascript
async loadAllChunksSequentially() {
  const totalChunks = 4
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    this.loadingStatus.currentChunk = chunkIndex
    await this.loadSingleChunk(chunkIndex)
  }
}
```

### 2. 区块命名系统

```javascript
getChunkTableName(chunkIndex) {
  return `chunk_${chunkIndex}`
}
```

### 3. 像素坐标转换

```javascript
pixelToChunk(x, y) {
  const bigChunkWidth = Math.ceil(this.canvasWidth / 2)
  const bigChunkHeight = Math.ceil(this.canvasHeight / 2)
  
  const chunkX = Math.floor(x / bigChunkWidth)
  const chunkY = Math.floor(y / bigChunkHeight)
  
  return chunkY * 2 + chunkX
}
```

### 4. 草稿数据加载

```javascript
loadLocalDraftForChunk(chunkIndex) {
  const bigChunkWidth = Math.ceil(this.canvasWidth / 2)
  const bigChunkHeight = Math.ceil(this.canvasHeight / 2)
  
  const chunkX = chunkIndex % 2
  const chunkY = Math.floor(chunkIndex / 2)
  
  const minX = chunkX * bigChunkWidth
  const maxX = Math.min((chunkX + 1) * bigChunkWidth - 1, this.canvasWidth - 1)
  const minY = chunkY * bigChunkHeight
  const maxY = Math.min((chunkY + 1) * bigChunkHeight - 1, this.canvasHeight - 1)
  
  // 加载指定范围内的草稿像素
}
```

## 性能优化特性

### 1. 减少网络请求

- **原系统**：64个区块 = 64次网络请求
- **新系统**：4个区块 = 4次网络请求
- **性能提升**：网络请求减少93.75%

### 2. 智能缓存机制

- 已加载的区块数据会被缓存在内存中
- 避免重复请求相同区块的数据
- 支持区块级别的数据更新

### 3. 错误恢复能力

- 单个区块加载失败不影响其他区块
- 支持独立重试失败的区块
- 提供详细的错误信息和恢复建议

### 4. 渐进式加载

- 区块按顺序依次加载，用户可以看到加载进度
- 已加载的区块立即可用，无需等待全部完成
- 提供实时的加载状态反馈

## 数据结构

### 区块数据表结构

每个区块在LeanCloud中对应一个独立的数据表：

```
表名：chunk_0, chunk_1, chunk_2, chunk_3

字段：
- objectId: 唯一标识符
- x: 像素X坐标
- y: 像素Y坐标
- color: 像素颜色值
- userId: 创建用户ID
- createdAt: 创建时间
- updatedAt: 更新时间
```

### 内存缓存结构

```javascript
chunkData: {
  0: Map(), // 区块0的像素数据
  1: Map(), // 区块1的像素数据
  2: Map(), // 区块2的像素数据
  3: Map()  // 区块3的像素数据
}
```

## 兼容性考虑

### 数据迁移

从64区块系统迁移到4区块系统时，需要考虑：

1. **数据重新分配**：将原有64个小区块的数据重新分配到4个大区块
2. **坐标映射**：确保像素坐标正确映射到新的区块系统
3. **渐进式迁移**：支持新旧系统并存的过渡期

### 向后兼容

- 保持像素坐标系统不变
- 用户操作接口保持一致
- 数据格式向后兼容

## 监控和调试

### 加载状态监控

```javascript
loadingStatus: {
  isLoading: false,
  currentChunk: 0,
  totalChunks: 4,
  loadedChunks: 0,
  failedChunks: []
}
```

### 性能指标

- 区块加载时间
- 网络请求数量
- 内存使用情况
- 错误率统计

## 未来优化方向

1. **自适应区块大小**：根据网络状况动态调整区块数量
2. **预加载机制**：预测用户行为，提前加载相关区块
3. **压缩优化**：对区块数据进行压缩传输
4. **CDN缓存**：利用CDN加速区块数据分发

## 总结

4区块加载系统通过智能的区块划分和优化的加载策略，显著提升了SAR Map Pixel的性能表现。该系统不仅减少了网络请求数量，还提供了更好的用户体验和错误恢复能力，为大规模协作像素艺术平台奠定了坚实的技术基础。