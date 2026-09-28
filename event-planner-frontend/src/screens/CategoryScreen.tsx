import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { mockCategories } from '../mock/mockData';

export default function CategoryScreen() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || '3d';
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-gray-400 hover:text-white mb-12 w-fit transition-colors"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> Back to Home
      </button>

      <div className="max-w-6xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-3">Select Event Category</h1>
          <p className="text-gray-400 text-lg">Choose a starting template for your {mode.toUpperCase()} design.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mockCategories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              onClick={() => navigate(`/editor/${mode}/${cat.id}`)}
              className="group glass-panel rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-indigo-500/40 transition-all duration-300 flex flex-col"
            >
              <div className="h-48 bg-panel flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                <div className="text-6xl text-white/10 font-black tracking-widest">{cat.title}</div>
                {/* Mock image placeholder */}
                <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity bg-[url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay" />
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold mb-2">{cat.title}</h3>
                <p className="text-gray-400 flex-1">{cat.description}</p>
                <div className="mt-6 flex items-center justify-between text-indigo-400 font-medium">
                  Open Project
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
