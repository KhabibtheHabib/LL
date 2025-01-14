import Anthropic from '@anthropic-ai/sdk';

let anthropic: Anthropic | null = null;

export function initializeAI(apiKey: string) {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  try {
    anthropic = new Anthropic({
      apiKey
    });

    // Test the API key with a simple request
    return anthropic.messages.create({
      model: 'claude-3.5-sonnet-20240229',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }]
    }).then(() => {
      localStorage.setItem('claude_api_key', apiKey);
      return true;
    }).catch((error) => {
      anthropic = null;
      localStorage.removeItem('claude_api_key');
      throw new Error('Invalid API key: ' + error.message);
    });
  } catch (error) {
    anthropic = null;
    localStorage.removeItem('claude_api_key');
    throw error;
  }
}

export async function processMessage(message: string, context: any = {}): Promise<{
  message: string;
  action?: 'order' | 'insights' | 'none';
  item?: string;
  quickQueue?: boolean;
}> {
  // Check for stored API key if not initialized
  if (!anthropic) {
    const storedKey = localStorage.getItem('claude_api_key');
    if (storedKey) {
      try {
        await initializeAI(storedKey);
      } catch (error) {
        console.error('Failed to initialize AI with stored key:', error);
        return {
          message: "Please check your Claude API key in settings.",
          action: 'none'
        };
      }
    } else {
      return {
        message: "Please set up your Claude API key in settings first.",
        action: 'none'
      };
    }
  }

  if (!anthropic) {
    throw new Error('AI not initialized');
  }

  try {
    const systemPrompt = `You are an AI assistant for a school lunch ordering system. Help users place orders, provide insights about their lunch habits, and assist with any questions.
    
    Available actions:
    - Place orders
    - View menu items
    - Get order insights
    - Use QuickQueue for automatic time slot assignment
    
    Current context:
    ${JSON.stringify(context, null, 2)}
    
    Keep responses concise and focused on helping with lunch ordering.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: message
      }],
      system: systemPrompt
    });

    const content = response.content[0].text;
    
    // Parse intent from response
    if (content.toLowerCase().includes('quickqueue') || content.toLowerCase().includes('quick queue')) {
      return {
        message: content,
        action: 'order',
        quickQueue: true
      };
    }
    
    if (content.toLowerCase().includes('order') || content.toLowerCase().includes('place')) {
      return {
        message: content,
        action: 'order',
        quickQueue: false
      };
    }

    if (content.toLowerCase().includes('insight') || content.toLowerCase().includes('analytics')) {
      return {
        message: content,
        action: 'insights'
      };
    }

    return {
      message: content,
      action: 'none'
    };
  } catch (error) {
    console.error('AI processing error:', error);
    throw new Error("I'm having trouble connecting to the AI service. Please check your API key in settings or try again later.");
  }
}