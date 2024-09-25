<template>
  <div>
    <div class="p-4" style="background-color: white">
      <div style="margin-left: 90px; margin-right: 90px" class="p-4">
        <div class="d-flex justify-content-between align-items-center">
          <!-- Back to search -->
          <div @click="goBack" style="cursor: pointer">
            <b-icon icon="arrow-left-circle"></b-icon>
            <span class="mx-2">Back to search</span>
          </div>

          <!-- Why chosen button aligned to the right -->
          <b-button
            style="margin-left: 10px"
            variant="light"
            size="sm"
            @click="fetchReasoning(acadPlan.acadPlanCode)"
            :disabled="acadPlan.isGettingReason"
          >
            <template v-if="this.isGettingReason">
              <b-spinner small></b-spinner>
            </template>
            <template v-else>
              Why Suggested?
              <span :class="reason ? 'arrow-up' : 'arrow-down'"></span>
            </template>
          </b-button>
        </div>

        <!-- Reasoning text shown when visible -->
        <div v-if="reason" class="reasoning-div p-3 mt-2">
          {{ this.reason }}
        </div>
        <div class="card-body pt-4">
          <h3 class="card-title mb-3">{{ acadPlan.acadPlanDescription }}</h3>
          <h5 class="card-subtitle mb-2 text-muted">
            {{ acadPlan.acadPlanCode }}
          </h5>
          <p>
            <strong>Marketing Description:</strong>
            {{ acadPlan.acadPlanMarketingDescription }}
          </p>
          <p v-if="acadPlan.degreeDescriptionLong">
            <strong>Degree Description:</strong>
            {{ acadPlan.degreeDescriptionLong }}
          </p>
          <div
            class="p-3"
            style="background-color: #ebf8ff; border: 2px solid #cbe7f5"
          >
            <div v-html="acadPlan.fullDescription"></div>
            <p><strong>Type:</strong> {{ acadPlan.acadPlanType }}</p>
            <p v-if="acadPlan.acadProgramCode">
              <strong>Program Code:</strong> {{ acadPlan.acadProgramCode }}
            </p>
            <p v-if="acadPlan.mathIntensityCode">
              <strong>Math Intensity Code:</strong
              >{{ acadPlan.mathIntensityCode }}
            </p>
          </div>

          <div v-if="acadPlan.careerOpportunities" class="mt-4 py-4">
            <strong style="background-color: #cbe7f5" class="p-2"
              >Career Opportunities:</strong
            >
            <p
              style="margin-top: 15px"
              v-html="acadPlan.careerOpportunities"
            ></p>
          </div>
          <hr v-if="acadPlan.careerOpportunities" class="blue-line" />

          <div v-if="acadPlan.degreeRequirements" class="mt-4 py-4">
            <strong style="background-color: #cbe7f5" class="p-2"
              >Degree Requirements:</strong
            >
            <p
              style="margin-top: 15px"
              v-html="acadPlan.degreeRequirements"
            ></p>
          </div>
          <hr v-if="acadPlan.degreeRequirements" class="blue-line" />
          <div v-if="acadPlan.admissionsRequirementsText" class="mt-4 py-4">
            <strong style="background-color: #cbe7f5" class="p-2"
              >Admissions Requirements</strong
            >
            <p
              style="margin-top: 15px"
              v-html="acadPlan.admissionsRequirementsText"
            ></p>
          </div>
          <p v-if="acadPlan.mathIntensityDescription">
            <strong>Math Intensity Description:</strong>
            {{ acadPlan.mathIntensityDescription }}
          </p>
        </div>
      </div>

      <!-- b-spinner -->
      <div v-if="pageLoader" class="page-loader">
        <b-spinner
          style="width: 3rem; height: 3rem"
          variant="primary"
        ></b-spinner>
        <span class="loader-text">Searching for acad-plans...</span>
      </div>
    </div>
  </div>
</template>

<script>
import { lambdaInstance, dplInstance } from "../services/axios";

export default {
  name: "AcadPlanDetails",
  data() {
    return {
      reason: "",
      isGettingReason: false,
      userQuery: "",
      acadPlan: {},
      pageLoader: false,
      gettingReason: "",
      isReasonVisible: false,
    };
  },
  methods: {
    async fetchReasoning(acadPlanCode) {
      try {
        if (!this.reason) {
          if (this.gettingReason.reasoning) {
            this.reason = this.gettingReason.reasoning;
          } else {
            this.isGettingReason = true;
            const reasoningResponse = await lambdaInstance.get("/reasoning", {
              params: {
                acadPlanCode,
                prompt: this.userQuery,
              },
            });
            this.reason = reasoningResponse.data.reasoning;
            this.gettingReason.reasoning = reasoningResponse.data.reasoning;
          }
        } else {
          this.reason = "";
        }
      } catch (error) {
        console.error("Error fetching reasoning:", error);
      } finally {
        this.isGettingReason = false;
      }
    },
    goBack() {
      if (window.history.length > 1) {
        this.$router.go(-1);
      } else {
        this.$router.push("/search");
      }
    },
    async fetchAcadPlanData(id) {
      try {
        const response = await dplInstance.get(`/api/codeset/acad-plan/${id}`, {
          params: {
            include: "detail",
            include: "*",
          },
        });

        this.acadPlan = response.data;
      } catch (error) {
        console.error("Failed to fetch acadPlan data:", error);
      }
    },
  },

  async created() {
    this.pageLoader = true;
    try {
      const { code } = this.$route.params;
      this.gettingReason = this.$route.query || {};
      this.userQuery = this.$route.query.userQuery;

      // //remove the query param from the URL
      // if (this.gettingReason)
      //   this.$router.replace({ query: {} }).catch(() => {});

      await this.fetchAcadPlanData(code);
    } catch (error) {
      console.error("Failed to fetch acadPlan data:", error);
    } finally {
      this.pageLoader = false;
    }
  },
};
</script>

<style scoped>
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.reasoning-div {
  background-color: #fff6e7;
}
.arrow-down::before {
  content: "▼";
}
.arrow-up::before {
  content: "▲";
}
</style>
