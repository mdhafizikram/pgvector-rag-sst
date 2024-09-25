import VueRouter from "vue-router";
import routes from "./routes";
const router = new VueRouter({
  routes,
  mode: "hash",
});
export default router;
