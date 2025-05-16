<template>
  <div :class="$style.device">
    <ElmMdiIcon :class="$style.left" :d="mdiMonitor" size="2rem" />

    <div :class="$style.right">
      <div>
        <div :title="name" :class="$style.name">
          {{ name ?? "不明なデバイス" }}
        </div>
      </div>

      <div :class="$style['vertical-center']">
        <ElmMdiIcon :d="mdiDevices" size="1.25rem" />
        <ElmInlineText
          :text="`初回ログイン - ${createDate?.toLocaleString()}`"
        />
      </div>

      <div :class="$style['vertical-center']">
        <ElmMdiIcon :d="mdiAccountClock" size="1.25rem" />
        <ElmInlineText
          :text="`最終ログイン - ${lastAuthenticatedDate?.toLocaleString()}`"
        />
      </div>

      <div :class="$style['vertical-center']">
        <ElmMdiIcon :d="mdiMapMarker" size="1.25rem" />
        <ElmInlineText :text="`最終ログインIP - ${ip} - ${geo}`" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElmInlineText, ElmMdiIcon } from "@elmethis/core";
import { mdiMonitor, mdiDevices, mdiAccountClock, mdiMapMarker } from "@mdi/js";

const props = defineProps<{
  name?: string;
  createDate?: Date;
  lastAuthenticatedDate?: Date;
  ip?: string;
}>();

interface IpLocationInfo {
  accuracy: number;
  area_code: string;
  asn: number;
  continent_code: string;
  country: string;
  country_code: string;
  country_code3: string;
  ip: string;
  latitude: string;
  longitude: string;
  organization: string;
  organization_name: string;
}

const geo = ref<string | undefined>();

onMounted(async () => {
  if (props.ip) {
    const res = await fetch(`https://get.geojs.io/v1/ip/geo/${props.ip}.json`);
    const body: IpLocationInfo = await res.json();
    geo.value = `${body.country} ${body.organization_name}`;
  }
});
</script>

<style module lang="scss">
.device {
  box-sizing: border-box;
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.25rem;
  box-shadow: 0 0 0.125rem rgba(black, 0.3);
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;

  background-color: rgba(white, 0.2);

  &::selection {
    color: #cccfd5;
    background-color: var(--color, #3e434b);
  }

  [data-theme="dark"] & {
    background-color: rgba(white, 0.05);

    &::selection {
      color: #3e434b;
      background-color: var(--color, #cccfd5);
    }
  }
}

.left {
  padding: 1rem;
  flex-shrink: 0;
}

.right {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  gap: 0.5rem;
}

.name {
  box-sizing: border-box;
  width: calc(100% - 4.5rem);
  font-weight: bold;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  word-break: keep-all;

  color: #494f59;

  [data-theme="dark"] & {
    color: #cccfd5;
  }
}

.vertical-center {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
