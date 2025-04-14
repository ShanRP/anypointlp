
import React from 'react';

interface HeaderProps {
  title: string;
  description?: string;
}

const Header: React.FC<HeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 font-geistMono tracking-tight">{title}</h1>
      {description && <p className="text-gray-600 font-geistSans">{description}</p>}
    </div>
  );
};

export default Header;
