import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
  noIndex?: boolean;
}

const SEO: React.FC<SEOProps> = ({ title, description, keywords, url = '/', image = '/og-image.png', noIndex = false }) => {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL || 'https://mindful-canvas.vercel.app';
  const canonicalBaseUrl = configuredSiteUrl.replace(/\/$/, '');
  const canonicalPath = url.startsWith('/') ? url : `/${url}`;
  const canonicalUrl = `${canonicalBaseUrl}${canonicalPath}`;

  // Use the current domain the user is actually visiting for social media sharing links
  const currentBaseUrl = typeof window !== 'undefined' ? window.location.origin : canonicalBaseUrl;
  const currentUrl = `${currentBaseUrl}${canonicalPath}`;
  const socialImageUrl = image.startsWith('http') ? image : `${canonicalBaseUrl}${image}`;

  // Structured Data (JSON-LD) for Search Engines
  const schemaMarkup = url === '/' ? {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Mindful Canvas",
    "alternateName": "Mindful Canvas Note App",
    "url": canonicalUrl,
    "description": description,
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "All",
    "creator": {
      "@type": "Person",
      "name": "Caleb Anayolico",
      "url": "https://anayolico.name.ng"
    }
  } : null;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="theme-color" content="#5951e5" />

      {/* Open Graph / Facebook tags */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={socialImageUrl} />
      <meta property="og:site_name" content="Mindful Canvas" />

      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImageUrl} />
      
      {/* This tells Google that the custom domain is the primary one, even if they visit the Vercel link */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Inject Structured Data */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
