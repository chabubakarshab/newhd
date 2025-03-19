import React from 'react';
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const endpoint = "https://leolaedu.xyz/graphql";
  const graphQLClient = new GraphQLClient(endpoint);
  const pathArr = ctx.query.postpath as Array<string>;
  const path = pathArr.join('/');

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

    // Ensure image URL is absolute
    if (data.post.featuredImage?.node?.sourceUrl) {
      const imageUrl = data.post.featuredImage.node.sourceUrl;
      if (!imageUrl.startsWith('http')) {
        data.post.featuredImage.node.sourceUrl = `https://leolaedu.xyz${imageUrl}`;
      }
    }

    return {
      props: {
        post: data.post,
        host: ctx.req.headers.host || 'leolaedu.xyz',
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
}

const Post: React.FC<PostProps> = ({ post, host }) => {
  const imageUrl = post.featuredImage?.node?.sourceUrl || '';
  
  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta property="og:title" content={post.title} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:secure_url" content={imageUrl} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content={host.split('.')[0]} />
      </Head>
      <div className="post-container">
        <h1>{post.title}</h1>
        {imageUrl && (
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <img
              src={imageUrl}
              alt={post.featuredImage.node.altText || post.title}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </div>
        )}
        <article 
          dangerouslySetInnerHTML={{ __html: post.content }} 
          style={{
            maxWidth: '1200px',
            margin: '2rem auto',
            padding: '0 1rem'
          }}
        />
      </div>
      <style jsx global>{`
        .post-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 1rem;
        }
        h1 {
          text-align: center;
          margin: 2rem 0;
        }
        img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </>
  );
};

export default Post;
