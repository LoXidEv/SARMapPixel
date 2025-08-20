<template>
  <div class="language-switcher">
    <div class="language-dropdown" @click="toggleDropdown" :class="{ active: isDropdownOpen }">
      <div class="current-language">
        <span class="language-name">{{ currentLanguage.name }}</span>
        <svg class="dropdown-arrow" :class="{ rotated: isDropdownOpen }" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>

      <transition name="dropdown">
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <div v-for="language in languages" :key="language.code" class="dropdown-item"
            :class="{ active: language.code === currentLocale }" @click.stop="selectLanguage(language.code)">
            <span class="language-name">{{ language.name }}</span>
            <svg v-if="language.code === currentLocale" class="check-icon" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'LanguageSwitcher',
  setup() {
    const { locale } = useI18n()
    const isDropdownOpen = ref(false)

    const languages = [
      { code: 'zh', name: '简体中文', flag: '🇨🇳' },
      { code: 'tc', name: '繁體中文', flag: '🇹🇼' },
      { code: 'en', name: 'English', flag: '🇺🇸' }
    ]

    const currentLocale = computed(() => locale.value)

    const currentLanguage = computed(() => {
      return languages.find(lang => lang.code === currentLocale.value) || languages[0]
    })

    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value
    }

    const selectLanguage = (languageCode) => {
      if (languageCode !== currentLocale.value) {
        locale.value = languageCode
        localStorage.setItem('lang', languageCode)
      }
      isDropdownOpen.value = false
    }

    const closeDropdown = (event) => {
      if (!event.target.closest('.language-switcher')) {
        isDropdownOpen.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', closeDropdown)
    })

    onUnmounted(() => {
      document.removeEventListener('click', closeDropdown)
    })

    return {
      languages,
      currentLocale,
      currentLanguage,
      isDropdownOpen,
      toggleDropdown,
      selectLanguage
    }
  }
}
</script>

<style scoped>
.language-switcher {
  position: relative;
  display: inline-block;
}

.language-dropdown {
  padding: 5px 8px;
  border: 2px solid var(--theme-color);
  background-color: white;
  color: var(--theme-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-family: 'Poppins Regular', sans-serif;
  font-size: 14px;
  transition: all 0.3s;
  min-width: 140px;
}

.language-dropdown:hover {
  background-color: var(--theme-color);
  color: white;
}

.language-dropdown.active {
  background-color: var(--theme-color);
  color: white;
}

.current-language {
  display: flex;
  align-items: center;
  gap: 6px;
}

.language-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid var(--theme-color);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  margin-top: 4px;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(70, 100, 176, 0.1);
  color: var(--theme-color);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: rgba(70, 100, 176, 0.1);
}

.dropdown-item.active {
  background: rgba(70, 100, 176, 0.15);
  color: var(--theme-color);
}

.dropdown-item.active .language-name {
  color: var(--theme-color);
  font-weight: 600;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: var(--theme-color);
  margin-left: auto;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .language-dropdown {
    min-width: 120px;
  }
  
  .language-name {
    font-size: 13px;
  }

  .dropdown-item {
    padding: 8px 10px;
  }
}
</style>