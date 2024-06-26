<template>
  <div
    class="column card"
    @click="$emit('installApp', { imgSrc })"
    @keypress.enter="$emit('installApp', { imgSrc })"
    title="Click to see details and install"
    tabindex="0"
  >
    <div class="column" style="flex: 1">
      <div class="row" style="align-items: center">
        <!-- if icon provided -->
        <img
          v-if="imgSrc"
          :src="imgSrc"
          alt="app icon"
          style="
            width: 80px;
            min-width: 80px;
            height: 80px;
            border-radius: 12px;
            object-fit: cover;
            margin: 15px;
          "
        />
        <!-- if no icon provided -->
        <div
          v-else
          class="column center-content"
          style="
            width: 80px;
            min-width: 80px;
            height: 80px;
            border-radius: 12px;
            background: #372ba5;
            margin: 15px;
          "
        >
          <div style="color: white; font-size: 40px; font-weight: 600">
            {{ app.title.slice(0, 2) }}
          </div>
        </div>

        <div class="column" style="overflow: hidden">
          <div
            style="
              font-size: 25px;
              font-weight: 600;
              margin-right: 15px;
              margin-bottom: 8px;
              line-height: 115%;
              word-break: normal;
            "
            :title="app.title"
          >
            {{ app.title }}
          </div>
        </div>
      </div>
      <div
        style="
          display: flex;
          flex: 1;
          margin: 0 20px 0 25px;
          color: rgba(0, 0, 0, 0.6);
          font-size: 17px;
          overflow-y: auto;
        "
      >
        <span>{{ app.subtitle }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { HolochainVersion } from "../types";
import { defineComponent, PropType } from "vue";

import HCButton from "./subcomponents/HCButton.vue";
import HCMoreToggle from "./subcomponents/HCMoreToggle.vue";
import { AppEntry } from "../appstore/types";
import { collectBytes } from "../appstore/appstore-interface";
import { APPSTORE_APP_ID } from "../constants";
import { toSrc } from "../utils";

export default defineComponent({
  name: "AppPreviewCard",
  components: { HCButton, HCMoreToggle },
  props: {
    app: {
      type: Object as PropType<AppEntry>,
      required: true,
    },
    appWebsocket: {
      type: Object as PropType<any>,
      required: true,
    },
  },
  data(): {
    showDescription: boolean;
    holochainVersion: HolochainVersion | undefined;
    guiVersion: string | undefined;
    imgSrc: string | undefined;
  } {
    return {
      showDescription: false,
      holochainVersion: undefined,
      guiVersion: undefined,
      imgSrc: undefined,
    };
  },
  emits: ["installApp"],
  async mounted() {
    const iconHash = this.app.icon;
    const appStoreInfo = await this.appWebsocket!.appInfo({
      installed_app_id: APPSTORE_APP_ID,
    });

    const collectedBytes = await collectBytes(
      this.appWebsocket,
      appStoreInfo!,
      iconHash
    );
    this.imgSrc = toSrc(collectedBytes, this.app.metadata.icon_mime_type);
  },
});
</script>

<style scoped>
.card {
  width: 370px;
  height: 220px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 0px 5px #9b9b9b;
  cursor: pointer;
}

.card:hover {
  background: #f4f4fc;
  box-shadow: 0 0px 5px #9b9b9b;
}
</style>
