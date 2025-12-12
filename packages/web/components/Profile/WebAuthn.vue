<template>
  <div class="container">
    <ElmMdiIcon :d="mdiKey" size="2rem" class="left" />

    <div class="right">
      <ElmInlineText :text="friendlyCredentialName ?? 'unknown'" bold />

      <ElmInlineText :text="credentialId ?? 'unknown'" />

      <div>
        <ElmInlineText text="RelyingParty ID: " bold />
        <ElmInlineText :text="relyingPartyId ?? 'unknown'" code />
      </div>

      <div>
        <ElmInlineText text="Authenticator Attachment: " bold />
        <ElmInlineText :text="authenticatorAttachment ?? 'unknown'" code />
      </div>

      <div>
        <ElmInlineText text="Authenticator Transports: " bold />
        <ElmInlineText
          v-for="name in authenticatorTransports"
          :text="name"
          code
        />
      </div>

      <div>
        <ElmInlineText text="createdAt: " bold />
        <ElmInlineText :text="createdAt?.toLocaleString() ?? 'unknown'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElmInlineText, ElmMdiIcon } from "@elmethis/vue";
import { mdiKey } from "@mdi/js";

interface ProfileWebAuthnProps {
  credentialId?: string;

  friendlyCredentialName?: string;

  relyingPartyId?: string;

  /**
   * @see https://www.w3.org/TR/webauthn-2/#enum-transport
   */
  authenticatorTransports?: Array<"usb" | "nfc" | "ble" | "internal" | string>;

  /**
   * @see https://www.w3.org/TR/webauthn-2/#enum-attachment
   */
  authenticatorAttachment?: "platform" | "cross-platform" | string;

  createdAt?: Date;
}

withDefaults(defineProps<ProfileWebAuthnProps>(), {
  authenticatorTransports: () => [],
});
</script>

<style scoped lang="scss">
.container {
  box-sizing: border-box;
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.25rem;
  box-shadow: 0 0 0.125rem rgba(black, 0.3);

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
  width: calc(100% - 4.5rem);
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
