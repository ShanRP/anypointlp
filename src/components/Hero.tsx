
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                Build amazing <span className="text-gradient">React</span> applications
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Create stunning user interfaces with our modern React framework.
                Fast, responsive, and beautiful by default.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={scrollToContact}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl blur-lg opacity-30"></div>
              <div className="relative bg-card rounded-xl shadow-xl overflow-hidden p-6 md:p-8">
                <pre className="text-sm md:text-base overflow-x-auto">
                  <code className="language-jsx">
                    <span className="text-blue-600">import</span> <span className="text-foreground">&#123; useState &#125;</span> <span className="text-blue-600">from</span> <span className="text-green-500">'react'</span>;{'\n\n'}
                    <span className="text-blue-600">function</span> <span className="text-yellow-500">App</span>() &#123;{'\n'}
                    {'  '}<span className="text-blue-600">const</span> [<span className="text-foreground">count</span>, <span className="text-foreground">setCount</span>] = <span className="text-yellow-500">useState</span>(0);{'\n\n'}
                    {'  '}<span className="text-blue-600">return</span> ({'\n'}
                    {'    '}&lt;<span className="text-blue-600">div</span>&gt;{'\n'}
                    {'      '}&lt;<span className="text-blue-600">h1</span>&gt;Hello, World!&lt;/<span className="text-blue-600">h1</span>&gt;{'\n'}
                    {'      '}&lt;<span className="text-blue-600">button</span> <span className="text-foreground">onClick</span>=&#123;() =&gt; <span className="text-foreground">setCount</span>(<span className="text-foreground">count</span> + 1)&#125;&gt;{'\n'}
                    {'        '}Count: &#123;<span className="text-foreground">count</span>&#125;{'\n'}
                    {'      '}&lt;/<span className="text-blue-600">button</span>&gt;{'\n'}
                    {'    '}&lt;/<span className="text-blue-600">div</span>&gt;{'\n'}
                    {'  '});{'\n'}
                    &#125;
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
