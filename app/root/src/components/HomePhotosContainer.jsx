import { motion } from "framer-motion";
import salon1 from "../assets/salon1.png";
import salon2 from "../assets/salon2.png";
import salon3 from "../assets/salon3.png";
import salon4 from "../assets/salon4.png";
import { FaRegArrowAltCircleRight } from "react-icons/fa";
import { useState } from "react";

const HomePhotosContainer = () => {
  const photos = [salon1, salon2, salon3, salon4];
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const photoVariants = {
    visible: {
      x: 0,
      y: 0,
      scale: 0.8,
      rotate: 0,
      opacity: 1,
    },
    hidden: (i) => ({
      x: (i % 2 === 0 ? -1 : 1) * 50,
      y: Math.floor(i / 2) * 50,
      scale: 1,
      rotate: -10,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    }),
  };

  const iconVariants = {
    initial: { x: 0 },
    hover: {
      x: 5,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        repeat: Infinity,
        repeatType: "reverse",
        duration: 0.5,
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-4">
      <motion.div
        className="grid grid-cols-2 gap-0 select-none"
        variants={containerVariants}
        initial="hidden"
        animate={"visible"}
      >
        {photos.map((photo, index) => (
          <motion.img
            key={index}
            custom={index}
            whileHover={{ rotate: 10 }}
            whileTap={{ scale: 1.5, zIndex: 10 }}
            src={photo}
            alt={`Salon ${index + 1}`}
            className="bg-green-100 w-full max-w-[200px] h-[200px] sm:max-w-[250px] sm:h-[250px] md:max-w-[300px] md:h-[300px]"
            variants={photoVariants}
          />
        ))}
      </motion.div>

      <motion.button
        onHoverStart={() => setIsButtonHovered(true)}
        onHoverEnd={() => setIsButtonHovered(false)}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.8 }}
        className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-gray-400 text-white font-semibold "
      >
        Checkout more photos
        <motion.span
          variants={iconVariants}
          initial="initial"
          className="text-xl"
          animate={isButtonHovered ? "hover" : "initial"}
        >
          <FaRegArrowAltCircleRight />
        </motion.span>
      </motion.button>
    </div>
  );
};

export default HomePhotosContainer;
