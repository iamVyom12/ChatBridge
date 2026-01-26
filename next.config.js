/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to prevent double WebSocket/PeerJS connections
  // Note: Socket.IO and PeerJS WebSocket connections connect directly to backend
  // They cannot be proxied through Next.js rewrites
};

export default nextConfig;
