import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description, keywords, url }) => {
  // Always use your custom domain as the "Canonical" (master) URL for SEO
  const canonicalBaseUrl = 'https://coinmarketscap.online';
  const canonicalUrl = url ? `${canonicalBaseUrl}${url}` : canonicalBaseUrl;

  // Use the current domain the user is actually visiting for social media sharing links
  const currentBaseUrl = typeof window !== 'undefined' ? window.location.origin : canonicalBaseUrl;
  const currentUrl = url ? `${currentBaseUrl}${url}` : currentBaseUrl;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph / Facebook tags */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />

      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      
      {/* This tells Google that the custom domain is the primary one, even if they visit the Vercel link */}
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
};

export default SEO;
