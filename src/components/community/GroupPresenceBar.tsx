import { motion, AnimatePresence } from 'framer-motion';
import { Users, Circle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface GroupPresenceBarProps {
  onlineCount: number;
  onlineUsers: Array<{
    id: string;
    name: string;
    avatar_url?: string;
  }>;
  typingUsers: Array<{
    id: string;
    name: string;
  }>;
}

const GroupPresenceBar = ({ onlineCount, onlineUsers, typingUsers }: GroupPresenceBarProps) => {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b border-border/50">
      {/* Online indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Circle className="w-2 h-2 fill-green-500 text-green-500" />
          <span className="text-xs font-medium text-muted-foreground">
            {onlineCount} online
          </span>
        </div>

        {/* Online avatars (max 5) */}
        {onlineUsers.length > 0 && (
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 5).map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Avatar className="w-6 h-6 border-2 border-background">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            ))}
            {onlineUsers.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-[10px] font-bold text-muted-foreground">
                  +{onlineUsers.length - 5}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Typing indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 flex items-center gap-2"
          >
            <div className="flex gap-1">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
              />
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
              />
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {typingUsers.length === 1 
                ? `${typingUsers[0].name} yazır...`
                : typingUsers.length === 2
                  ? `${typingUsers[0].name} və ${typingUsers[1].name} yazır...`
                  : `${typingUsers.length} nəfər yazır...`
              }
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupPresenceBar;
