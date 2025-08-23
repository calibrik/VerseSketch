// const baseURL="http://10.14.5.10:80";
const baseURL=location.protocol;
// const baseURL="http://localhost:5151";

export const ConnectionConfig = {
    Api: `${baseURL}/api`
} as const;

