"use client"

import { useEffect, useRef } from "react"
import heroImg from "../assets/hero.png"
import Navbar from "../components/Navbar"
import '../styles/home.css'
import { motion, useInView, useAnimation } from "framer-motion"

function Home() {
  // Refs for scroll animations
  const statsRef = useRef(null)
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 })
  const statsControls = useAnimation()

  // Animate stats when they come into view
  useEffect(() => {
    if (isStatsInView) {
      statsControls.start("visible")
    }
  }, [isStatsInView, statsControls])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 },
    },
    hover: {
      scale: 1.03,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3 },
    },
  }

  // Counter animation component
  const Counter = ({ from, to, duration = 2 }) => {
    const nodeRef = useRef(null)
    const controls = useAnimation()
    const inView = useInView(nodeRef, { once: true, amount: 0.5 })

    useEffect(() => {
      if (inView) {
        controls.start({
          count: to,
          transition: { duration },
        })
      }
    }, [inView, controls, to, duration])

    return (
      <motion.span
        ref={nodeRef}
        initial={{ count: from }}
        animate={controls}
        className="text-4xl font-bold text-purple-600"
      >
        {({ count }) => Math.floor(count)}
      </motion.span>
    )
  }

  return (
    <div className="app">
      {/* Header */}
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="container hero-container">
            <div className="hero-content">
              <h1 className="hero-title">
                Find the right freelancer for your <span className="text-accent">project needs</span> and{" "}
                <span className="text-accent">requirements</span>
              </h1>
              <p className="hero-description">Discover talented freelancers to bring your ideas to life.</p>
              {/* <div className="search-container">
                <input type="text" placeholder="Freelancer skills, Keyword..." className="search-input" />
                <button className="btn btn-primary search-btn">Find Freelancer</button>
              </div> */}
              {/* <div className="suggestions">
                <span className="suggestion-label">Suggestion:</span>
                <a href="#" className="suggestion-link">
                  UI/UX Designer
                </a>
                ,
                <a href="#" className="suggestion-link">
                  Programming
                </a>
                ,
                <a href="#" className="suggestion-link accent">
                  Digital Marketing
                </a>
                ,
                <a href="#" className="suggestion-link">
                  Video
                </a>
                ,
                <a href="#" className="suggestion-link">
                  Animation
                </a>
                .
              </div> */}
            </div>
            <div className="hero-image">
              <img src={heroImg || "/placeholder.svg"} alt="Freelancer platform illustration" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <div className="container">
            <div className="section-header">
              <span className="section-badge">Features</span>
              <h2 className="section-title">Why Choose GoWithFlow</h2>
              <p className="section-description">
                Our platform provides everything you need to succeed in the freelance marketplace.
              </p>
            </div>
            <div className="features-grid">
              <div className="freelancer-card shadow-sm">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="#9333EA"
                      strokeWidth="2"
                    />
                    <path
                      d="M15 9L9 15"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 9L15 15"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="feature-title">Secure Payments</h3>
                <p className="feature-description">
                  Our escrow system ensures you only pay for work you're satisfied with.
                </p>
              </div>
              <div className="freelancer-card shadow-sm">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z"
                      stroke="#9333EA"
                      strokeWidth="2"
                    />
                    <path d="M12 15V23" stroke="#9333EA" strokeWidth="2" />
                    <path d="M7 20H17" stroke="#9333EA" strokeWidth="2" />
                  </svg>
                </div>
                <h3 className="feature-title">Verified Talent</h3>
                <p className="feature-description">All freelancers are vetted and reviewed to ensure quality work.</p>
              </div>
              <div className="freelancer-card shadow-sm">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#9333EA" strokeWidth="2" />
                    <path d="M12 6V12L16 14" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="feature-title">Time-Saving Tools</h3>
                <p className="feature-description">
                  Project management tools to keep your projects on track and on time.
                </p>
              </div>
              <div className="freelancer-card shadow-sm">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="feature-title">Fast Matching</h3>
                <p className="feature-description">
                  Our AI-powered matching system connects you with the perfect talent quickly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* NEW SECTION: Success Stories with Framer Motion Animations */}
        <section className="py-20 bg-black  overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 text-sm bg-purple-600 text-white rounded-lg mb-2">
                Success Stories
              </span>
              <h2 className="text-3xl font-bold mb-3">Real Results, Real Impact</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                See how GoWithFlow has transformed businesses and freelancer careers worldwide.
              </p>
            </div>

            {/* Animated Statistics */}
            <motion.div
              ref={statsRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-12"
              variants={containerVariants}
              initial="hidden"
              animate={statsControls}
            >
              <motion.div
                className="bg-[#1c1c1f] text-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300 hover:-translate-y-1"
                variants={itemVariants}
              >
                <div className="flex justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Happy Clients</h3>
                <div className="flex justify-center items-center">
                  <Counter from={0} to={15000} duration={2.5} />
                  <span className="text-4xl font-bold text-purple-600">+</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-[#1c1c1f] rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300 hover:-translate-y-1"
                variants={itemVariants}
              >
                <div className="flex justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 4L12 14.01L9 11.01"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Projects Completed</h3>
                <div className="flex justify-center items-center">
                  <Counter from={0} to={28500} duration={2.5} />
                  <span className="text-4xl font-bold text-purple-600">+</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-[#1c1c1f] rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300 hover:-translate-y-1"
                variants={itemVariants}
              >
                <div className="flex justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">5-Star Reviews</h3>
                <div className="flex justify-center items-center">
                  <Counter from={0} to={9800} duration={2.5} />
                  <span className="text-4xl font-bold text-purple-600">+</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-[#1c1c1f] rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300 hover:-translate-y-1"
                variants={itemVariants}
              >
                <div className="flex justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M2 12H22" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path
                      d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"
                      stroke="#9333EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Countries Served</h3>
                <div className="flex justify-center items-center">
                  <Counter from={0} to={120} duration={2.5} />
                  <span className="text-4xl font-bold text-purple-600">+</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Animated Testimonials */}
            {/* <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="bg-[#1c1c1f] rounded-xl p-8 relative shadow-sm h-full flex flex-col"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="absolute top-4 right-4 opacity-20">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 11H6C5.46957 11 4.96086 10.7893 4.58579 10.4142C4.21071 10.0391 4 9.53043 4 9V7C4 6.46957 4.21071 5.96086 4.58579 5.58579C4.96086 5.21071 5.46957 5 6 5H8C8.53043 5 9.03914 5.21071 9.41421 5.58579C9.78929 5.96086 10 6.46957 10 7V15C10 16.0609 9.57857 17.0783 8.82843 17.8284C8.07828 18.5786 7.06087 19 6 19H5"
                      stroke="#9333EA"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 11H16C15.4696 11 14.9609 10.7893 14.5858 10.4142C14.2107 10.0391 14 9.53043 14 9V7C14 6.46957 14.2107 5.96086 14.5858 5.58579C14.9609 5.21071 15.4696 5 16 5H18C18.5304 5 19.0391 5.21071 19.4142 5.58579C19.7893 5.96086 20 6.46957 20 7V15C20 16.0609 19.5786 17.0783 18.8284 17.8284C18.0783 18.5786 17.0609 19 16 19H15"
                      stroke="#9333EA"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-white leading-relaxed mb-6 flex-grow">
                  GoWithFlow transformed my business. I found an amazing developer who delivered my project ahead of
                  schedule and exceeded all expectations.
                </p>
                <div className="flex items-center mt-auto">
                  <img
                    src="/avatar-testimonial1.jpg"
                    alt="Client"
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">Sarah Johnson</h4>
                    <p className="text-sm text-gray-600">Startup Founder</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-[#1c1c1f] rounded-xl p-8 relative shadow-sm h-full flex flex-col"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="absolute top-4 right-4 opacity-20">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 11H6C5.46957 11 4.96086 10.7893 4.58579 10.4142C4.21071 10.0391 4 9.53043 4 9V7C4 6.46957 4.21071 5.96086 4.58579 5.58579C4.96086 5.21071 5.46957 5 6 5H8C8.53043 5 9.03914 5.21071 9.41421 5.58579C9.78929 5.96086 10 6.46957 10 7V15C10 16.0609 9.57857 17.0783 8.82843 17.8284C8.07828 18.5786 7.06087 19 6 19H5"
                      stroke="#9333EA"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 11H16C15.4696 11 14.9609 10.7893 14.5858 10.4142C14.2107 10.0391 14 9.53043 14 9V7C14 6.46957 14.2107 5.96086 14.5858 5.58579C14.9609 5.21071 15.4696 5 16 5H18C18.5304 5 19.0391 5.21071 19.4142 5.58579C19.7893 5.96086 20 6.46957 20 7V15C20 16.0609 19.5786 17.0783 18.8284 17.8284C18.0783 18.5786 17.0609 19 16 19H15"
                      stroke="#9333EA"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-white leading-relaxed mb-6 flex-grow">
                  As a freelancer, this platform has been a game-changer. The quality of clients and projects is
                  outstanding, and I've doubled my income in just 6 months.
                </p>
                <div className="flex items-center mt-auto">
                  <img
                    src="/avatar-testimonial2.jpg"
                    alt="Freelancer"
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">David Chen</h4>
                    <p className="text-sm text-gray-600">UI/UX Designer</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-[#1c1c1f] rounded-xl p-8 relative shadow-sm h-full flex flex-col"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="absolute top-4 right-4 opacity-20">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 11H6C5.46957 11 4.96086 10.7893 4.58579 10.4142C4.21071 10.0391 4 9.53043 4 9V7C4 6.46957 4.21071 5.96086 4.58579 5.58579C4.96086 5.21071 5.46957 5 6 5H8C8.53043 5 9.03914 5.21071 9.41421 5.58579C9.78929 5.96086 10 6.46957 10 7V15C10 16.0609 9.57857 17.0783 8.82843 17.8284C8.07828 18.5786 7.06087 19 6 19H5"
                      stroke="#9333EA"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 11H16C15.4696 11 14.9609 10.7893 14.5858 10.4142C14.2107 10.0391 14 9.53043 14 9V7C14 6.46957 14.2107 5.96086 14.5858 5.58579C14.9609 5.21071 15.4696 5 16 5H18C18.5304 5 19.0391 5.21071 19.4142 5.58579C19.7893 5.96086 20 6.46957 20 7V15C20 16.0609 19.5786 17.0783 18.8284 17.8284C18.0783 18.5786 17.0609 19 16 19H15"
                      stroke="#9333EA"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-white leading-relaxed mb-6 flex-grow">
                  We needed specialized talent for our enterprise project. Within 48 hours, we connected with three
                  perfect candidates and completed our project under budget.
                </p>
                <div className="flex items-center mt-auto">
                  <img
                    src="/avatar-testimonial3.jpg"
                    alt="Enterprise Client"
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">Michael Rodriguez</h4>
                    <p className="text-sm text-gray-600">Project Manager</p>
                  </div>
                </div>
              </motion.div>
            </motion.div> */}

            {/* Animated CTA */}
            
          </div>
        </section>

        {/* Top Freelancers Section */}
        {/*  */}

        {/* CTA Section */}
        <section className="cta">
          <div className="container">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Get Started?</h2>
              <p className="cta-description">Join thousands of freelancers and businesses already using GoWithFlow.</p>
              <div className="cta-buttons">
                <button className="btn btn-primary">Sign Up as Freelancer</button>
                <button className="btn btn-outline">Post a Project</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="logo-icon"
                >
                  <circle cx="12" cy="12" r="10" stroke="#9333EA" strokeWidth="2" />
                  <path
                    d="M8 12L11 15L16 9"
                    stroke="#9333EA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="logo-text">GoWithFlow</span>
              </div>
              <p className="footer-tagline">Connecting talent with opportunity worldwide.</p>
            </div>
            <div className="footer-links">
              <h3 className="footer-heading">For Freelancers</h3>
              <ul className="footer-menu">
                <li>
                  <a href="#" className="footer-link">
                    Find Work
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Create Profile
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Success Stories
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-links">
              <h3 className="footer-heading">For Clients</h3>
              <ul className="footer-menu">
                <li>
                  <a href="#" className="footer-link">
                    Post a Job
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Find Freelancers
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Enterprise Solutions
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Success Stories
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-links">
              <h3 className="footer-heading">Resources</h3>
              <ul className="footer-menu">
                <li>
                  <a href="#" className="footer-link">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="copyright">© {new Date().getFullYear()} GoWithFlow. All rights reserved.</p>
            <div className="social-links">
              <a href="#" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M23 3.01006C23 3.01006 20.9821 4.20217 19.86 4.54006C19.2577 3.84757 18.4573 3.35675 17.567 3.13398C16.6767 2.91122 15.7395 2.96725 14.8821 3.29451C14.0247 3.62177 13.2884 4.20446 12.773 4.96377C12.2575 5.72309 11.9877 6.62239 12 7.54006V8.54006C10.2426 8.58562 8.50127 8.19587 6.93101 7.4055C5.36074 6.61513 4.01032 5.44869 3 4.01006C3 4.01006 -1 13.0101 8 17.0101C5.94053 18.408 3.48716 19.109 1 19.0101C10 24.0101 21 19.0101 21 7.51006C20.9991 7.23151 20.9723 6.95365 20.92 6.68006C21.9406 5.67355 23 3.01006 23 3.01006Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a href="#" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a href="#" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M17 2H7C4.23858 2 2 4.23858 2 7V17C2 19.7614 4.23858 22 7 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 11.3701C16.1234 12.2023 15.9812 13.0523 15.5937 13.7991C15.2062 14.5459 14.5931 15.1515 13.8416 15.5297C13.0901 15.908 12.2384 16.0397 11.4077 15.906C10.5771 15.7723 9.80971 15.3801 9.21479 14.7852C8.61987 14.1903 8.22768 13.4229 8.09402 12.5923C7.96035 11.7616 8.09202 10.91 8.47028 10.1584C8.84854 9.40691 9.45414 8.7938 10.2009 8.4063C10.9477 8.0188 11.7977 7.87665 12.63 8.00006C13.4789 8.12594 14.2648 8.52152 14.8717 9.12836C15.4785 9.73521 15.8741 10.5211 16 11.3701Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17.5 6.5H17.51"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a href="#" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 9H2V21H6V9Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
