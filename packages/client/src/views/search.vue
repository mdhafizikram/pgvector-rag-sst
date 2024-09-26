<template>
  <div class="container">
    <div class="d-flex align-items-center justify-content-center vh-100">
      <div class="w-60 d-flex flex-column align-self-center">
        <!-- Left Column: Big Text -->
        <div class="text-center mb-5
        ">
          <h1 class="text-lg" style="font-weight: bolder">
            DPL Academic Plan Similarity Search
          </h1>
        </div>

        <!-- Right Column: Input, Dropdowns, and Search Button -->
        <div class="px-4">
          <!-- Input Text Area -->
          <b-form-textarea
            id="textarea"
            v-model="userQuery"
            placeholder="Explain your academic interest here..."
            rows="3"
            max-rows="3"
            class="mb-2"
          ></b-form-textarea>
          <b-form-invalid-feedback :state="!userQuery ? false : null" class="">
            Please enter your query!
          </b-form-invalid-feedback>

          <!-- Dropdowns in a Single Row -->
          <div class="row mb-3">
            <div class="col">
              <vue-multiselect
                v-model="selectedDegreeType"
                :options="degreeTypeOptions"
                :max-height="120"
                track-by="id"
                label="name"
                :placeholder="
                  selectedDegreeType ? selectedDegreeType.name : 'Degree Plan'
                "
                :multiple="false"
                :close-on-select="true"
              ></vue-multiselect>
            </div>

            <div class="col">
              <vue-multiselect
                v-model="selectedAcadPlanType"
                :options="acadPlanTypesOptions"
                :max-height="120"
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





            <div class="col">
              <vue-multiselect
                v-model="selectedCount"
                :options="countOptions"
                :max-height="120"
                track-by="value"
                label="name"
                :placeholder="
                  selectedCount ? selectedCount.name : 'Count'
                "
                :multiple="false"
                :close-on-select="true"
              ></vue-multiselect>
            </div>
          </div>

          <!-- Search Button -->
          <div class="text-center">
            <b-button
              variant="warning"
              class="px-5 mt-2"
              style="width: 35%"
              pill
              @click="handleSearch"
              :disabled="
                loading ||
                !selectedDegreeType ||
                !selectedAcadPlanType ||
                !userQuery ||
                !selectedCount
              "
            >
              <template>
                <span v-if="loading">
                  <b-spinner small></b-spinner>
                </span>
                <span v-else>Search</span>
              </template>
            </b-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Search",
  data() {
    return {
      text: "",
      userQuery: "",
      selectedDegreeType: null,
       selectedCount: null,
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
      selectedAcadPlanType: null,

      loading: false, // Toggle during search
    };
  },
  methods: {
    async handleSearch() {
      this.loading = true;
      const degreeType = this.selectedDegreeType.name;
      const acadPlanType = this.selectedAcadPlanType.name;
      const count = this.selectedCount.value
      
      await new Promise((resolve) => setTimeout(resolve, 200));

      try {
        this.$router.push({
          path: "/acadplans",
          query: {
            degreeType,
            acadPlanType,
            count,
            q: this.userQuery,
          },
        });
      } catch (error) {
        console.error("Error fetching acadPlans:", error);
      } finally {
        this.loading = false;
      }
    },
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
.container-fluid {
  padding: 0;
}

.big-text {
  font-size: 3rem;
  font-weight: bold;
}

.dropdown-wrapper {
  display: flex;
  flex-direction: column;
}

.text-center {
  text-align: center;
}
</style>
