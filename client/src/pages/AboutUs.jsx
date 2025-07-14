import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
};

// Animated component with intersection observer
const AnimatedSection = ({ children, variants, className }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Staggered children animation
const StaggeredChildren = ({ children, className, staggerDelay = 0.1 }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      controls.start(i => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * staggerDelay, duration: 0.5 }
      }));
    }
  }, [controls, inView, staggerDelay]);

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, i) => (
        <motion.div
          custom={i}
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

function AboutUs() {
  const navigate = useNavigate();
  return (
    <div className="bg-[#0a0a0f] text-white min-h-screen">
      {/* Header */}
      <Navbar/>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#9333EA]/30 to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-[#9333EA]/20 to-transparent rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <AnimatedSection variants={fadeIn} className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                We're Changing How <span className="text-[#9333EA]">Talent Connects</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 mb-8">
                GoWithFlow is a global platform that connects exceptional freelancers with innovative companies, creating meaningful work relationships that drive success.
              </p>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="inline-block"
              >
                <button onClick={()=> navigate('/signup')}
                 className="bg-[#9333EA] text-white px-8 py-3 rounded-md font-medium hover:bg-[#a855f7] transition-colors">
                  Join Our Mission
                </button>
              </motion.div>
            </AnimatedSection>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 md:py-24 bg-[#121218]">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <AnimatedSection variants={slideInLeft}>
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#9333EA]/20 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#9333EA]/20 rounded-full blur-xl"></div>
                  <div className="relative rounded-lg overflow-hidden aspect-video">
                    <img 
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                      alt="Our journey - team collaboration" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </AnimatedSection>
              
              <AnimatedSection variants={slideInRight}>
                <div className="space-y-6">
                  <div className="inline-block rounded-lg bg-[#9333EA] px-3 py-1 text-sm text-white">
                    Our Story
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold">From Idea to Global Platform</h2>
                  <p className="text-gray-400">
                    Founded in 2018, GoWithFlow began with a simple mission: to create a more efficient way for companies to find and work with top freelance talent. What started as a small team of passionate entrepreneurs has grown into a global platform connecting thousands of businesses with skilled professionals across the world.
                  </p>
                  <p className="text-gray-400">
                    Our journey hasn't always been smooth, but our commitment to quality, transparency, and innovation has never wavered. Today, we're proud to be one of the fastest-growing freelance platforms, with a community that spans over 150 countries.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <AnimatedSection variants={fadeIn} className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block rounded-lg bg-[#9333EA] px-3 py-1 text-sm text-white mb-4">
                Our Values
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Principles That Guide Us</h2>
              <p className="text-gray-400">
                At GoWithFlow, we believe in creating a platform that benefits everyone involved. These core values drive everything we do.
              </p>
            </AnimatedSection>

            <StaggeredChildren className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.15}>
              {[
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#9333EA]">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                      <path d="M7.5 12L10.5 15L16.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Quality First",
                  description: "We believe in quality over quantity. Our vetting process ensures only the best talent makes it to our platform."
                },
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#9333EA]">
                      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Transparency",
                  description: "We believe in open communication and honest feedback. No hidden fees, no surprises."
                },
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#9333EA]">
                      <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2" />
                      <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  ),
                  title: "Excellence",
                  description: "We strive for excellence in everything we do, from our platform's user experience to our customer support."
                },
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#9333EA]">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Community",
                  description: "We foster a supportive community where freelancers can grow, learn, and connect with each other."
                },
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#9333EA]">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Global Mindset",
                  description: "We embrace diversity and believe talent knows no borders. Our platform connects people across cultures and continents."
                },
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#9333EA]">
                      <path d="M18 8H19C20.0609 8 21.0783 8.42143 21.8284 9.17157C22.5786 9.92172 23 10.9391 23 12C23 13.0609 22.5786 14.0783 21.8284 14.8284C21.0783 15.5786 20.0609 16 19 16H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 8H5C3.93913 8 2.92172 8.42143 2.17157 9.17157C1.42143 9.92172 1 10.9391 1 12C1 13.0609 1.42143 14.0783 2.17157 14.8284C2.92172 15.5786 3.93913 16 5 16H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Innovation",
                  description: "We continuously innovate to make freelancing easier, more efficient, and more rewarding for everyone involved."
                }
              ].map((value, index) => (
                <div key={index} className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a]">
                  <div className="mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </div>
              ))}
            </StaggeredChildren>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-24 bg-[#121218]">
          <div className="container mx-auto px-4">
            <AnimatedSection variants={fadeIn} className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Impact in Numbers</h2>
              <p className="text-gray-400">
                Since our founding, we've grown rapidly and made a significant impact in the freelancing world.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: "500K+", label: "Freelancers" },
                { number: "100K+", label: "Businesses" },
                { number: "150+", label: "Countries" },
                { number: "$250M+", label: "Paid to Freelancers" }
              ].map((stat, index) => (
                <AnimatedSection 
                  key={index} 
                  variants={scaleUp} 
                  className="text-center p-6 bg-[#0a0a0f] rounded-lg border border-[#2d2d3a]"
                >
                  <div className="text-3xl md:text-5xl font-bold text-[#9333EA] mb-2">{stat.number}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <AnimatedSection variants={fadeIn} className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block rounded-lg bg-[#9333EA] px-3 py-1 text-sm text-white mb-4">
                Our Team
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Meet the People Behind GoWithFlow</h2>
              <p className="text-gray-400">
                Our diverse team of experts is passionate about creating the best platform for freelancers and businesses alike.
              </p>
            </AnimatedSection>

            <StaggeredChildren className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={0.1}>
              {[
                {
                  name: "Alex Morgan",
                  role: "Founder & CEO",
                  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                },
                {
                  name: "Sophia Chen",
                  role: "Chief Product Officer",
                  image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=688&q=80"
                },
                {
                  name: "Marcus Johnson",
                  role: "CTO",
                  image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                },
                {
                  name: "Olivia Rodriguez",
                  role: "Head of Marketing",
                  image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=761&q=80"
                },
                {
                  name: "David Kim",
                  role: "Head of Design",
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                },
                {
                  name: "Priya Patel",
                  role: "Head of Customer Success",
                  image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                },
                {
                  name: "James Wilson",
                  role: "Head of Finance",
                  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                },
                {
                  name: "Emma Thompson",
                  role: "Head of Talent",
                  image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=688&q=80"
                }
              ].map((member, index) => (
                <div key={index} className="group">
                  <div className="relative overflow-hidden rounded-lg aspect-square mb-4">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#9333EA]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <img 
                      src={member.image || "/placeholder.svg"} 
                      alt={member.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex gap-3 justify-center">
                        <a href="#" className="bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-sm transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6 9H2V21H6V9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </a>
                        <a href="#" className="bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-sm transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M23 3.01006C23 3.01006 20.9821 4.20217 19.86 4.54006C19.2577 3.84757 18.4573 3.35675 17.567 3.13398C16.6767 2.91122 15.7395 2.96725 14.8821 3.29451C14.0247 3.62177 13.2884 4.20446 12.773 4.96377C12.2575 5.72309 11.9877 6.62239 12 7.54006V8.54006C10.2426 8.58562 8.50127 8.19587 6.93101 7.4055C5.36074 6.61513 4.01032 5.44869 3 4.01006C3 4.01006 -1 13.0101 8 17.0101C5.94053 18.408 3.48716 19.109 1 19.0101C10 24.0101 21 19.0101 21 7.51006C20.9991 7.23151 20.9723 6.95365 20.92 6.68006C21.9406 5.67355 23 3.01006 23 3.01006Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold">{member.name}</h3>
                  <p className="text-gray-400">{member.role}</p>
                </div>
              ))}
            </StaggeredChildren>
          </div>
        </section>

        {/* Office Section */}
        <section className="py-16 md:py-24 bg-[#121218]">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <AnimatedSection variants={slideInLeft} className="order-2 md:order-1">
                <div className="space-y-6">
                  <div className="inline-block rounded-lg bg-[#9333EA] px-3 py-1 text-sm text-white">
                    Our Workspace
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold">Where Innovation Happens</h2>
                  <p className="text-gray-400">
                    Our headquarters in San Francisco is designed to foster creativity, collaboration, and innovation. With open spaces, quiet zones, and plenty of room for spontaneous meetings, our office reflects our values and culture.
                  </p>
                  <p className="text-gray-400">
                    We also have satellite offices in London, Singapore, and Sydney, allowing us to serve our global community around the clock.
                  </p>
                </div>
              </AnimatedSection>
              
              <AnimatedSection variants={slideInRight} className="order-1 md:order-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80" 
                      alt="Office space" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1600508774634-4e11d34730e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                      alt="Office space" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-lg overflow-hidden col-span-2">
                    <img 
                      src="https://images.unsplash.com/photo-1604328698692-f76ea9498e76?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                      alt="Office space" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <AnimatedSection variants={fadeIn} className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block rounded-lg bg-[#9333EA] px-3 py-1 text-sm text-white mb-4">
                Testimonials
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">What Our Community Says</h2>
              <p className="text-gray-400">
                Don't just take our word for it. Here's what freelancers and businesses have to say about GoWithFlow.
              </p>
            </AnimatedSection>

            <StaggeredChildren className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.15}>
              {[
                {
                  quote: "GoWithFlow has completely transformed how I find clients. The quality of projects and the ease of use are unmatched.",
                  author: "Sarah J.",
                  role: "UX Designer",
                  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                },
                {
                  quote: "As a business owner, finding reliable freelancers used to be a nightmare. GoWithFlow has made it simple and stress-free.",
                  author: "Michael T.",
                  role: "CEO, TechStart",
                  image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                },
                {
                  quote: "The platform's payment protection gives me peace of mind. I can focus on my work knowing I'll get paid on time.",
                  author: "Daniel R.",
                  role: "Web Developer",
                  image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                },
                {
                  quote: "We've built an entire remote team through GoWithFlow. The talent quality is exceptional and the platform makes management easy.",
                  author: "Lisa M.",
                  role: "COO, DigitalNomads",
                  image: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=689&q=80"
                },
                {
                  quote: "The community aspect sets GoWithFlow apart. I've made valuable connections and even found mentors through the platform.",
                  author: "Raj P.",
                  role: "Motion Designer",
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                },
                {
                  quote: "GoWithFlow's customer support is outstanding. Any issues are resolved quickly and professionally.",
                  author: "Emma L.",
                  role: "Content Strategist",
                  image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&q=80"
                }
              ].map((testimonial, index) => (
                <AnimatedSection 
                  key={index} 
                  variants={fadeIn} 
                  className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a]"
                >
                  <div className="mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#9333EA]/40">
                      <path d="M10 11H6C5.46957 11 4.96086 10.7893 4.58579 10.4142C4.21071 10.0391 4 9.53043 4 9V7C4 6.46957 4.21071 5.96086 4.58579 5.58579C4.96086 5.21071 5.46957 5 6 5H8C8.53043 5 9.03914 5.21071 9.41421 5.58579C9.78929 5.96086 10 6.46957 10 7V17C10 17.5304 9.78929 18.0391 9.41421 18.4142C9.03914 18.7893 8.53043 19 8 19H6C5.46957 19 4.96086 18.7893 4.58579 18.4142C4.21071 18.0391 4 17.5304 4 17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
                      <path d="M20 11H16C15.4696 11 14.9609 10.7893 14.5858 10.4142C14.2107 10.0391 14 9.53043 14 9V7C14 6.46957 14.2107 5.96086 14.5858 5.58579C14.9609 5.21071 15.4696 5 16 5H18C18.5304 5 19.0391 5.21071 19.4142 5.58579C19.7893 5.96086 20 6.46957 20 7V17C20 17.5304 19.7893 18.0391 19.4142 18.4142C19.0391 18.7893 18.5304 19 18 19H16C15.4696 19 14.9609 18.7893 14.5858 18.4142C14.2107 18.0391 14 17.5304 14 17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
                    </svg>
                  </div>
                  <p className="text-gray-300 mb-6 italic">{testimonial.quote}</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={testimonial.image || "/placeholder.svg"} 
                      alt={testimonial.author} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold">{testimonial.author}</h4>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </StaggeredChildren>
          </div>
        </section>

       

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <AnimatedSection 
              variants={scaleUp} 
              className="max-w-4xl mx-auto bg-gradient-to-r from-[#9333EA]/20 to-[#9333EA]/5 rounded-2xl p-8 md:p-12 border border-[#9333EA]/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#9333EA]/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9333EA]/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>
              
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join Our Community?</h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Whether you're looking for top talent or exciting projects, GoWithFlow has everything you need to succeed in the freelance economy.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={()=> navigate('/signup')} className="bg-[#9333EA] text-white px-8 py-3 rounded-md font-medium hover:bg-[#a855f7] transition-colors">
                  Sign Up as Freelancer
                </button>
                <button onClick={()=> navigate('/signup')} className="bg-transparent border border-[#9333EA] text-white px-8 py-3 rounded-md font-medium hover:bg-[#9333EA]/10 transition-colors">
                  Hire Talent
                </button>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2d2d3a] bg-[#0a0a0f] py-6 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#9333EA]">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xl font-bold text-[#9333EA]">GoWithFlow</span>
              </div>
              <p className="text-sm text-gray-400">Connecting talent with opportunity worldwide.</p>
            </div>
            <div className="grid gap-2">
              <h3 className="text-lg font-medium">For Freelancers</h3>
              <nav className="flex flex-col gap-2">
                <a href="#" className="text-sm text-gray-400 hover:text-white">Find Work</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Create Profile</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Community</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Success Stories</a>
              </nav>
            </div>
            <div className="grid gap-2">
              <h3 className="text-lg font-medium">For Clients</h3>
              <nav className="flex flex-col gap-2">
                <a href="#" className="text-sm text-gray-400 hover:text-white">Post a Job</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Find Freelancers</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Enterprise Solutions</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Success Stories</a>
              </nav>
            </div>
            <div className="grid gap-2">
              <h3 className="text-lg font-medium">Resources</h3>
              <nav className="flex flex-col gap-2">
                <a href="#" className="text-sm text-gray-400 hover:text-white">Help Center</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Blog</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Community</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Contact Us</a>
              </nav>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#2d2d3a] pt-8 md:flex-row">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} GoWithFlow. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3.01006C23 3.01006 20.9821 4.20217 19.86 4.54006C19.2577 3.84757 18.4573 3.35675 17.567 3.13398C16.6767 2.91122 15.7395 2.96725 14.8821 3.29451C14.0247 3.62177 13.2884 4.20446 12.773 4.96377C12.2575 5.72309 11.9877 6.62239 12 7.54006V8.54006C10.2426 8.58562 8.50127 8.19587 6.93101 7.4055C5.36074 6.61513 4.01032 5.44869 3 4.01006C3 4.01006 -1 13.0101 8 17.0101C5.94053 18.408 3.48716 19.109 1 19.0101C10 24.0101 21 19.0101 21 7.51006C20.9991 7.23151 20.9723 6.95365 20.92 6.68006C21.9406 5.67355 23 3.01006 23 3.01006Z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" />
                  <path d="M6 9H2V21H6V9Z" />
                  <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AboutUs;