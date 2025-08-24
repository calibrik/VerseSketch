const baseURL=process.env.NODE_ENV === 'development'?"http://10.14.5.10:80":location.protocol;

export const ConnectionConfig = {
    Api: `${baseURL}/api`
} as const;

