import React, { useContext, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import "./PreviewStyles.css";
import BarberPole from "../BarberPole";
import salon1 from "../../assets/salon1.png";
import salon2 from "../../assets/salon2.png";
import salon3 from "../../assets/salon3.png";
import {
  ScissorsIcon,
  RazorIcon,
  BeardIcon,
  CalendarIcon,
  EmailIcon,
  ClockIcon,
  LocationIcon,
  CancelIcon,
  StarIcon,
} from "../BarberIcons";

const Preview = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photos] = useState([salon1, salon2, salon3]);
  const [isImgLoading, setIsImgLoading] = useState(true);
  const navigate = useNavigate();
  const [sectionsVisible, setSectionsVisible] = useState({});
  
  const sectionRefs = {
    services: useRef(null),
    features: useRef(null),
    testimonials: useRef(null),
    location: useRef(null),
    calendar: useRef(null),
  };

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % photos.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [photos.length]);

  // Function to check if element is in viewport
  const isInViewport = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top <=
        (window.innerHeight || document.documentElement.clientHeight) * 0.75 &&
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

      setSectionsVisible((prev) => ({ ...prev, ...visibleSections }));
    };

    // Run once on mount
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
      duration: "40 min",
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
      document
        .getElementById("calendar-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % photos.length);
  };

  return (
    <div className="w-full max-w-7xl mx-auto sm:flex sm:flex-col sm:gap-8  ">
      {/* Hero Section */}
      <div className="hero min-h-[800px] bg-base-200 rounded-lg overflow-hidden relative p-3">
        <div className="hero-content flex-col lg:flex-row-reverse sm:p-0">
          {/* Image Carousel */}
          <div className="lg:w-1/2 relative">
            <div className="carousel w-full h-96 rounded-lg overflow-hidden shadow-xl sm:w-[300px]  md:w-[500px]">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className={`carousel-item w-full transition-opacity duration-500  ${
                    index === currentImageIndex ? "opacity-100" : "opacity-0 absolute"
                  }`}
                  style={{ zIndex: 1 }}
                >
                  <img
                    src={photo}
                    className={`border-4 border-primary absolute inset-0 w-full h-full object-cover  transition-all duration-300 ${isImgLoading ? 'blur-lg' : 'blur-0'}`}
                    alt={`Salon ${index + 1}`}
                    onLoad={() => setIsImgLoading(false)}
                    onError={() => setIsImgLoading(false)}
                  />
                </div>
              ))}
              
              {/* Navigation Arrows */}
              <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2 z-10">
                <button 
                  onClick={goToPrevious}
                  className="btn btn-circle bg-black/50 border-none hover:bg-black/70 text-white"
                >
                  ❮
                </button>
                <button 
                  onClick={goToNext}
                  className="btn btn-circle bg-black/50 border-none hover:bg-black/70 text-white"
                >
                  ❯
                </button>
              </div>
            </div>
            
            {/* Indicators */}
            <div className="flex justify-center w-full py-2 gap-2 relative z-10 bg-semi-transparent backdrop-blur-sm rounded-lg mt-4">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`btn btn-xs ${
                    index === currentImageIndex ? "btn-primary" : "btn-outline"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
          
          {/* Hero Content */}
          <div className="lg:w-1/2 animate-fade-in">
            <h1 className="text-5xl font-bold font-mono">BARBERIA</h1>
            <p className="py-6">
              Professional haircuts and beard grooming services. Book your
              appointment today and experience the difference.
            </p>
            <button
              onClick={handleBookNow}
              className="btn btn-primary btn-glow"
            >
              Book Now
            </button>
          </div>
        </div>

       
      </div>

      {/* Services Section */}
      <div
        ref={sectionRefs.services}
        className={`py-16 section-reveal ${
          sectionsVisible.services ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 service-card animate-fade-in"
            >
              <div className="card-body">
                <div className="text-4xl mb-4 text-center animate-float">
                  {service.icon}
                </div>
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
        className={`py-16 bg-base-200 rounded-lg section-reveal ${
          sectionsVisible.features ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card bg-base-100 shadow-xl hover:bg-secondary hover:text-primary-content transition-colors duration-300 feature-card animate-fade-in"
            >
              <div className="card-body items-center text-center">
                <div className="text-3xl mb-2 animate-pulse-slow">
                  {feature.icon}
                </div>
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
        className={`py-16 bg-base-200 rounded-lg section-reveal ${
          sectionsVisible.testimonials ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl font-bold text-center mb-12">
          What Our Customers Say
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card bg-base-100 shadow-xl animate-fade-in">
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
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} filled={true} />
                    ))}
                  </div>
                </div>
              </div>
              <p>
                "The best haircut I've ever had! The barber took their time
                and listened to exactly what I wanted."
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl animate-fade-in">
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
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} filled={true} />
                    ))}
                  </div>
                </div>
              </div>
              <p>
                "Great atmosphere, professional service, and the online
                booking system is so convenient. Highly recommend!"
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl animate-fade-in">
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
                    {[...Array(4)].map((_, i) => (
                      <StarIcon key={i} filled={true} />
                    ))}
                    <StarIcon filled={false} />
                  </div>
                </div>
              </div>
              <p>
                "My beard has never looked better. The barber knew exactly
                how to shape it to complement my face. Will definitely be
                back!"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location Highlight */}
      <div
        ref={sectionRefs.location}
        className={`py-16 section-reveal ${
          sectionsVisible.location ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl font-bold text-center mb-12">Visit Us</h2>
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div
            className="lg:w-1/2 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="card-body">
                <h3 className="card-title justify-center mb-4">
                  <LocationIcon size={24} className="mr-2" />
                  Our Location
                </h3>
                <p className="mb-4">
                  We're conveniently located in the heart of the city. Come
                  visit us today!
                </p>
                <div className="card-actions justify-center">
                  <Link to="/location" className="btn btn-primary btn-glow">
                    View on Map
                  </Link>
                </div>
              </div>
            </div>
          </div>
        
        </div>
      </div>
    </div>
  );
};

export default Preview;