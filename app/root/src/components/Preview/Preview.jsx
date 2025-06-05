import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import PriceContext from "../../context/PriceContext";
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
  const { prices } = useContext(PriceContext);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photos] = useState([salon1, salon2, salon3]);
  const [isImgLoading, setIsImgLoading] = useState([true, true, true]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % photos.length);
     
  };
  

  const navigate = useNavigate();
  const [sectionsVisible, setSectionsVisible] = useState({});

  const baseServices = [
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

  // Use useMemo to compute services with current prices
  // This will only recalculate when the 'prices' object changes
  const services = useMemo(() => {
    return baseServices.map((service) => ({
      ...service,
      // Check if price exists for this service, otherwise show fallback
      price: prices[service.name] ? `${prices[service.name]} lv` : "Loading...", // Fallback while prices are loading
    }));
  }, [prices]); // Dependency array - only recalculate when prices change

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
         {/* Custom Carousel Container */}
        <div className="absolute inset-0">
          {/* Responsive Image Container */}
          <div className="relative w-full h-full aspect-[4/3] sm:aspect-[3/2] md:aspect-video lg:aspect-[21/9]">
            {photos.map((photo, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={photo}
                  alt={`Salon ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent"></div>
              </div>
            ))}
          </div>

          {/* Carousel Controls */}
          <button 
            onClick={prevSlide}
            className="btn btn-circle btn-ghost absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-black/20 z-10"
            aria-label="Previous image"
          >
            ❮
          </button>
          <button 
            onClick={nextSlide}
            className="btn btn-circle btn-ghost absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-black/20 z-10"
            aria-label="Next image"
          >
            ❯
          </button>

          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

          {/* Hero Content */}
          <div className="lg:w-1/2 animate-fade-in">
          <h1 className="fluid-text-xl font-bold font-mono">BARBERIA</h1>
            <p className="fluid-text-base align-start text-left sm:text-left md:text-center lg:text-center mb-4">
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
                "The best haircut I've ever had! The barber took their time and
                listened to exactly what I wanted."
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
                "Great atmosphere, professional service, and the online booking
                system is so convenient. Highly recommend!"
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
                "My beard has never looked better. The barber knew exactly how
                to shape it to complement my face. Will definitely be back!"
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
