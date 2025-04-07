
import { Code, Globe, Lightbulb, LayoutGrid, Zap, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Modern React",
    description: "Built with the latest React features including hooks, context, and suspense.",
    icon: <Code className="h-12 w-12 text-blue-500 mb-5" />,
  },
  {
    title: "Responsive Design",
    description: "Fully responsive layouts that work perfectly on any device or screen size.",
    icon: <LayoutGrid className="h-12 w-12 text-blue-500 mb-5" />,
  },
  {
    title: "Lightning Fast",
    description: "Optimized for performance with code splitting and lazy loading built in.",
    icon: <Zap className="h-12 w-12 text-blue-500 mb-5" />,
  },
  {
    title: "SEO Optimized",
    description: "Built with best practices for search engine optimization and discoverability.",
    icon: <Globe className="h-12 w-12 text-blue-500 mb-5" />,
  },
  {
    title: "Developer Experience",
    description: "Intuitive APIs and comprehensive documentation make development a breeze.",
    icon: <Lightbulb className="h-12 w-12 text-blue-500 mb-5" />,
  },
  {
    title: "Continuous Updates",
    description: "Regular updates and improvements to keep your application on the cutting edge.",
    icon: <RefreshCw className="h-12 w-12 text-blue-500 mb-5" />,
  },
];

const Features = () => {
  return (
    <section id="features" className="py-16 md:py-24 bg-secondary/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful <span className="text-gradient">Features</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build modern React applications, all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-2">
                {feature.icon}
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
