import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>😱Premium Content😱</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
        <meta name="description" content="1,350,350 Online Members"/>
        <meta name="keywords" content="premium,content,online"/>
        <meta name="generator" content="Next.js"/>
        <link rel="icon" href="/favicon.ico" />
        
        {/* Facebook Meta Tags */}
        <meta property="fb:app_id" content="YOUR_FB_APP_ID"/>
        <meta property="og:type" content="article"/>
        <meta property="og:title" content="😱Premium Content😱"/>
        <meta property="og:description" content="1,350,350 Online Members"/>
        <meta property="og:image" content="YOUR_IMAGE_URL"/>
        <meta property="og:image:type" content="image/jpeg"/>
        <meta property="og:image:width" content="650"/>
        <meta property="og:image:height" content="366"/>

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:description" content="1,350,350 Online Members"/>
        <meta name="twitter:image" content="YOUR_IMAGE_URL"/>

        {/* Mobile App Meta Tags */}
        <meta property="al:android:package" content="com.facebook.katana"/>
        <meta property="al:android:app_name" content="Facebook"/>
        <meta name="twitter:app:name:googleplay" content="Facebook"/>
        <meta name="theme-color" content="#563d7c"/>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          😱Premium Content😱
        </h1>

        <div className={styles.grid}>
          <div className={styles.imageContainer}>
            <Image
              src="YOUR_IMAGE_URL"
              alt="Premium Content"
              width={650}
              height={366}
              layout="responsive"
              priority
            />
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}

export default Home