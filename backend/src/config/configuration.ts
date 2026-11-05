export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  oracle: {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    mock: process.env.ORACLE_MOCK,
    poolMin: 2,
    poolMax: 10,
  },
  jwt: { secret: process.env.JWT_SECRET ?? 'dev_secret_key', expiresIn: '1d' },
});
