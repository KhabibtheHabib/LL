import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Maximize2, Minimize2 } from 'lucide-react';
import { useCartStore } from '../store/cart';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  prepTime: number;
}

interface OrderBotProps {
  onClose: () => void;
  menuItems: MenuItem[];
}

export default function OrderBot({ onClose, menuItems }: OrderBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your ordering assistant. You can ask me about the menu or tell me what you'd like to order. For example, try saying 'What's on the menu?' or 'I'd like a burger.'"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addItem, clearCart } = useCartStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await processMessage(userMessage, menuItems);
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
      
      if (response.action === 'order') {
        const item = menuItems.find(item => 
          item.name.toLowerCase().includes(response.item.toLowerCase())
        );
        
        if (item) {
          clearCart();
          addItem({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            prepTime: item.prepTime
          });
          toast.success(`Added ${item.name} to cart`);
        }
      }
    } catch (error) {
      toast.error('Sorry, I had trouble processing that request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${isMinimized ? 'w-auto' : 'w-full max-w-lg'}`}>
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
        >
          <Bot className="h-6 w-6" />
          <span>Chat with AI Assistant</span>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-orange-500" />
              <h2 className="text-lg font-semibold">Order Assistant</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}