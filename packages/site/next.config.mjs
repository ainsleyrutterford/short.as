/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enables static exports
  // https://nextjs.org/docs/app/building-your-application/deploying/static-exports#configuration
  output: 'export',

  // This is required because in the CloudFront Distribution we serve website files only if the user
  // visits the '/site/*' path
  // https://nextjs.org/docs/app/api-reference/next-config-js/basePath
  basePath: '/site',
};

export default nextConfig;
