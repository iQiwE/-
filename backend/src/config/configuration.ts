export default () => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length < 16) {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be set and at least 16 characters long.');
  }

  return {
    port: parseInt(process.env.PORT ?? '4000', 10),
    oracle: {
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
      mock: process.env.ORACLE_MOCK,
      poolMin: 2,
      poolMax: 10,
    },
    jwt: {
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    },
  };
};
