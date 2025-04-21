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
    <section id="security" className="py-24 bg-white relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-purple-100 to-transparent rounded-full blur-3xl opacity-30 transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-indigo-100 to-transparent rounded-full blur-3xl opacity-30 transform -translate-x-1/3 translate-y-1/3"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
            Enterprise Grade Security
          </h2>

          <div className="space-y-10">
            <motion.div
              variants={itemVariants}
              className="flex items-start gap-6 group"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                <Shield className="w-7 h-7 text-purple-600 group-hover:text-purple-700 transition-colors" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                  Industry-Standard Compliance
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Our platform is built with recognized compliance standards to ensure your data remains secure.
                  We adhere to the highest security protocols and regularly undergo security audits to maintain
                  our commitment to protecting your information.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-start gap-6 group"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                <Lock className="w-7 h-7 text-blue-600 group-hover:text-blue-700 transition-colors" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                  Data Protection
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  We work exclusively on code repositories and snippets, guaranteeing your sensitive information is never accessed.
                  Your data is processed with end-to-end encryption, and we implement strict access controls to ensure
                  only authorized personnel can access your information.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-start gap-6 group"
            >
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                <Eye className="w-7 h-7 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                  Complete Transparency
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  You are always in control of your data, with full transparency and protection throughout the process.
                  We provide detailed logs of all operations performed on your data, and you can request deletion
                  of your information at any time through our easy-to-use dashboard.
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
