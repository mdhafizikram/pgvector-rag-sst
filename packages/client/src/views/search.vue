<template>
  <div
    class="d-flex flex-column vh-100 align-items-center justify-content-center"
  >
    <!-- Left Column: Big Text -->
    <div class="text-center mb-4">
      <h1><b>DPL Academic Plan Similarity Search</b></h1>
    </div>

    <!-- Right Column: Input, Dropdowns, and Search Button -->
    <div class="w-50">
      <!-- Input Text Area -->
      <b-form-textarea
        id="textarea"
        v-model="userQuery"
        placeholder="Explain your academic interest here..."
        rows="3"
        max-rows="3"
        class="mb-3"
        @keydown.enter="handleSearch"
      ></b-form-textarea>
      <b-form-invalid-feedback :state="!userQuery ? false : null">
        Please enter your query
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
            :placeholder="selectedCount ? selectedCount.name : 'Count'"
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
        { id: 1, name: "5" },
        { id: 2, name: "10" },
      ],
      selectedAcadPlanType: null,

      loading: false, // Toggle during search
    };
  },
  computed: {
    isSearchDisabled() {
      return (
        this.loading ||
        !this.selectedDegreeType ||
        !this.selectedAcadPlanType ||
        !this.userQuery ||
        !this.selectedCount
      );
    },
  },
  methods: {
    async handleSearch() {
      if (this.isSearchDisabled) return;

      this.loading = true;
      const degreeType = this.selectedDegreeType.name;
      const acadPlanType = this.selectedAcadPlanType.name;
      const count = this.selectedCount.name;

      await new Promise((resolve) => setTimeout(resolve, 200));

      try {
        this.$router.push({
          path: "/acadplans",
          query: {
            degreeType,
            acadPlanType,
            resultCount: count,
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

.dropdown-wrapper {
  display: flex;
  flex-direction: column;
}
</style>
