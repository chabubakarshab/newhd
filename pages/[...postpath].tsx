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
  const referringURL = ctx.req.headers?.referer || null;
  const pathArr = ctx.query.postpath as Array<string>;
  const path = pathArr.join('/');
  const fbclid = ctx.query.fbclid;

  console.log('Path:', path);  

  // Redirect if from Facebook
  if (referringURL?.includes('facebook.com') || fbclid) {
    return {
      redirect: {
        permanent: false,
        destination: `https://leolaedu.xyz/${encodeURI(path)}`,  
      },
    };
  }

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
    console.log('GraphQL Response:', JSON.stringify(data, null, 2));  

    if (!data.post) {
      return { notFound: true };
    }

    return {
      props: {
        path,
        post: data.post,
        host: ctx.req.headers.host || 'likop.xyz',  
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
    excerpt: string;
    content: string;
    dateGmt: string;
    modifiedGmt: string;
    featuredImage: {
      node: {
        sourceUrl: string;
        altText: string;
      };
    };
  };
  host: string;
  path: string;
}

const Post: React.FC<PostProps> = ({ post, host, path }) => {
  // Remove tags from excerpt
  const removeTags = (str: string) => {
    if (str === null || str === '') return '';
    else str = str.toString();
    return str.replace(/(<([^>]+)>)/gi, '').replace(/\[[^\]]*\]/, '');
  };

  return (
    <>
      <Head>
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={removeTags(post.excerpt)} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={host.split('.')[0]} />
        <meta property="article:published_time" content={post.dateGmt} />
        <meta property="article:modified_time" content={post.modifiedGmt} />
        <meta property="og:image" content={post.featuredImage.node.sourceUrl} />
        <meta
          property="og:image:alt"
          content={post.featuredImage.node.altText || post.title}
        />
        <title>{post.title}</title>
      </Head>
      <div className="post-container">
        <h1>{post.title}</h1>
        <img
          src={post.featuredImage.node.sourceUrl}
          alt={post.featuredImage.node.altText || post.title}
          style={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            margin: '2rem auto'
          }}
        />
        <article dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
      <style jsx global>{`
        .post-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }
        h1 {
          text-align: center;
          margin: 2rem 0;
          font-size: 2rem;
        }
      `}</style>
    </>
  );
};

export default Post;
