
import React from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

type TestimonialProps = {
  quote: string;
  name: string;
  role: string;
  className?: string;
};

const Testimonial: React.FC<TestimonialProps> = ({ quote, name, role, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl p-8 shadow-sm border border-gray-100 ${className}`}>
      <Quote size={36} className="text-purple-200 mb-4" />
      <p className="text-lg text-gray-700 mb-6 italic">{quote}</p>
      <div className="flex items-center">
        <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center mr-3">
          <span className="text-purple-700 font-bold">{name.charAt(0)}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-gray-500 text-sm">{role}</p>
        </div>
      </div>
    </div>
  );
};

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-48 right-1/4 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl -z-10"></div>
      
      <div className="container px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why developers and architects choose us
          </h2>
          <p className="text-xl text-gray-600">
            Hear from the MuleSoft professionals who've experienced the difference
          </p>
        </div>
        
        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Testimonial 
            quote="I use Anypoint Learning Platform for all my projects. After comparing it with other tools, only this platform produced working DataWeave code on the first attempt."
            name="Maria Rodriguez"
            role="MuleSoft Consultant/Mentor"
            className="animate-fade-up"
          />
          
          <Testimonial 
            quote="DataWeave mappings are typically complex. I tried a few difficult mappings with this platform and it works perfectly! Other tools couldn't solve the same problems."
            name="James Chen"
            role="MuleSoft Developer"
            className="animate-fade-up animate-delay-100"
          />
          
          <Testimonial 
            quote="I used the code review agent for a client project and it found optimization opportunities we hadn't considered. Feels like magic!"
            name="Sarah Johnson"
            role="Integration Architect"
            className="animate-fade-up animate-delay-200"
          />
          
          <Testimonial 
            quote="The documentation generator has saved me countless hours. It creates detailed API documentation that I can directly share with my clients."
            name="Michael Okonkwo"
            role="API Specialist"
            className="animate-fade-up animate-delay-100 lg:col-span-1.5"
          />
          
          <Testimonial 
            quote="The certification resources helped me pass my MuleSoft Developer certification on the first try. The practice questions were spot on!"
            name="Priya Sharma"
            role="Junior MuleSoft Developer"
            className="animate-fade-up animate-delay-200 lg:col-span-1.5"
          />
        </div>
        
        {/* Navigation Controls */}
        <div className="flex justify-center mt-10 space-x-4">
          <button className="p-2 rounded-full border border-gray-300 text-gray-600 hover:bg-white hover:text-purple-600 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <button className="p-2 rounded-full border border-gray-300 text-gray-600 hover:bg-white hover:text-purple-600 transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};
