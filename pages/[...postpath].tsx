import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';
import styles from '../styles/Home.module.css';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const endpoint = process.env.WORDPRESS_GRAPHQL_ENDPOINT || "https://leolaedu.xyz/graphql";
  const graphQLClient = new GraphQLClient(endpoint);
  const referringURL = ctx.req.headers?.referer || null;
  const pathArr = ctx.query.postpath as Array<string>;
  const path = pathArr.join('/');
  const fbclid = ctx.query.fbclid;
  const instagramRedirect = ctx.query.igshid;

  // Handle social media redirects
  if (referringURL?.includes('facebook.com') || fbclid || instagramRedirect) {
    // Get social media preview data
    const query = gql`
      {
        post(id: "/${path}/", idType: URI) {
          id
          title
          excerpt
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          socialImage {
            sourceUrl
          }
        }
      }
    `;

    try {
      const data = await graphQLClient.request(query);
      
      if (!data.post) {
        return { notFound: true };
      }

      // Return preview data for social media
      return {
        props: {
          isPreview: true,
          post: {
            title: data.post.title,
            excerpt: data.post.excerpt,
            image: data.post.socialImage?.sourceUrl || data.post.featuredImage?.node?.sourceUrl,
            imageAlt: data.post.featuredImage?.node?.altText || data.post.title
          }
        }
      };
    } catch (error) {
      console.error('GraphQL Error:', error);
      return { notFound: true };
    }
  }

  // Normal WordPress redirect
  return {
    redirect: {
      permanent: false,
      destination: `${process.env.WORDPRESS_URL || 'https://leolaedu.xyz'}/${path}`,
    },
  };
};

interface PostProps {
  isPreview: boolean;
  post: {
    title: string;
    excerpt: string;
    image: string;
    imageAlt: string;
  };
}

const Post: React.FC<PostProps> = ({ isPreview, post }) => {
  // Remove HTML tags from excerpt
  const removeTags = (str: string) => {
    if (!str) return '';
    return str.replace(/(<([^>]+)>)/gi, '').replace(/\[[^\]]*\]/, '');
  };

  const cleanExcerpt = removeTags(post.excerpt);

  return (
    <div className={styles.container}>
      <Head>
        <title>{post.title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
        <meta name="description" content={cleanExcerpt}/>
        
        {/* Facebook Meta Tags */}
        <meta property="og:type" content="article"/>
        <meta property="og:title" content={post.title}/>
        <meta property="og:description" content={cleanExcerpt}/>
        <meta property="og:image" content={post.image}/>
        <meta property="og:image:type" content="image/jpeg"/>
        <meta property="og:image:width" content="1200"/>
        <meta property="og:image:height" content="630"/>
        <meta property="fb:app_id" content={process.env.NEXT_PUBLIC_FB_APP_ID}/>

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content={post.title}/>
        <meta name="twitter:description" content={cleanExcerpt}/>
        <meta name="twitter:image" content={post.image}/>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>{post.title}</h1>
        <div className={styles.imageContainer}>
          <Image
            src={post.image}
            alt={post.imageAlt}
            width={1200}
            height={630}
            layout="responsive"
            priority
          />
        </div>
        <div className={styles.excerpt} dangerouslySetInnerHTML={{ __html: post.excerpt }} />
      </main>
    </div>
  );
};

export default Post;
