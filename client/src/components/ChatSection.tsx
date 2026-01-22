import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import type { Chat as ChatMessage } from '../types';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatSection({ messages, onSendMessage, disabled = false }: ChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="h-[30rem] w-[20rem] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Game Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-4 max-h-96 overflow-auto">
          <div className="space-y-3 py-2">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No messages yet. Say hello! 👋
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        msg.role === 'X' 
                          ? 'text-blue-600' 
                          : msg.role === 'O'
                          ? 'text-purple-600'
                          : msg.role === 'System'
                          ? 'text-gray-600' 
                          : 'text-green-600'
                      }`}
                    >
                      {msg.sender} {msg.role === 'System' ? '' : msg.role === 'X' ? '(Player X)' : msg.role === 'O' ? '(Player O)' : '(Spectator)'}
                    </span>
                  </div>
                  <p 
                    className="text-sm text-gray-700 break-words whitespace-pre-wrap"
                    style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
                  >
                    {msg.message}
                  </p>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={disabled ? "Join a game to chat..." : "Type a message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={disabled || !input.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Press Enter to send
          </p>
        </div>
      </CardContent>
    </Card>
  );
}