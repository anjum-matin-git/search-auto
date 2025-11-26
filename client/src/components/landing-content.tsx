import { motion } from "framer-motion";
import { 
  Brain, 
  BarChart3, 
  Zap,
  Shield,
  Search,
  History,
  Car,
  MessageSquare,
  Building2,
  Globe
} from "lucide-react";

// Feature Data - Tailored for SearchAuto
const features = [
  {
    icon: Brain,
    title: "Natural Language Search",
    desc: "Just ask 'Show me fast electric SUVs under $50k'. Our AI understands context, not just keywords."
  },
  {
    icon: BarChart3,
    title: "Market Analysis",
    desc: "Real-time price comparison against thousands of listings to ensure you never overpay."
  },
  {
    icon: Shield,
    title: "Verified Dealers",
    desc: "We only index inventory from reputable dealerships with transparent history reports."
  },
  {
    icon: Search,
    title: "Smart Filtering",
    desc: "Automatically filter by range, charging speed, accident history, and ownership costs."
  },
  {
    icon: History,
    title: "Price History",
    desc: "Track listing price changes over time to spot the perfect moment to buy."
  },
  {
    icon: Zap,
    title: "EV Specialist",
    desc: "Dedicated filters for battery health, range degradation, and charging compatibility."
  }
];

export function LandingContent() {
  return (
    <div className="bg-[#010104] text-white overflow-hidden font-body">
      
      {/* 1. FEATURES SECTION */}
      <section className="py-24 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-display font-medium mb-6 text-white">
            Built for modern car buying
          </h2>
          <p className="text-[#757b83] max-w-xl mx-auto font-light text-lg">
            Stop browsing endless pages. Let intelligence do the heavy lifting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0c0c0f] border border-white/10 rounded-3xl p-8 hover:border-[#cffe25]/20 transition-colors group"
            >
              <div className="mb-6 text-[#cffe25]">
                <feature.icon className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-display font-medium mb-3 text-white">
                {feature.title}
              </h3>
              <p className="text-[#757b83] text-sm leading-relaxed font-light">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 2. DEALER NETWORK & CONCIERGE SECTION */}
      <section className="py-12 container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Inventory Network */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#0c0c0f] border border-white/10 rounded-[2rem] p-8 sm:p-12 relative overflow-hidden h-[500px] flex flex-col justify-end group"
          >
            {/* Orbit Animation Visualization */}
            <div className="absolute inset-0 flex items-center justify-center -translate-y-12">
              <div className="relative w-64 h-64">
                {/* Rings */}
                <div className="absolute inset-0 border border-white/5 rounded-full" />
                <div className="absolute inset-8 border border-white/5 rounded-full" />
                <div className="absolute inset-16 border border-white/5 rounded-full" />
                
                {/* Center Logo */}
                <div className="absolute inset-0 m-auto w-16 h-16 bg-[#cffe25] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(207,254,37,0.3)] z-10">
                  <Car className="w-8 h-8 text-black fill-current" />
                </div>

                {/* Orbiting Icons (Inventory Sources) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-[#1a1a1d] p-2 rounded-lg border border-white/10 animate-orbit-slow">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="absolute bottom-10 right-0 bg-[#1a1a1d] p-2 rounded-lg border border-white/10 animate-orbit-reverse">
                  <Globe className="w-4 h-4 text-green-400" />
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl font-display font-medium mb-2 text-white">Trusted Dealer Network</h3>
              <p className="text-[#757b83] font-light">Connected to 50,000+ verified dealerships nationwide for up-to-the-minute listings.</p>
            </div>
          </motion.div>

          {/* Right: Concierge Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#0c0c0f] border border-white/10 rounded-[2rem] p-8 sm:p-12 relative overflow-hidden h-[500px] flex flex-col justify-end"
          >
            {/* Background Number Watermark */}
            <div className="absolute top-10 right-10 text-[200px] font-bold text-[#1a1a1d] font-display leading-none opacity-50 select-none pointer-events-none">
              AI
            </div>

            {/* Glowing Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-[#cffe25] blur-3xl opacity-20" />
                <div className="relative bg-[#cffe25] text-black px-8 py-4 rounded-full flex items-center gap-3 font-medium text-lg shadow-[0_0_50px_rgba(207,254,37,0.4)]">
                  <MessageSquare className="w-6 h-6" />
                  Buyer Advocacy
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl font-display font-medium mb-2 text-white">AI Concierge</h3>
              <p className="text-[#757b83] font-light">Your personal car buying expert. From market analysis to negotiation scripts, we're on your side.</p>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}