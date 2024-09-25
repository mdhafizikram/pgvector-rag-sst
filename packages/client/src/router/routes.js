export default [
  {
    path: "/",
    name: "home",
    redirect: "/search",
  },
  {
    path: "/search",
    name: "search",
    component: () => import("../views/search.vue"),
  },
  {
    path: "/acadplans",
    name: "acadplans",
    component: () => import("../views/acadplans.vue"),
  },
  {
    path: "/details/acadplan/:code",
    name: "acadplandetails",
    component: () => import("../views/acadplandetails.vue"),
  },
];
