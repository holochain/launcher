<template>
  <HCDialog ref="dialog" @closing="$emit('closing-dialog')" closeOnSideClick>
    <div
      class="column"
      style="align-items: center; margin: 10px 15px; padding: 10px 20px"
    >
      <div
        class="column"
        style="width: 100%; align-items: flex-start; margin: 12px 0 40px 0"
      >
        <div class="row" style="align-items: center; margin-bottom: 20px">
          <!-- if icon provided -->
          <img
            v-if="imgSrc || imgSrcFetched"
            :src="imgSrc ? imgSrc : imgSrcFetched"
            alt="app icon"
            style="
              width: 120px;
              height: 120px;
              border-radius: 12px;
              object-fit: cover;
            "
          />
          <!-- if no icon provided -->
          <div
            v-else
            class="column center-content"
            style="
              width: 120px;
              height: 120px;
              border-radius: 12px;
              background: #372ba5;
              margin: 15px;
            "
          >
            <div style="color: white; font-size: 55px; font-weight: 600">
              {{ app.title.slice(0, 2) }}
            </div>
          </div>
          <div
            style="
              font-size: 30px;
              font-weight: 600;
              margin: 0 0 0 30px;
              line-height: 115%;
              word-break: normal;
            "
            :title="app.title"
          >
            {{ app.title }}
          </div>
        </div>

        <div style="margin-left: 10px">
          <span style="font-weight: 600">published by: </span
          >{{
            publisher
              ? `${publisher.name}, ${publisher.location.country}`
              : "unknown"
          }}
        </div>
        <div style="margin-left: 10px; margin-bottom: 20px">
          <span style="font-weight: 600">first published: </span
          >{{ new Date(app.published_at).toLocaleDateString(locale) }}
        </div>

        <div style="width: 100%; align-items: flex-end" class="column">
          <div>
            <div
              class="row"
              style="align-items: center"
              title="number of known peers that are part of the app distribution peer network and currently responsive"
            >
              <span
                style="
                  background-color: #17d310;
                  border-radius: 50%;
                  width: 10px;
                  height: 10px;
                  margin-right: 10px;
                "
              ></span>
              <span v-if="peerHostStatus"
                ><span style="font-weight: 600" :title="availablePeerHostList()"
                  >{{ peerHostStatus.responded.length }} available</span
                >
                peer host{{
                  peerHostStatus.responded.length === 1 ? "" : "s"
                }}</span
              >
              <span v-else>pinging peer hosts...</span>
            </div>
            <div
              class="row"
              style="align-items: center"
              title="number of known peers that registered themselves in the app distribution peer network but are currently unresponsive"
            >
              <span
                style="
                  background-color: #bfbfbf;
                  border-radius: 50%;
                  width: 10px;
                  height: 10px;
                  margin-right: 10px;
                "
              ></span>
              <span v-if="peerHostStatus"
                ><span style="font-weight: 600"
                  >{{
                    peerHostStatus.totalHosts - peerHostStatus.responded.length
                  }}
                  unresponsive</span
                >
                peer host{{
                  peerHostStatus.totalHosts -
                    peerHostStatus.responded.length ===
                  1
                    ? ""
                    : "s"
                }}</span
              >
              <span v-else>pinging peer hosts...</span>
            </div>
          </div>
        </div>

        <div style="font-weight: 600; font-size: 20px; margin: 20px 0 10px 0">
          Description:
        </div>

        <div
          style="
            max-height: 200px;
            min-width: 610px;
            overflow-y: auto;
            background: #f6f6fa;
            padding: 5px 10px;
            border-radius: 10px;
          "
        >
          {{ app.description }}
        </div>

        <div style="font-weight: 600; font-size: 20px; margin: 30px 0 10px 0">
          Available Releases:
        </div>

        <div v-if="releaseDatas && releaseDatas.length > 0">
          <div class="column card">
            <div style="text-align: right; font-weight: 600">
              latest Release
            </div>

            <div class="row" style="align-items: flex-end">
              <div class="column">
                <div>
                  <span style="font-weight: 600">hApp version:</span>
                  {{ releaseDatas[0].happRelease.content.version }}
                </div>
                <div>
                  <span style="font-weight: 600">UI version: </span
                  >{{
                    releaseDatas[0].guiRelease
                      ? releaseDatas[0].guiRelease.content.version
                      : "no official UI"
                  }}
                </div>
                <!-- GUI version as well here? Needs to be fetched independently from a DevHub host -->
              </div>
              <span style="display: flex; flex: 1"></span>
              <HCButton
                @click="
                  () =>
                    releaseDatas ? releaseSelected(releaseDatas[0]) : undefined
                "
                >Install</HCButton
              >
            </div>
          </div>

          <div class="row" style="margin: 20px 0 10px 10px">
            <div
              @click="showAdvanced = !showAdvanced"
              @keydown.enter="showAdvanced = !showAdvanced"
              class="row advanced-button"
              style="align-items: center"
              tabindex="0"
            >
              <div
                style="
                  text-align: center;
                  font-size: 24px;
                  width: 20px;
                  cursor: pointer;
                "
              >
                {{ showAdvanced ? "-" : "+" }}
              </div>
              <div style="font-size: 18px; margin-left: 10px">
                show older releases
              </div>
            </div>
            <span style="display: flex; flex: 1"></span>
          </div>

          <div
            v-show="showAdvanced"
            class="column"
            style="align-items: center; width: 100%"
          >
            <div v-if="releaseDatas.length < 2" style="text-align: center">
              No older releases available for this app.
            </div>
            <div v-else>
              <div
                v-for="releaseData of releaseDatas.slice(1)"
                :key="releaseData.happRelease.content.version"
                class="row card"
                style="align-items: flex-end; padding-top: 15px"
              >
                <div class="column">
                  <div>
                    <span style="font-weight: 600">hApp version:</span>
                    {{ releaseData.happRelease.content.version }}
                  </div>
                  <div>
                    <span style="font-weight: 600">UI version: </span
                    >{{
                      releaseData.guiRelease
                        ? releaseData.guiRelease.content.version
                        : "no official UI"
                    }}
                  </div>
                  <!-- GUI version as well here? Needs to be fetched independently from a DevHub host -->
                </div>
                <span style="display: flex; flex: 1"></span>
                <HCButton @click="() => releaseSelected(releaseData)"
                  >Install</HCButton
                >
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="releaseDatas && releaseDatas.length < 1"
          style="text-align: center"
        >
          There are no installable releases available for this app.
        </div>

        <div
          v-else-if="getReleaseDatasError"
          class="column"
          style="align-items: center"
        >
          <div
            style="
              background: #f4b2b2;
              padding: 5px 10px;
              border-radius: 5px;
              width: 610px;
            "
          >
            <span v-if="getReleaseDatasError.type == 'noHosts'"
              ><b>Error:</b> No peer host(s) found.</span
            >
            <span v-else
              ><b>Error:</b> Failed to fetch releases from peer host(s). See
              console for details.</span
            >
          </div>
          <HCButton
            @click="async () => await getReleaseDatas()"
            style="margin-top: 10px"
            >{{ $t("buttons.retry") }}</HCButton
          >
        </div>

        <div v-else class="column" style="align-items: center; width: 100%">
          <HCCircularProgress
            style="margin-top: 30px; margin-bottom: 20px"
          ></HCCircularProgress>
        </div>
      </div>

      <HCButton
        style="width: 80px; height: 30px; margin: 4px 6px; margin-bottom: 15px"
        outlined
        @click="cancel"
        >Close
      </HCButton>
    </div>
  </HCDialog>

  <HCSnackbar
    :timeoutMs="10000"
    :labelText="snackbarText"
    ref="snackbar"
  ></HCSnackbar>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

