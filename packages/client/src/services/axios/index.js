import Axios from "axios";

const dplInstance = Axios.create({
  baseURL: import.meta.env.VITE_DPL_API_DOMAIN,
  responseType: "json",
  timeout: 20000,
});

const lambdaInstance = Axios.create({
  baseURL: import.meta.env.VITE_LAMBDA_API_DOMAIN,
  responseType: "json",
  timeout: 20000,
});

export { dplInstance, lambdaInstance };
