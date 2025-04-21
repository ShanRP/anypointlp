import React from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

type TestimonialProps = {
  quote: string;
  name: string;
  role: string;
  className?: string;
};

const Testimonial: React.FC<TestimonialProps> = ({ quote, name, role, className = '' }) => {
  return (
    <motion.div 
      className={`bg-black/40 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-800 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden h-full flex flex-col ${className}`}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-xl"></div>
      <Quote size={36} className="text-purple-400 mb-4 group-hover:text-purple-300 transition-colors relative z-10" />
      <p className="text-lg text-gray-300 mb-6 italic font-montserrat relative z-10 flex-grow">{quote}</p>
      <div className="flex items-center relative z-10 mt-auto">
        <div className="w-10 h-10 bg-purple-900/70 rounded-full flex items-center justify-center mr-3 group-hover:bg-purple-800 transition-colors">
          <span className="text-purple-300 font-bold font-display">{name.charAt(0)}</span>
        </div>
        <div>
          <p className="font-semibold text-white font-display">{name}</p>
          <p className="text-gray-400 text-sm font-montserrat">{role}</p>
        </div>
      </div>
    </motion.div>
  );
};

export const Testimonials: React.FC = () => {
  const fadeInUp = {
    initial: { y: 40, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-transparent z-0"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-48 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -z-10"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMmgxdjFoLTF2LTF6bS0yLTJoMXYxaC0xdi0xem0yLTJoMXYxaC0xdi0xem0tMiAyaDF2MWgtMXYtMXptLTItMmgxdjFoLTF2LTF6bTggMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0tMi0yaDF2MWgtMXYtMXptLTIgMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0xMC00aDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0xNi0xMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0xNi0xMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 z-0"></div>
      
      <div className="container px-4 mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4 font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Why developers and architects choose us
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-300 font-montserrat"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Hear from the MuleSoft professionals who've experienced the difference
          </motion.p>
        </div>
        
        {/* Testimonials Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeInUp} className="h-full">
            <Testimonial 
              quote="I use Anypoint Learning Platform for all my projects. After comparing it with other tools, only this platform produced working DataWeave code on the first attempt."
              name="Maria Rodriguez"
              role="MuleSoft Consultant/Mentor"
            />
          </motion.div>
          
          <motion.div variants={fadeInUp} className="h-full">
            <Testimonial 
              quote="DataWeave mappings are typically complex. I tried a few difficult mappings with this platform and it works perfectly! Other tools couldn't solve the same problems."
              name="James Chen"
              role="MuleSoft Developer"
            />
          </motion.div>
          
          <motion.div variants={fadeInUp} className="h-full">
            <Testimonial 
              quote="I used the code review agent for a client project and it found optimization opportunities we hadn't considered. Feels like magic!"
              name="Sarah Johnson"
              role="Integration Architect"
            />
          </motion.div>
          
          <motion.div variants={fadeInUp} className="h-full md:col-span-1 lg:col-span-1.5">
            <Testimonial 
              quote="The documentation generator has saved me countless hours. It creates detailed API documentation that I can directly share with my clients."
              name="Michael Okonkwo"
              role="API Specialist"
            />
          </motion.div>
          
          <motion.div variants={fadeInUp} className="h-full md:col-span-1 lg:col-span-1.5">
            <Testimonial 
              quote="The certification resources helped me pass my MuleSoft Developer certification on the first try. The practice questions were spot on!"
              name="Priya Sharma"
              role="Junior MuleSoft Developer"
            />
          </motion.div>
        </motion.div>
        
        {/* Navigation Controls */}
        <div className="flex justify-center mt-10 space-x-4">
          <motion.button 
            className="p-3 rounded-full border border-gray-700 text-gray-400 hover:bg-purple-900/30 hover:text-purple-300 hover:border-purple-500/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft size={24} />
          </motion.button>
          <motion.button 
            className="p-3 rounded-full border border-gray-700 text-gray-400 hover:bg-purple-900/30 hover:text-purple-300 hover:border-purple-500/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight size={24} />
          </motion.button>
        </div>
      </div>
    </section>
  );
};
