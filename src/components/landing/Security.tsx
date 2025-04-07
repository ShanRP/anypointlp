
import { motion } from "framer-motion";
import { Shield, Lock, Eye } from "lucide-react";

export const Security = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section id="security" className="py-20 bg-gray-50/95">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-12 text-center">
            Enterprise Grade Security
          </h2>

          <div className="space-y-8">
            <motion.div
              variants={itemVariants}
              className="flex items-start gap-4"
            >
              <Shield className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Industry-Standard Compliance
                </h3>
                <p className="text-gray-600">
                  Our platform is built with recognized compliance standards to ensure your data remains secure.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-start gap-4"
            >
              <Lock className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Data Protection
                </h3>
                <p className="text-gray-600">
                  We work exclusively on code repositories and snippets, guaranteeing your sensitive information is never accessed.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-start gap-4"
            >
              <Eye className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Complete Transparency
                </h3>
                <p className="text-gray-600">
                  You are always in control of your data, with full transparency and protection throughout the process.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Security;
