'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const slides = [
  {
    id: 0,
    title: 'Chat Room',
    description: 'Your space, your people: Dive into discussions that matter in our Chat-Rooms.',
    image: '/images/chat-room.jpg',
    route: '/lobby',
    buttonText: 'Go to Chat Room',
    bgClass: 'bg-[#dfebe9]',
  },
  {
    id: 1,
    title: 'Chat Random',
    description: 'Meet the unexpected. Discover new voices from around the globe with Chat-Random.',
    image: '/images/chat-random.jpg',
    route: '/chat-random',
    buttonText: 'Go to Chat Random',
    bgClass: 'bg-white shadow-[inset_0_30px_60px_-12px_rgba(50,50,93,0.25),inset_0_18px_36px_-18px_rgba(0,0,0,0.3)]',
  },
  {
    id: 2,
    title: 'Chat Only',
    description: 'Pure conversation, no distractions. Get back to basics with Chat-Only.',
    image: '/images/chat-only.jpg',
    route: '/chat',
    buttonText: 'Go to Chat Only',
    bgClass: 'bg-[#d8effd]',
  },
]

export default function Home() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [aboutVisible, setAboutVisible] = useState(false)
  const aboutRef = useRef(null)

  useEffect(() => {
    // Auto-advance slides
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 7000)

    // Intersection Observer for about section
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAboutVisible(entry.isIntersecting)
      },
      { threshold: 0.3 }
    )

    if (aboutRef.current) {
      observer.observe(aboutRef.current)
    }

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  return (
    <div className="min-h-screen font-[Poppins,sans-serif]">
      {/* Navbar */}
      <nav className="w-full bg-white overflow-auto">
        <div className="flex items-center justify-between">
          <span className="float-left p-2.5 ml-2.5 text-[2vw] font-bold">
            CHATBRIDGE
          </span>
          <a
            href="#"
            className="float-right text-center p-3 text-black no-underline text-[17px] hover:border hover:border-gray-300"
          >
            Login
          </a>
        </div>
      </nav>

      {/* Carousel Section */}
      <section className="relative w-full">
        <div className="relative h-[calc(100vh-100px)] overflow-hidden">
          {/* Slides wrapper - horizontal sliding */}
          <div
            className="flex w-[300%] h-full transition-transform duration-1000 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                className={`relative flex-shrink-0 w-1/3 h-full ${slide.bgClass} shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex items-center justify-around p-12`}
              >
                {/* Left - Text Content */}
                <div className="w-[45%] p-5">
                  <h2 className="text-[2em] mb-2.5">{slide.title}</h2>
                  <p className="text-[1.2em] mb-5">
                    &quot;{slide.description}&quot;
                  </p>
                  <button
                    onClick={() => router.push(slide.route)}
                    className="px-5 py-2.5 text-[1em] text-white bg-[#333] border-none rounded-[5px] cursor-pointer hover:bg-[#555]"
                  >
                    {slide.buttonText}
                  </button>
                </div>

                {/* Right - Image */}
                <div className={`w-[45%] ${slide.id === 2 ? 'flex justify-center items-center' : ''}`}>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="h-[400px] w-auto mix-blend-darken"
                  />
                </div>

                {/* Slider controls inside each slide */}
                <div className="absolute top-1/2 w-full flex justify-between -translate-y-1/2 px-4">
                  <button
                    onClick={prevSlide}
                    className="bg-transparent border-none text-[2em] cursor-pointer focus:outline-none"
                  >
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 19-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextSlide}
                    className="bg-transparent border-none text-[2em] cursor-pointer focus:outline-none"
                  >
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Slider indicators */}
          <div className="absolute z-30 flex -translate-x-1/2 bottom-5 left-1/2 space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-gray-800 w-8'
                    : 'bg-gray-400 hover:bg-gray-600'
                }`}
                aria-current={index === currentSlide}
                aria-label={`Slide ${index + 1}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        ref={aboutRef}
        className="flex items-center justify-center h-screen w-full bg-white shadow-[0_4px_8px_rgba(0,0,0,0.2)] overflow-hidden"
      >
        <div
          className={`flex items-center justify-between h-full w-full max-w-[1200px] p-12 rounded-[10px] transition-all duration-[1200ms] ease-in-out ${
            aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="w-[45%] flex justify-center">
            <img
              src="/images/about-us.jpg"
              alt="About Us"
              className="w-4/5 h-auto rounded-[10px] mix-blend-lighten"
              loading="lazy"
            />
          </div>
          <div className="w-[45%] p-5">
            <h2 className="text-[2.5em] mb-5">Why ChatBridge?</h2>
            <p className="text-[1.2em] leading-relaxed">
              &quot;At ChatBridge, we believe in the power of connection. Our platform is designed to bring people together through seamless communication experiences. Whether you&apos;re looking for lively group discussions in our chat rooms, spontaneous conversations with random users, or private one-on-one chats, ChatBridge has you covered. Our mission is to foster meaningful connections and facilitate engaging interactions, creating a vibrant community where individuals can share ideas, experiences, and laughter. Join us on ChatBridge and embark on a journey of discovery, friendship, and connection.&quot;
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2c3e50] text-white py-12 relative">
        <div className="flex flex-wrap justify-around items-start w-4/5 max-w-[1200px] mx-auto">
          {/* About */}
          <div className="flex-1 p-5 min-w-[200px] text-center">
            <h2 className="text-[1.8em] mb-4">ChatBridge</h2>
            <p className="text-[1em] text-white">
              Connecting people across the globe through seamless communication. Join chat rooms, meet new people randomly, or engage in focused one-on-one conversations with ChatBridge.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex-1 p-5 min-w-[200px] text-center">
            <h2 className="text-[1.8em] mb-4">Quick Links</h2>
            <ul className="list-none p-0">
              <li className="mb-2.5">
                <a href="#home" className="no-underline text-white hover:text-[#f39c12] transition-colors">
                  Home
                </a>
              </li>
              <li className="mb-2.5">
                <a href="#features" className="no-underline text-white hover:text-[#f39c12] transition-colors">
                  Features
                </a>
              </li>
              <li className="mb-2.5">
                <a href="#about" className="no-underline text-white hover:text-[#f39c12] transition-colors">
                  About Us
                </a>
              </li>
              <li className="mb-2.5">
                <a href="#contact" className="no-underline text-white hover:text-[#f39c12] transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="flex-1 p-5 min-w-[200px] text-center">
            <h2 className="text-[1.8em] mb-4">Contact Us</h2>
            <p className="text-[1em] text-white">Email: support@chatbridge.com</p>
            <p className="text-[1em] text-white">Phone: +91 9157779070</p>
          </div>
        </div>

        <div className="text-center py-5 border-t border-[#444] mt-8">
          <p className="m-0 text-[0.9em]">
            &copy; 2024 ChatBridge. Developed by [Vyom Vasava]. All rights reserved.
          </p>
          <a href="http://www.freepik.com" className="no-underline text-white">
            Designed by pch.vector / Freepik
          </a>
        </div>
      </footer>
    </div>
  )
}
