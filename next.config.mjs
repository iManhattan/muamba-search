/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storagegw.estaleiro.serpro.gov.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www25.receita.fazenda.gov.br",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