import HCButton from "./subcomponents/HCButton.vue";
import HCDialog from "./subcomponents/HCDialog.vue";
import HCSnackbar from "./subcomponents/HCSnackbar.vue";
import HCCircularProgress from "./subcomponents/HCCircularProgress.vue";

import { ResourceLocator, ReleaseData } from "../types";
import {
  AppEntry,
  Entity,
  GUIReleaseEntry,
  HappReleaseEntry,
  HostAvailability,
  PublisherEntry,
} from "../appstore/types";
import { AppWebsocket, encodeHashToBase64 } from "@holochain/client";
import { APPSTORE_APP_ID } from "../constants";
import {
  collectBytes,
  getHappReleasesFromHost,
  getPublisher,
  getVisibleHostsForZomeFunction,
  remoteCallToDevHubHost,
  tryWithHosts,
} from "../appstore/appstore-interface";
import { HappEntry } from "../devhub/types";
import { toSrc } from "../utils";

interface GetReleasesError {
  type: "noHosts" | "other";
  error: string;
}

export default defineComponent({
  name: "SelectReleaseDialog",
  emits: ["error", "closing-dialog", "release-selected", "cancel"],
  components: {
    HCCircularProgress,
    HCDialog,
    HCButton,
    HCSnackbar,
  },
  props: {
    app: {
      type: Object as PropType<AppEntry>,
      required: true,
    },
    appWebsocket: {
      type: Object as PropType<AppWebsocket>,
      required: true,
    },
    imgSrc: {
      type: String,
    },
  },
  data(): {
    showAdvanced: boolean;
    snackbarText: string | undefined;
    error: boolean;
    locale: string;
    getReleaseDatasError: GetReleasesError | undefined;
    imgSrcFetched: string | undefined;
    peerHostStatus: HostAvailability | undefined;
    pollInterval: number | null;
    publisher: PublisherEntry | undefined;
    releaseDatas: Array<ReleaseData> | undefined;
  } {
    return {
      showAdvanced: false,
      snackbarText: undefined,
      error: false,
      locale: "en-US",
      getReleaseDatasError: undefined,
      imgSrcFetched: undefined,
      peerHostStatus: undefined,
      pollInterval: null,
      publisher: undefined,
      releaseDatas: undefined,
    };
  },
  beforeUnmount() {
    window.clearInterval(this.pollInterval!);
  },
  async mounted() {
    const customLocale = window.localStorage.getItem("customLocale");
    this.locale = customLocale ? customLocale : navigator.language;

    // set up polling loop to periodically get gossip progress, global scope (window) seems to
    // be required to clear it again on beforeUnmount()
    const appStoreInfo = await this.appWebsocket!.appInfo({
      installed_app_id: APPSTORE_APP_ID,
    });

    // With multiple possible DevHub networks, available peers are not necessarily unique

    try {
      const result = await getVisibleHostsForZomeFunction(
        this.appWebsocket as AppWebsocket,
        appStoreInfo!,
        this.app.devhub_address.dna,
        "happ_library",
        "get_webhapp_package",
        4000
      );
      this.peerHostStatus = result;
    } catch (e) {
      console.error(`Failed to get peer host statuses: ${JSON.stringify(e)}`);
    }

    this.pollInterval = window.setInterval(async () => {
      const result = await getVisibleHostsForZomeFunction(
        this.appWebsocket as AppWebsocket,
        appStoreInfo!,
        this.app.devhub_address.dna,
        "happ_library",
        "get_webhapp_package",
        4000
      );

      this.peerHostStatus = result;
    }, 60000);
  },
  methods: {
    async getReleaseDatas(): Promise<void> {
      this.getReleaseDatasError = undefined;

      const appStoreInfo = await this.appWebsocket!.appInfo({
        installed_app_id: APPSTORE_APP_ID,
      });

      let happReleases: Array<Entity<HappReleaseEntry>> | undefined = undefined;

      const happLocator: ResourceLocator = {
        dna_hash: this.app.devhub_address.dna,
        resource_hash: this.app.devhub_address.happ,
      };

      const devHubDnaHash = this.app.devhub_address.dna;

      // first try to get HappEntry to ensure that happ is available at all
      // otherwise cascade to another host.
      try {
        happReleases = await tryWithHosts(
          async (host) => {
            // first check whether HappEntry can be fetched since 'get_happ_releases'
            // also succeeds (but with an empty array) if the devhub host does not yet
            // have the HappEntry which would misleadingly end up suggesting that there
            // are no happ releases for that happ.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _happEntry = await remoteCallToDevHubHost<Entity<HappEntry>>(
              this.appWebsocket as AppWebsocket,
              appStoreInfo!,
              happLocator.dna_hash,
              host,
              "happ_library",
              "get_happ",
              { id: happLocator.resource_hash }
            );

            return getHappReleasesFromHost(
              this.appWebsocket as AppWebsocket,
              appStoreInfo!,
              host,
              happLocator
            );
          },
          this.appWebsocket as AppWebsocket,
          appStoreInfo!,
          happLocator.dna_hash,
          "happ_library",
          "get_happ_releases"
        );
        // happReleases = await getHappReleases(this.appWebsocket as AppWebsocket, appStoreInfo, happLocator)
      } catch (e) {
        if (JSON.stringify(e).includes("No available peer host found")) {
          this.getReleaseDatasError = {
            type: "noHosts",
            error: "No available peer host found.",
          };
          console.error(
            `Failed to find available releases: ${JSON.stringify(e)}`
          );
          return;
        } else {
          this.getReleaseDatasError = {
            type: "other",
            error: `Failed to find available releases: ${JSON.stringify(e)}`,
          };
          console.error(
            `Failed to find available releases: ${JSON.stringify(e)}`
          );
          return;
        }
      }

      if (!happReleases) {
        this.getReleaseDatasError = {
          type: "other",
          error: `Failed to find available releases: happReleases undefined.`,
        };
        return;
      }

      // console.log("@getReleaseDatas: got happReleases: ", happReleases);

      // this.selectedHappReleases = happReleases.map((entity) => entity.content).sort((a, b) => b.last_updated - a.last_updated);
      const releaseDatas: Array<ReleaseData> = [];

      // console.log("@getReleaseDatas: fetching gui release entries...");

      try {
        await Promise.all(
          happReleases.map(async (happReleaseEntity) => {
            const releaseData: ReleaseData = {
              devhubDnaHash: devHubDnaHash,
              happRelease: happReleaseEntity,
              guiRelease: undefined,
            };

            const guiReleaseHash = happReleaseEntity.content.official_gui;
            if (guiReleaseHash) {
              const guiReleaseEntry = await tryWithHosts(
                (host) =>
                  remoteCallToDevHubHost<Entity<GUIReleaseEntry>>(
                    this.appWebsocket as AppWebsocket,
                    appStoreInfo!,
                    devHubDnaHash,
                    host,
                    "happ_library",
                    "get_gui_release",
                    { id: guiReleaseHash }
                  ),
                this.appWebsocket as AppWebsocket,
                appStoreInfo!,
                devHubDnaHash,
                "happ_library",
                "get_gui_release"
              );

              releaseData.guiRelease = guiReleaseEntry;
            }

            releaseDatas.push(releaseData);
          })
        );
      } catch (e) {
        if (JSON.stringify(e).includes("No available peer host found")) {
          this.getReleaseDatasError = {
            type: "noHosts",
            error: "No available peer host found.",
          };
          console.error(
            `Failed to find available releases: ${JSON.stringify(e)}`
          );
          return;
        } else {
          this.getReleaseDatasError = {
            type: "other",
            error: `Failed to find available releases: ${JSON.stringify(e)}`,
          };
          console.error(
            `Failed to find available releases: ${JSON.stringify(e)}`
          );
          return;
        }
      }

      this.releaseDatas = releaseDatas.sort(
        (a, b) =>
          b.happRelease.content.published_at -
          a.happRelease.content.published_at
      );
      this.getReleaseDatasError = undefined;
    },
    availablePeerHostList() {
      return this.peerHostStatus && this.peerHostStatus?.responded.length > 0
        ? this.peerHostStatus.responded
            .map((key) => encodeHashToBase64(key))
            .toString()
            .replaceAll(",", "\n")
        : undefined;
    },
    async open() {
      (this.$refs.dialog as typeof HCDialog).open();

      await Promise.all([
        this.fetchPublisher(),
        this.fetchIconIfNecessary(),
        this.getReleaseDatas(),
      ]);
    },
    async fetchIconIfNecessary() {
      // if icon not provided already by AppStore component, fetch it explicitly
      if (!this.imgSrc) {
        let appStoreInfo = undefined;
        try {
          appStoreInfo = await this.appWebsocket!.appInfo({
            installed_app_id: APPSTORE_APP_ID,
          });
          this.publisher = await getPublisher(
            this.appWebsocket,
            appStoreInfo!,
            this.app.publisher
          );
          const collectedBytes = await collectBytes(
            this.appWebsocket,
            appStoreInfo!,
            this.app.icon
          );
          this.imgSrcFetched = toSrc(
            collectedBytes,
            this.app.metadata.icon_mime_type
          );
        } catch (e) {
          console.error(`Failed to fetch icon: ${JSON.stringify(e)}`);
        }
      }
    },
    async fetchPublisher() {
      let appStoreInfo = undefined;

      try {
        appStoreInfo = await this.appWebsocket!.appInfo({
          installed_app_id: APPSTORE_APP_ID,
        });
        this.publisher = await getPublisher(
          this.appWebsocket,
          appStoreInfo!,
          this.app.publisher
        );
      } catch (e) {
        console.error(`Failed to get publisher info: ${JSON.stringify(e)}`);
      }
    },
    releaseSelected(releaseData: ReleaseData) {
      this.$emit("release-selected", {
        releaseData,
        appEntry: this.app,
      });
      this.close();
    },
    close() {
      (this.$refs.dialog as typeof HCDialog).close();
      this.$emit("closing-dialog");
    },
    cancel() {
      (this.$refs.dialog as typeof HCDialog).close();
      this.$emit("cancel");
    },
  },
});
</script>

<style scoped>
.advanced-button:hover {
  opacity: 0.8;
  cursor: pointer;
}

.card {
  min-width: 600px;
  background: #f6f6fa;
  border-radius: 15px;
  box-shadow: 0 0px 5px #9b9b9b;
  /* border: 2px solid #e1e1e1; */
  padding: 5px 15px 15px 15px;
  margin: 12px 0;
}
</style>
