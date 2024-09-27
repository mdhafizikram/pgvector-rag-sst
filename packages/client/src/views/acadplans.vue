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
          ></b-form-input>
          <b-form-invalid-feedback :state="!userQuery ? false : null">
            Please enter your query!
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
            :disabled="
              loading ||
              !selectedDegreeType ||
              !selectedAcadPlanType ||
              !userQuery
            "
          >
            Search
          </b-button>
        </div>
      </div>
    </div>

    <!-- acadPlans list -->
    <div class="container">
      <div
        v-if="acadPlans.length > 0"
        class="row mt-4 pt-4 d-flex justify-content-center"
      >
        <div
          v-for="(acadPlan, index) in acadPlans"
          :key="index"
          class="col-md-4 mb-4"
        >
          <div class="card h-100 shadow fixed-card-size">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="card-title">
                  {{ acadPlan.metadata.acadPlanDescription }}
                </h5>
              </div>
              <h6 class="card-subtitle mb-2 text-muted">
                {{ acadPlan.metadata.id }}
              </h6>
              <p
                class="card-text"
                v-html="acadPlan.metadata.degreeDescriptionText"
              ></p>
            </div>
            <div class="mb-4 mx-3">
              <div class="d-flex align-items-center">
                <b-button
                  style="cursor: pointer; font-size: 12px"
                  variant="warning"
                  size="sm"
                  @click="goToDetails(acadPlan.metadata.id)"
                  >Learn more
                  <b-icon icon="arrow-right-short"></b-icon>
                </b-button>
                <b-button
                  class="wide-button"
                  style="margin-left: 10px"
                  variant="light"
                  size="sm"
                  @click="fetchReasoning(index, acadPlan.metadata.id)"
                  :disabled="acadPlan.isGettingReason"
                >
                  <template v-if="acadPlan.isGettingReason">
                    <b-spinner small></b-spinner>
                  </template>
                  <template v-else>
                    Why Suggested?
                    <span
                      :class="acadPlan.reasoning ? 'arrow-up' : 'arrow-down'"
                    ></span>
                  </template>
                </b-button>
                <h6
                  style="margin-left: 8px; font-size: 14px"
                  class="mt-1 text-danger"
                >
                  {{ Math.round(acadPlan.score * 100) }}% match
                </h6>
              </div>

              <!-- Reasoning text shown when visible -->
              <div v-if="acadPlan.reasoning" class="reasoning-div p-2">
                {{ acadPlan.reasoning }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not found message-->
    <div v-if="this.checkApiResponse" class="no-acadplans-card">
      <div class="no-acadplans-content">
        <!-- X-mark icon -->
        <div class="x-mark-icon">
          <svg
            style="border: 6px solid black; border-radius: 50px; padding: 2px"
            xmlns="http://www.w3.org/2000/svg"
            height="70"
            width="70"
            viewBox="0 0 384 512"
          >
            <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
            />
          </svg>
        </div>

        <!-- Message -->
        <h2>No Academic Plans Found</h2>
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
        { value: 5, name: "5" },
        { value: 10, name: "10" },
      ],
      watch: {
        // Watch for changes in the route query parame (Need to fix)
        "$route.query": {
          immediate: true,
          handler(newQuery) {
            // Update the degree type dropdown if the query parameter changes
            if (newQuery.degreeType) {
              this.selectedDegreeType =
                this.degreeTypeOptions.find(
                  (option) => option.name === newQuery.degreeType
                ) || "";
            }

            // Update the math intensity dropdown
            if (newQuery.acadPlanType) {
              this.selectedAcadPlanType =
                this.acadPlanTypesOptions.find(
                  (option) => option.name === newQuery.acadPlanType
                ) || "";
            }

            // Update the search query text input
            if (newQuery.q) {
              this.userQuery = newQuery.q;
            }
          },
        },
      },
    };
  },

  computed: {
    isCentered() {
      return !this.acadPlans.length; // True when acadPlans is not visible
    },
    showReasonButton() {
      return Object.keys(this.$route.query).length;
    },
  },

  methods: {
    handleInput() {
      if (this.userQuery) {
        this.inputFocused = false; // Hide message and red border when typing
      }
    },

    async handleSearch() {
      this.loading = true;
      const degreeTypeName = this.selectedDegreeType.name;
      const acadPlanTypeName = this.selectedAcadPlanType.name;
      const countValue = this.selectedCount;
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
          console.log(response.data.results.length);
          this.acadPlans = response.data.results;
          this.$router
            .push({
              query: {
                degreeType: this.selectedDegreeType.name,
                acadPlanType: this.selectedAcadPlanType.name,
                count: this.selectedCount.name,
                q: this.userQuery,
              },
            })
            .catch(() => {});
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

    async fetchReasoning(index, acadPlanCode) {
      try {
        if (!this.acadPlans[index].reasoning) {
          this.$set(this.acadPlans[index], "isGettingReason", true);

          const reasoningResponse = await lambdaInstance.get("/reasoning", {
            params: {
              acadPlanCode,
              prompt: this.userQuery,
            },
          });

          if (reasoningResponse.data && reasoningResponse.data.reasoning) {
            this.$set(
              this.acadPlans[index],
              "reasoning",
              reasoningResponse.data.reasoning
            );
          }
        } else {
          this.acadPlans[index].reasoning = "";
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
    const { degreeType, acadPlanType, count, q } = this.$route.query;

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

    if (count) {
      this.selectedCount =
        this.countOptions.find((option) => option.name === count) || "";
    }

    if (degreeType && acadPlanType && q) {
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
.background-container {
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.move-top {
  justify-content: flex-start;
  height: auto;
  padding-top: 20px;
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
.wide-button {
  min-width: 120px;
  font-size: 12px;
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
.card {
  position: relative;
  overflow: visible;
  width: 340px;
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
