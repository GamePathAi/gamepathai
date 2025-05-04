
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight } from "lucide-react";

const HeroSection: React.FC = () => {
  const scrollToDownload = () => {
    const downloadSection = document.getElementById('download-section');
    if (downloadSection) {
      downloadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid opacity-20 z-0"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-tech leading-tight">
              <span>Optimize Your </span>
              <span className="bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-pink text-transparent bg-clip-text">
                Gaming Experience
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
              GamePath AI uses advanced machine learning algorithms to reduce latency, 
              improve FPS, and provide a secure, optimized connection for all your games.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="cyberAction" 
                size="lg" 
                className="shadow-lg"
                onClick={scrollToDownload}
              >
                Download GamePath AI
                <ArrowDown className="ml-2 h-5 w-5" />
              </Button>
              <Link to="/dashboard">
                <Button variant="cyberOutline" size="lg">
                  Access Dashboard
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="bg-cyber-darkblue border border-cyber-blue/30 rounded-xl p-6 shadow-2xl relative z-10">
              <div className="aspect-video bg-gradient-to-br from-cyber-blue/20 to-cyber-purple/20 rounded-lg flex items-center justify-center mb-4">
                <div className="text-cyber-blue text-7xl opacity-70 font-tech">GP</div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-cyber-blue/20 rounded w-3/4"></div>
                <div className="h-3 bg-cyber-blue/10 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
