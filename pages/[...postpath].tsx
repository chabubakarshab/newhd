import React, { useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

// TypeScript declarations
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Utility function to generate random string
const generateRandomString = (length: number) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

// Function to obfuscate URL parameters
const obfuscateParams = (url: string) => {
  const timestamp = Date.now().toString(36);
  const random = generateRandomString(8);
  return `${url}?_=${timestamp}${random}`;
};

// Function to detect Facebook-related IPs
const isFacebookIP = (ip: string | undefined): boolean => {
  if (!ip) return false;
  
  const facebookIPRanges = [
    '31.13.24.0/21',
    '31.13.64.0/18',
    '45.64.40.0/22',
    '66.220.144.0/20',
    '69.63.176.0/20',
    '69.171.224.0/19',
    '74.119.76.0/22',
  ];

  return facebookIPRanges.some(range => ip.startsWith(range.split('/')[0].slice(0, -1)));
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const endpoint = process.env.WORDPRESS_GRAPHQL_ENDPOINT || "https://leolaedu.xyz/graphql";
  const graphQLClient = new GraphQLClient(endpoint);
  const referringURL = ctx.req.headers?.referer || null;
  const userAgent = ctx.req.headers['user-agent'] || '';
  const pathArr = ctx.query.postpath as Array<string>;
  const path = pathArr.join('/');
  
  // Enhanced Facebook detection
  const isFacebookBot = (
    userAgent.toLowerCase().includes('facebookexternalhit') ||
    userAgent.toLowerCase().includes('facebot') ||
    userAgent.toLowerCase().includes('facebook') ||
    !!ctx.query.fbclid ||
    referringURL?.toLowerCase().includes('facebook.com') ||
    referringURL?.toLowerCase().includes('fb.com') ||
    referringURL?.toLowerCase().includes('fb.me') ||
    referringURL?.toLowerCase().includes('l.facebook.com')
  );

  // IP-based blocking
  const forwardedFor = ctx.req.headers['x-forwarded-for'] || '';
  const clientIP = (typeof forwardedFor === 'string' ? forwardedFor : forwardedFor[0]) || ctx.req.socket.remoteAddress;
  const isFromFacebookIP = isFacebookIP(clientIP);

  if (isFacebookBot || isFromFacebookIP) {
    // Return a modified version for Facebook crawlers
    return {
      redirect: {
        permanent: false,
        destination: `https://leolaedu.xyz/${encodeURI(path)}`,
      },
    };
  }

  // Enhanced security headers
  ctx.res.setHeader('X-Frame-Options', 'DENY');
  ctx.res.setHeader('X-Content-Type-Options', 'nosniff');
  ctx.res.setHeader('Referrer-Policy', 'no-referrer');
  ctx.res.setHeader('X-XSS-Protection', '1; mode=block');
  ctx.res.setHeader('Permissions-Policy', 'interest-cohort=(),microphone=(),camera=(),geolocation=()');
  ctx.res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  ctx.res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  ctx.res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  const query = gql`
    {
      post(id: "/${path}/", idType: URI) {
        id
        excerpt
        title
        link
        dateGmt
        modifiedGmt
        content
        author {
          node {
            name
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  `;

  try {
    const data = await graphQLClient.request(query);
    if (!data.post) {
      return { notFound: true };
    }

    // Obfuscate image URLs and add noise
    if (data.post.featuredImage?.node?.sourceUrl) {
      data.post.featuredImage.node.sourceUrl = obfuscateParams(data.post.featuredImage.node.sourceUrl);
    }

    // Clean and sanitize content
    if (data.post.content) {
      data.post.content = data.post.content
        .replace(/facebook\.com/gi, 'example.com')
        .replace(/fb\.com/gi, 'example.com')
        .replace(/fbcdn\.net/gi, 'example.com')
        .replace(/facebook\./gi, 'example.')
        .replace(/fbclid=[^&]*/gi, '')
        .replace(/fb_action_ids=[^&]*/gi, '');
    }

    return {
      props: {
        path,
        post: data.post,
        host: ctx.req.headers.host,
        nonce: generateRandomString(32),
      },
    };
  } catch (error) {
    console.error('GraphQL Error:', error);
    return { notFound: true };
  }
};

interface PostProps {
  post: {
    title: string;
    content: string;
    featuredImage: {
      node: {
        sourceUrl: string;
        altText?: string;
      };
    };
  };
  host: string;
  path: string;
  nonce: string;
}

const Post: React.FC<PostProps> = (props) => {
  const { post, host, nonce } = props;

  useEffect(() => {
    // Anti-debugging measures
    const debuggerTrap = () => {
      debugger;
      return debuggerTrap;
    };
    debuggerTrap();

    // Disable right-click and keyboard shortcuts
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey && e.key === 'u') || // View source
          (e.ctrlKey && e.key === 's') || // Save page
          (e.ctrlKey && e.key === 'p') || // Print
          (e.ctrlKey && e.key === 'g')) { // Find
        e.preventDefault();
      }
    });
    
    // Block Facebook pixel and tracking
    window.addEventListener('message', (e) => {
      if (e.data && typeof e.data === 'string' && 
         (e.data.includes('facebook') || e.data.includes('fb') || e.data.includes('pixel'))) {
        e.stopImmediatePropagation();
      }
    }, true);

    // Clean up iframe busters and tracking scripts
    const cleanScripts = () => {
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        if (script.innerHTML.includes('top.location') ||
            script.src.includes('facebook') ||
            script.src.includes('fb') ||
            script.innerHTML.includes('pixel')) {
          script.remove();
        }
      }
    };
    cleanScripts();
    
    // Add random noise to mouse movements
    document.addEventListener('mousemove', (e) => {
      const noise = Math.random() * 2 - 1;
      e.preventDefault();
      e.stopPropagation();
    });

    return () => {
      document.removeEventListener('contextmenu', e => e.preventDefault());
      document.removeEventListener('mousemove', e => e.preventDefault());
    };
  }, []);

  return (
    <>
      <Head>
        <meta httpEquiv="Content-Security-Policy" content={`
          default-src 'self';
          script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: https:;
          connect-src 'self';
          font-src 'self';
          object-src 'none';
          media-src 'self';
          frame-src 'none';
          frame-ancestors 'none';
          form-action 'self';
          base-uri 'none';
        `} />
        <meta name="referrer" content="no-referrer" />
        <meta name="robots" content="noindex,nofollow" />
        <meta name="googlebot" content="noindex,noarchive" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>{post.title}</title>
        <meta property="og:title" content="Educational Content" />
        <meta property="og:description" content="Educational resources and materials" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={host.split('.')[0]} />
        <style dangerouslySetInnerHTML={{ __html: `
          * { 
            user-select: none !important; 
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
          }
          img { 
            pointer-events: none !important;
            -webkit-user-drag: none !important;
            -khtml-user-drag: none !important;
            -moz-user-drag: none !important;
            -o-user-drag: none !important;
          }
          body {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
          }
        `}} />
      </Head>
      <div className="post-container" style={{ opacity: 0.99 }}>
        <h1>{post.title}</h1>
        <div style={{ position: 'relative' }}>
          <img
            src={post.featuredImage.node.sourceUrl}
            alt={post.featuredImage.node.altText || post.title}
            style={{ 
              maxWidth: '100%',
              height: 'auto',
              filter: 'contrast(1.03) brightness(0.97)',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          />
          <div style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'transparent',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 999
          }} />
        </div>
        <article 
          dangerouslySetInnerHTML={{ 
            __html: post.content
              .replace(/facebook\.com/gi, 'example.com')
              .replace(/fb\.com/gi, 'example.com')
              .replace(/fbcdn\.net/gi, 'example.com')
              .replace(/facebook\./gi, 'example.')
              .replace(/data-fb/gi, 'data-custom')
              .replace(/fb:/gi, 'custom:')
          }} 
          style={{
            position: 'relative',
            zIndex: 1
          }}
        />
      </div>
    </>
  );
};

export default Post;
