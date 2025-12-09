const CLERK_ISSUER_URL = process.env.CLERK_ISSUER_URL;

export default {
  providers: [
    {
      domain: CLERK_ISSUER_URL,
      applicationID: "convex",
    },
  ],
};
