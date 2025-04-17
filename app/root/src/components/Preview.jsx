import React, { useContext, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "./PreviewStyles.css";
import BarberPole from "./BarberPole";
import { 
  ScissorsIcon, 
  RazorIcon, 
  BeardIcon, 
  CalendarIcon, 
  EmailIcon,
  ClockIcon,
  LocationIcon,
  CancelIcon,
  StarIcon
} from "./BarberIcons";

const Preview = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sectionsVisible, setSectionsVisible] = useState({});
  const sectionRefs = {
    services: useRef(null),
    features: useRef(null),
    testimonials: useRef(null),
    location: useRef(null),
    calendar: useRef(null)
  };
  
  // Function to check if element is in viewport
  const isInViewport = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.75 &&
      rect.bottom >= 0
    );
  };
  
  // Check which sections are visible on scroll
  useEffect(() => {
    const handleScroll = () => {
      const visibleSections = {};
      
      Object.entries(sectionRefs).forEach(([key, ref]) => {
        if (ref.current && isInViewport(ref.current)) {
          visibleSections[key] = true;
        }
      });
      
      setSectionsVisible(prev => ({...prev, ...visibleSections}));
    };
    
    // Run once on mount
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [
    {
      name: "Hair",
      price: "20 lv",
      description: "Professional haircut tailored to your style preferences",
      duration: "40 min",
      icon: <ScissorsIcon size={48} />,
    },
    {
      name: "Beard",
      price: "20 lv",
      description: "Expert beard trimming, shaping, and styling",
      duration: "30-40 min",
      icon: <BeardIcon size={48} />,
    },
    {
      name: "Hair and Beard",
      price: "30 lv",
      description: "Complete package including haircut and beard grooming",
      duration: "60 min",
      icon: <RazorIcon size={48} />,
    },
  ];

  const features = [
    {
      title: "Online Booking",
      description: "Book your appointment anytime, anywhere",
      icon: <CalendarIcon size={32} />,
    },
    {
      title: "Email Confirmation",
      description: "Receive confirmation and reminders via email",
      icon: <EmailIcon size={32} />,
    },
    {
      title: "Flexible Scheduling",
      description: "Various time slots available throughout the week",
      icon: <ClockIcon size={32} />,
    },
    {
      title: "Easy Cancellation",
      description: "Cancel within 10 minutes if your plans change",
      icon: <CancelIcon size={32} />,
    },
  ];

  const handleBookNow = () => {
    if (!isLoggedIn.status) {
      navigate("/auth", { state: { auth: "login" } });
    } else {
      // Scroll to calendar section if the user is already logged in
      document.getElementById("calendar-section").scrollIntoView({ behavior: "smooth" });
    }
  };
 // w-full max-w-6xl mx-auto
  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Hero Section */}
      <div className="hero min-h-screen bg-base-200 rounded-lg overflow-hidden relative">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <div className="lg:w-1/2">
            <svg viewBox="0 0 800 400" className="w-full h-auto">
              {/* Background */}
              <rect width="800" height="400" fill="#1a1a1a" />
              
              {/* Barber Pole */}
              <g transform="translate(650, 100)">
                <rect x="0" y="0" width="30" height="200" rx="15" fill="#d1d5db" />
                <rect x="0" y="0" width="30" height="200" rx="15" fill="url(#barberStripes)" />
                <circle cx="15" cy="0" r="15" fill="gold" />
                <circle cx="15" cy="200" r="15" fill="gold" />
              </g>
              
              {/* Scissors */}
              <g transform="translate(100, 200) rotate(-15)">
                <path d="M0,0 L100,100 M0,100 L100,0" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
                <circle cx="0" cy="0" r="20" fill="#d1d5db" />
                <circle cx="0" cy="100" r="20" fill="#d1d5db" />
                <circle cx="0" cy="0" r="10" fill="#1a1a1a" />
                <circle cx="0" cy="100" r="10" fill="#1a1a1a" />
              </g>
              
              {/* Razor */}
              <g transform="translate(300, 180)">
                <rect x="0" y="0" width="120" height="40" rx="5" fill="#e5e7eb" />
                <rect x="120" y="10" width="60" height="20" rx="5" fill="#9ca3af" />
                <rect x="180" y="15" width="20" height="10" rx="2" fill="#6b7280" />
                <line x1="10" y1="20" x2="110" y2="20" stroke="#9ca3af" strokeWidth="2" />
              </g>
              
              {/* Comb */}
              <g transform="translate(500, 250) rotate(30)">
                <rect x="0" y="0" width="120" height="30" rx="5" fill="#6b7280" />
                <rect x="10" y="0" width="5" height="10" fill="#1a1a1a" />
                <rect x="25" y="0" width="5" height="10" fill="#1a1a1a" />
                <rect x="40" y="0" width="5" height="10" fill="#1a1a1a" />
                <rect x="55" y="0" width="5" height="10" fill="#1a1a1a" />
                <rect x="70" y="0" width="5" height="10" fill="#1a1a1a" />
                <rect x="85" y="0" width="5" height="10" fill="#1a1a1a" />
                <rect x="100" y="0" width="5" height="10" fill="#1a1a1a" />
              </g>
              
              {/* Pattern Definitions */}
              <defs>
                <pattern id="barberStripes" patternUnits="userSpaceOnUse" width="30" height="40" patternTransform="rotate(0)">
                  <rect width="10" height="40" fill="red" />
                  <rect x="10" width="10" height="40" fill="white" />
                  <rect x="20" width="10" height="40" fill="blue" />
                </pattern>
              </defs>
            </svg>
          </div>
          <div className="lg:w-1/2 animate-fade-in">
            <h1 className="text-5xl font-bold">Barber Booking</h1>
            <p className="py-6">
              Professional haircuts and beard grooming services. Book your appointment today and experience the difference.
            </p>
            <button onClick={handleBookNow} className="btn btn-primary btn-glow">
              Book Now
            </button>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center">
          <p className="mb-2">Scroll to explore</p>
          <div className="scroll-indicator"></div>
        </div>
      </div>

      {/* Services Section */}
      <div 
        ref={sectionRefs.services}
        className={`py-16 section-reveal ${sectionsVisible.services ? 'visible' : ''}`}
      >
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 service-card animate-fade-in"
            >
              <div className="card-body">
                <div className="text-4xl mb-4 text-center animate-float">{service.icon}</div>
                <h3 className="card-title justify-center">{service.name}</h3>
                <div className="badge badge-primary">{service.price}</div>
                <div className="badge badge-secondary">{service.duration}</div>
                <p className="text-center mt-2">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div 
        ref={sectionRefs.features}
        className={`py-16 bg-base-200 rounded-lg section-reveal ${sectionsVisible.features ? 'visible' : ''}`}
      >
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="card bg-base-100 shadow-xl hover:bg-primary hover:text-primary-content transition-colors duration-300 feature-card animate-fade-in"
            >
              <div className="card-body items-center text-center">
                <div className="text-3xl mb-2 animate-pulse-slow">{feature.icon}</div>
                <h3 className="card-title">{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div 
        ref={sectionRefs.testimonials}
        className={`py-16 bg-base-200 rounded-lg section-reveal ${sectionsVisible.testimonials ? 'visible' : ''}`}
      >
        <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
        <div className="carousel w-full px-6">
          <div id="testimonial1" className="carousel-item relative w-full">
            <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
              <div className="card bg-base-100 shadow-xl w-full animate-fade-in">
                <div className="card-body">
                  <div className="flex items-center mb-4">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-12">
                        <span>MK</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold">Martin K.</h3>
                      <div className="flex text-yellow-500">
                        <StarIcon filled={true} />
                        <StarIcon filled={true} />
                        <StarIcon filled={true} />
                        <StarIcon filled={true} />
                        <StarIcon filled={true} />
                      </div>
                    </div>
                  </div>
                  <p className="text-lg">"The best haircut I've ever had! The barber took their time and listened to exactly what I wanted."</p>
                </div>
              </div>
            </div>
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
              <a href="#testimonial3" className="btn btn-circle btn-glow">❮</a> 
              <a href="#testimonial2" className="btn btn-circle btn-glow">❯</a>
            </div>
          </div> 
          
          <div id="testimonial2" className="carousel-item relative w-full">
            <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
              <div className="card bg-base-100 shadow-xl w-full animate-fade-in">
                <div className="card-body">
                  <div className="flex items-center mb-4">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-12">
                        <span>JS</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold">John S.</h3>
                      <div className="flex text-yellow-500">
                        <StarIcon filled={true} />
                        <StarIcon filled={true} />
                        <StarIcon filled={true} />
                        <StarIcon filled={true} />
                        <StarIcon filled={true} />
                      </div>
                    </div>
                  </div>
                  <p className="text-lg">"Great atmosphere, professional service, and the online booking system is so convenient. Highly recommend!"</p>
                </div>
              </div>
            </div>
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
              <a href="#testimonial1" className="btn btn-circle btn-glow">❮</a> 
              <a href="#testimonial3" className="btn btn-circle btn-glow">❯</a>
            </div>
          </div> 
          
          <div id="testimonial3" className="carousel-item relative w-full">
            <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
              <div className="card bg-base-100 shadow-xl w-full animate-fade-in">
                <div className="card-body">
                  <div className="flex items-center mb-4">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-12">
                        <span>TD</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold">Thomas D.</h3>
                      <div className="flex text-yellow-500">
                        <StarIcon filled={true} />
                        <StarIcon filled={true} />
                        <StarIcon filled={true} />
                        <StarIcon filled={true} />
                        <StarIcon filled={false} />
                      </div>
                    </div>
                  </div>
                  <p className="text-lg">"My beard has never looked better. The barber knew exactly how to shape it to complement my face. Will definitely be back!"</p>
                </div>
              </div>
            </div>
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
              <a href="#testimonial2" className="btn btn-circle btn-glow">❮</a> 
              <a href="#testimonial1" className="btn btn-circle btn-glow">❯</a>
            </div>
          </div>
        </div>
        
        {/* Carousel Indicators */}
        <div className="flex justify-center w-full py-4 gap-2">
          <a href="#testimonial1" className="btn btn-xs btn-glow">1</a> 
          <a href="#testimonial2" className="btn btn-xs btn-glow">2</a> 
          <a href="#testimonial3" className="btn btn-xs btn-glow">3</a> 
        </div>
      </div>

      {/* Location Highlight */}
      <div 
        ref={sectionRefs.location}
        className={`py-16 section-reveal ${sectionsVisible.location ? 'visible' : ''}`}
      >
        <h2 className="text-3xl font-bold text-center mb-12">Visit Us</h2>
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="lg:w-1/2 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="card-body">
                <h3 className="card-title justify-center mb-4">
                  <LocationIcon size={24} className="mr-2" />
                  Our Location
                </h3>
                <p className="mb-4">
                  We're conveniently located in the heart of the city. Come visit us today!
                </p>
                <div className="card-actions justify-center">
                  <Link to="/location" className="btn btn-primary btn-glow">
                    View on Map
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 animate-fade-in" style={{animationDelay: '0.4s'}}>
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="card-body">
                <h3 className="card-title justify-center mb-4">
                  <ClockIcon size={24} className="mr-2" />
                  Opening Hours
                </h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>9:00 AM - 7:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Saturday:</span>
                    <span>10:00 AM - 6:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday:</span>
                    <span>Closed</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div 
        id="calendar-section" 
        ref={sectionRefs.calendar}
        className={`py-16 section-reveal ${sectionsVisible.calendar ? 'visible' : ''}`}
      >
        <h2 className="text-3xl font-bold text-center mb-8">Book Your Appointment</h2>
        
        <div className="flex justify-center mb-6">
          <BarberPole className="animate-float" height={120} width={24} />
        </div>
        
        <div className="card bg-base-100 shadow-xl p-4 animate-fade-in">
          {!isLoggedIn.status && (
            <div className="p-8 text-center">
              <p className="mb-4">Please log in to book your appointment</p>
              <Link to="/auth" state={{ auth: "login" }} className="btn btn-primary btn-glow">
                Login
              </Link>
              <p className="mt-4 text-sm">
                Don't have an account?{" "}
                <Link to="/auth" state={{ auth: "register" }} className="text-primary hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          )}
        </div>
        
        {/* Scroll down indicator */}
        <div className="mt-8 flex justify-center">
          <div className="scroll-indicator"></div>
        </div>
      </div>
    </div>
  );
};

export default Preview;