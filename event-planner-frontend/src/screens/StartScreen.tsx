import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cuboid, LayoutTemplate, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StartScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background">
      
      {/* Premium Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          EVENT PLANNING STUDIO
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
          Professional design and visualization for your next premium event.
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8 z-10 px-6 w-full max-w-5xl justify-center">
        
        {/* 2D Design Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={() => navigate('/category?mode=2d')}
          className="group cursor-pointer glass-panel flex-1 rounded-3xl p-8 hover:bg-panel-hover transition-all duration-300 border border-white/5 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]"
        >
          <div className="bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
            <LayoutTemplate className="text-indigo-400 w-8 h-8" />
          </div>
          <h2 className="text-3xl font-semibold mb-3">2D DESIGN</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Plan and edit your event layout in a clean, precise 2D top-down workspace. Perfect for exact measurements and floor plans.
          </p>
          <div className="flex items-center text-indigo-400 font-medium group-hover:translate-x-2 transition-transform">
            Start 2D Design <ArrowRight className="ml-2 w-5 h-5" />
          </div>
        </motion.div>

        {/* 3D Design Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          onClick={() => navigate('/category?mode=3d')}
          className="group cursor-pointer glass-panel flex-1 rounded-3xl p-8 hover:bg-panel-hover transition-all duration-300 border border-white/5 hover:border-accent/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]"
        >
          <div className="bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
            <Cuboid className="text-accent w-8 h-8" />
          </div>
          <h2 className="text-3xl font-semibold mb-3">3D DESIGN</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Explore your event space in an immersive 3D environment. Visualize lighting, colors, and spatial arrangements in real-time.
          </p>
          <div className="flex items-center text-accent font-medium group-hover:translate-x-2 transition-transform">
            Start 3D Design <ArrowRight className="ml-2 w-5 h-5" />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
