<template>
  <header>
    <div class="icon-container">
      <font-awesome-icon :icon="['fas', 'home']" @click="router.push('/')" />
      <font-awesome-icon
        :icon="['fas', 'tags']"
        @click="router.push('/anki')"
      />
    </div>
    <font-awesome-icon
      :icon="[
        'fas',
        auth.isLoading ? 'spinner' : `sign-${auth.isLogin ? 'out' : 'in'}-alt`
      ]"
      :style="{
        color: auth.isLoading ? 'gray' : auth.isLogin ? 'crimson' : 'skyblue',
        cursor: 'pointer'
      }"
      @click="handleClick(auth.isLogin)"
    />
  </header>
</template>

<script setup lang="ts">
import axios from 'axios'

const auth = useAuthStore()
const router = useRouter()

const handleClick = async (isLogin: boolean) => {
  if (isLogin) {
    await axios.get('/api/auth/logout')
    router.push('/login')
  } else {
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
header {
  box-sizing: border-box;
  padding: 0.5rem;

  position: sticky;
  top: 0;

  width: 100%;
  height: 3rem;

  box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.3);

  display: flex;
  justify-content: space-between;
  align-items: center;

  .icon-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;

    * {
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all 0.2s;

      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      &:active {
        opacity: 0.6;
      }
    }
  }
}
</style>
