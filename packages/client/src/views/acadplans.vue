<template>
  <div>
    <!-- Loader when fetching data -->
    <div v-if="loading" class="page-loader">
      <b-spinner
        style="width: 3rem; height: 3rem"
        variant="primary"
      ></b-spinner>
      <div class="loader-text">Searching for acad-plans...</div>
    </div>

    <!-- Centered Input Bar, Dropdown, and Search Button -->
    <div class="search-container px-3">
      <div class="dropdowns-search-line bg-white py-4 pr-5">
        <div class="search-header text-nowrap mr-4">
          DPL Acadplan Similarity Search
        </div>
        <div
          class="input-bar"
          :class="{ 'red-border': inputFocused && !userQuery }"
        >
          <b-form-input
            style="margin-top: 1px"
            v-model="userQuery"
            @input="handleInput"
            placeholder="I'm interested in Computer science..."
            aria-label="User query"
            :state="!userQuery ? false : null"
            @keydown.enter="handleSearch"
          ></b-form-input>
          <b-form-invalid-feedback :state="!userQuery ? false : null">
            Please enter your query
          </b-form-invalid-feedback>
        </div>

        <!-- Dropdowns and Search Button on the same line -->

        <!-- Dropdowns -->
        <div class="dropdown-item p-0">
          <vue-multiselect
            v-model="selectedDegreeType"
            :options="degreeTypeOptions"
            :max-height="160"
            :disabled="!userQuery"
            track-by="id"
            label="name"
            :placeholder="
              selectedDegreeType ? selectedDegreeType.name : 'Degree Plan'
            "
            :multiple="false"
            :close-on-select="true"
          ></vue-multiselect>
        </div>
        <div class="dropdown-item p-0">
          <vue-multiselect
            v-model="selectedAcadPlanType"
            :options="acadPlanTypesOptions"
            :max-height="160"
            :disabled="!userQuery"
            track-by="id"
            label="name"
            :placeholder="
              selectedAcadPlanType
                ? selectedAcadPlanType.name
                : 'Acad Plan Type'
            "
            :multiple="false"
            :close-on-select="true"
          ></vue-multiselect>
        </div>

        <!-- Search Button -->
        <div class="search-btn">
          <b-button
            class="ml-4"
            style="width: 104%"
            variant="warning"
            @click="handleSearch"
            :disabled="isSearchDisabled"
          >
            <span v-if="loading">
              <b-spinner small></b-spinner>
            </span>
            <span v-else>Search</span>
          </b-button>
        </div>
      </div>
    </div>
    <!--Query Expansion-->

    <div
      v-if="expandedQuery"
      class="query-expansion-result my-3 mx-3 py-2 px-2"
      style="
        border: 1px solid rgb(120 188 225);
        box-shadow: rgb(198 227 243) 0px 0px 10px inset;
        border-radius: 5px;
      "
    >
      <span>
        <strong class="mr-2">Showing Results for:</strong>
        <i>{{ expandedQuery }}</i>
      </span>
    </div>

    <!-- acadPlans list -->
    <b-container fluid class="mt-4">
      <b-row :cols-xl="getColCount" no-gutters align-h="start">
        <b-col
          v-for="(acadPlan, index) in acadPlans"
          :key="index"
          class="mb-4"
          cols="12"
        >
          <b-card class="d-flex flex-column h-100">
            <!-- Card takes full height -->

            <!-- Content Area -->
            <div class="flex-grow-1">
              <!-- This div grows to fill available space -->
              <b-card-title>{{
                acadPlan.metadata.acadPlanDescription
              }}</b-card-title>
              <b-card-text class="text-muted">{{
                acadPlan.metadata.id
              }}</b-card-text>
              <b-card-text>{{
                acadPlan.metadata.degreeDescriptionText
              }}</b-card-text>
            </div>

            <!-- Fixed Button and Match Percentage Section at Bottom -->
            <template #footer>
              <div class="d-flex align-items-center text-nowrap">
                <!-- 'mt-auto' pushes this section to bottom -->
                <b-button
                  variant="warning"
                  size="sm"
                  @click="goToDetails(acadPlan.metadata.id)"
                >
                  Learn more <b-icon icon="arrow-right-short"></b-icon>
                </b-button>

                <b-button
                  style="margin-left: 5px"
                  variant="light"
                  size="sm"
                  @click="toggleReasoning(index, acadPlan.metadata.id)"
                  :disabled="acadPlan.isGettingReason"
                >
                  <template v-if="acadPlan.isGettingReason">
                    <b-spinner small></b-spinner>
                  </template>
                  <template v-else>
                    Why Suggested?
                    <span
                      :class="
                        acadPlan.displayReason ? 'arrow-up' : 'arrow-down'
                      "
                    ></span>
                  </template>
                </b-button>

                <h6
                  style="margin-left: 5px"
                  class="mt-1 text-danger font-weight-bold"
                >
                  {{ Math.round(acadPlan.score * 100) }}% match
                </h6>
              </div>
            </template>

            <!-- Reasoning Section -->
            <div
              v-if="acadPlan.displayReason && acadPlan.reasoning"
              class="reasoning-div p-2"
            >
              {{ acadPlan.reasoning }}
            </div>
          </b-card>
        </b-col>
      </b-row>
    </b-container>

    <!-- NO acadplans found message-->
    <div
      v-if="checkApiResponse && !acadPlans.length && !loading && userQuery"
      class="no-acadplans-card"
    >
      <div class="bg-white p-5 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="100"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5 15.538l-3.592-3.548 3.546-3.587-1.416-1.403-3.545 3.589-3.588-3.543-1.405 1.405 3.593 3.552-3.547 3.592 1.405 1.405 3.555-3.596 3.591 3.55 1.403-1.416z"
          />
        </svg>
        <h2 class="mt-4">No Academic Plans Found</h2>
        <h6 class="text-muted">Please try changing your query or filters</h6>
      </div>
    </div>
  </div>
