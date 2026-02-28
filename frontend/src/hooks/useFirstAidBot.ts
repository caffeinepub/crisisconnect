import { useState, useCallback } from 'react';
import {
  EMERGENCY_CATEGORIES,
  getGuidanceByCategory,
  getGuidanceByKeyword,
  type FirstAidGuidance,
} from '../utils/firstAidDecisionTree';

export interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  content: string;
  guidance?: FirstAidGuidance;
  showCategories?: boolean;
  timestamp: Date;
}

const GREETING: ChatMessage = {
  id: 'greeting',
  role: 'bot',
  content: '🚨 **CrisisConnect First Aid Assistant**\n\nI can guide you through emergency first-aid procedures. Select a category below or type a keyword (e.g., "CPR", "burn", "choking").',
  showCategories: true,
  timestamp: new Date(),
};

export function useFirstAidBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  }, []);

  const sendMessage = useCallback((input: string) => {
    // Add user message
    addMessage({ role: 'user', content: input });

    // Try keyword match
    const guidance = getGuidanceByKeyword(input);
    if (guidance) {
      addMessage({
        role: 'bot',
        content: `Here are the first-aid steps for **${guidance.title}**:`,
        guidance,
      });
    } else {
      addMessage({
        role: 'bot',
        content: 'I couldn\'t find specific guidance for that. Please select a category below or try keywords like "CPR", "bleeding", "burn", "choking", "seizure", "stroke", or "fracture".',
        showCategories: true,
      });
    }
  }, [addMessage]);

  const selectCategory = useCallback((categoryId: string) => {
    const cat = EMERGENCY_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return;

    addMessage({ role: 'user', content: `${cat.emoji} ${cat.label}` });

    const guidance = getGuidanceByCategory(categoryId);
    if (guidance) {
      addMessage({
        role: 'bot',
        content: `Here are the first-aid steps for **${guidance.title}**:`,
        guidance,
      });
    }
  }, [addMessage]);

  const reset = useCallback(() => {
    setMessages([{ ...GREETING, timestamp: new Date() }]);
  }, []);

  return { messages, sendMessage, selectCategory, reset };
}
