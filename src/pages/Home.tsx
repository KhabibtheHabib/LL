import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Typewriter from 'typewriter-effect';
import { Clock, UtensilsCrossed, School, ArrowRight } from 'lucide-react';

export default function Home() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: 'Skip the Line',
      description: 'Order ahead and pick up your food without waiting in line',
      icon: Clock,
      color: 'bg-blue-500'
    },
    {
      title: 'Fresh Food',
      description: 'Enjoy fresh, delicious meals prepared just for you',
      icon: UtensilsCrossed,
      color: 'bg-green-500'
    },
    {
      title: 'Student ID',
      description: 'Use your student ID for seamless verification',
      icon: School,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <motion.div 
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-orange-500 text-white"
      >
        <div className="absolute inset-0 overflow-hidden rounded-b-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-orange-500/20 animate-gradient" />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-6xl sm:text-7xl font-bold mb-6"
          >
            <Typewriter
              options={{
                strings: ['Skip the Line', 'Save Time', 'Eat Better'],
                autoStart: true,
                loop: true,
                deleteSpeed: 50,
                delay: 80
              }}
            />
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl sm:text-2xl text-white mb-8"
          >
            The future of school lunch is here. Order ahead, skip the line,
            and make the most of your break time.
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              to="/signin"
              className="inline-flex items-center px-8 py-3 rounded-full text-lg font-semibold bg-white text-purple-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="animate-bounce">
            <ArrowRight className="h-6 w-6 transform rotate-90" />
          </div>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose Lineless Lunch?</h2>
            <p className="text-xl text-gray-600">Experience a better way to enjoy your lunch break</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="relative group h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-white p-8 rounded-2xl shadow-lg group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300 h-full flex flex-col">
                  <div className={`${feature.color} text-white p-3 rounded-lg inline-block mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 flex-grow">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to a better lunch experience</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: 1, title: 'Sign In with Student ID', desc: 'Use your school credentials to access the platform' },
              { step: 2, title: 'Place Your Order', desc: 'Select your meals and preferred pickup time' },
              { step: 3, title: 'Skip the Line', desc: 'Your order will be ready at your chosen time' }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div className="pt-8">
                    <h3 className="text-xl font-semibold mb-2 text-center">{item.title}</h3>
                    <p className="text-gray-600 text-center">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">What Students Say</h2>
            <p className="text-xl text-gray-600">Join thousands of satisfied students</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "I can finally enjoy my entire lunch break with friends instead of waiting in line!",
                role: "Junior"
              },
              {
                quote: "The app is super easy to use, and I love being able to pick up my food whenever I want.",
                role: "Senior"
              },
              {
                quote: "Great selection of food and the pickup process is seamless. Highly recommend!",
                role: "Sophomore"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-gray-50 p-6 rounded-2xl hover:shadow-lg transition-shadow duration-300 h-full flex flex-col"
              >
                <p className="text-gray-600 mb-4 italic flex-grow">"{testimonial.quote}"</p>
                <div>
                  <p className="text-sm text-gray-500">- {testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}