</template>

<script>
import Multiselect from "vue-multiselect";
import { lambdaInstance } from "../services/axios";

export default {
  components: {
    "vue-multiselect": Multiselect,
  },
  name: "AcadPlans",
  data() {
    return {
      userQuery: "",
      inputFocused: false,
      checkApiResponse: false,
      expandedQuery: "",

      selectedDegreeType: "",
      selectedAcadPlanType: "",

      loading: false,
      acadPlans: [],
      selected: [],
      selectedCount: "",
      acadPlanTypesOptions: [
        { id: 1, name: "MAJ" },
        { id: 2, name: "MIN" },
        { id: 3, name: "UGRAD" },
        { id: 4, name: "SPU" },
        { id: 5, name: "PRE" },
        { id: 6, name: "CER" },
        { id: 7, name: "NDG" },
        { id: 8, name: "SAC" },
      ],
      degreeTypeOptions: [
        { id: 1, name: "UG" },
        { id: 2, name: "GR" },
        { id: 3, name: "UGCM" },
        { id: 4, name: "OTHR" },
      ],
      countOptions: [
        { id: 1, name: "5" },
        { id: 2, name: "10" },
      ],
    };
  },

  computed: {
    isCentered() {
      return !this.acadPlans.length;
    },
    showReasonButton() {
      return Object.keys(this.$route.query).length;
    },
    isSearchDisabled() {
      return (
        this.loading ||
        !this.selectedDegreeType ||
        !this.selectedAcadPlanType ||
        !this.userQuery ||
        !this.selectedCount
      );
    },
    getColCount() {
      return window.innerWidth > 1366 ? 4 : 3;
    },
  },

  methods: {
    handleInput() {
      if (this.userQuery) {
        this.inputFocused = false; // Hide message and red border when typing
      }
    },

    async handleSearch() {
      if (this.isSearchDisabled) return;

      this.loading = true;
      const degreeTypeName = this.selectedDegreeType.name;
      const acadPlanTypeName = this.selectedAcadPlanType.name;
      const countValue = this.selectedCount.name;
      try {
        const response = await lambdaInstance.get("/similarity-search", {
          params: {
            prompt: this.userQuery,
            acadPlanType: acadPlanTypeName,
            degreeType: degreeTypeName,
            count: countValue,
          },
        });

        if (response.data && response.data.results.length) {
          this.acadPlans = response.data.results;
          this.expandedQuery = response.data.expandedUserQuery;
          const currentQuery = this.$route.query;
          const newQuery = {
            degreeType: this.selectedDegreeType.name,
            acadPlanType: this.selectedAcadPlanType.name,
            resultCount: this.selectedCount.name,
            q: this.userQuery,
          };
          if (JSON.stringify(currentQuery) !== JSON.stringify(newQuery)) {
            // Only navigate if the query has changed
            this.$router.push({ query: newQuery });
          }
        } else {
          this.checkApiResponse = true;

          this.acadPlans = [];
        }
      } catch (error) {
        console.error("Error fetching acadPlans:", error);
      } finally {
        this.loading = false;
      }
    },
    toggleReasoning(index, acadPlanCode) {
      if (this.acadPlans[index].displayReason) {
        this.$set(this.acadPlans[index], "displayReason", false);
      } else {
        if (!this.acadPlans[index].reasoning) {
          this.fetchReasoning(index, acadPlanCode);
        } else {
          this.$set(this.acadPlans[index], "displayReason", true);
        }
      }
    },

    async fetchReasoning(index, acadPlanCode) {
      try {
        if (!this.acadPlans[index].reasoning) {
          this.$set(this.acadPlans[index], "isGettingReason", true);

          const reasoningResponse = await lambdaInstance.get("/reasoning", {
            params: {
              acadPlanCode,
              prompt: this.expandedQuery,
            },
          });

          if (reasoningResponse.data && reasoningResponse.data.reasoning) {
            this.$set(
              this.acadPlans[index],
              "reasoning",
              reasoningResponse.data.reasoning
            );
            this.$set(this.acadPlans[index], "displayReason", true); // Show reasoning
          }
        }
      } catch (error) {
        console.error("Error fetching reasoning:", error);
      } finally {
        this.$set(this.acadPlans[index], "isGettingReason", false);
      }
    },
    goToDetails(acadPlanCode) {
      const selectedPlan = this.acadPlans.find(
        (plan) => plan.metadata.id === acadPlanCode
      );
      const reasoning = selectedPlan.reasoning ?? "";
      this.$router
        .push({
          name: "acadplandetails",
          params: { code: acadPlanCode },
          query: { reasoning, userQuery: this.userQuery },
        })
        .catch(this.handle);
    },

    showMessage() {
      this.inputFocused = true;
    },
  },

  mounted() {
    const { degreeType, acadPlanType, resultCount, q } = this.$route.query;

    // Set the user query
    if (q) {
      this.userQuery = q;
    }

    // Set the degree type dropdown
    if (degreeType) {
      this.selectedDegreeType =
        this.degreeTypeOptions.find((option) => option.name === degreeType) ||
        "";
    }

    // Set the math intensity dropdown
    if (acadPlanType) {
      this.selectedAcadPlanType =
        this.acadPlanTypesOptions.find(
          (option) => option.name === acadPlanType
        ) || "";
    }

    if (resultCount) {
      this.selectedCount =
        this.countOptions.find((option) => option.name === resultCount) || "";
    }

    if (degreeType && acadPlanType && q && resultCount) {
      this.handleSearch();
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

.loader-text {
  color: white;
  font-size: 1.2rem;
  margin-top: 10px;
}

.search-header {
  text-align: left;
  font-size: 20px;
  font-weight: bold;
  width: 311px;
}

.search-container {
  top: 0;
  left: 0;
  right: 0;
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #ffff;
}

.input-bar {
  width: 35%;
  margin-right: 10px;
}

.dropdowns-search-line {
  display: flex;
  justify-content: space-between;
  width: 100%;
  border-radius: 90px;
}

.dropdown-item {
  width: 20%;
  margin-right: 10px;
}

.search-btn {
  width: 8%;
}

.arrow-down::before {
  content: "▼";
}
.arrow-up::before {
  content: "▲";
}
.reasoning-div {
  background-color: #fff6e7;

  transition: all 0.3s ease-in-out;
  margin-top: 12px;
}
.card-footer {
  background-color: white !important;
  border-top: 0 !important;
}
.card {
  position: relative;
  overflow: visible;
  width: 380px;
}
.no-acadplans-card {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.no-acadplans-content {
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 40%;
  height: 300px;
}

.x-mark-icon {
  color: #dc3545;
  margin-bottom: 20px;
  margin-top: 40px;
}
</style>
