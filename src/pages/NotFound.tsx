
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CustomButton } from "@/components/ui/CustomButton";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-light p-4 text-center">
      <div className="max-w-md glass-morphism p-8 rounded-xl animate-fade-up">
        <div className="mb-6 text-purple-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">404</h1>
        <p className="text-xl text-gray-700 mb-6">
          The page you're looking for isn't available
        </p>
        <CustomButton 
          variant="primary" 
          size="md" 
          href="/"
          icon={<ArrowLeft size={16} />}
          iconPosition="left"
        >
          Return to Home
        </CustomButton>
      </div>
    </div>
  );
};

export default NotFound;
