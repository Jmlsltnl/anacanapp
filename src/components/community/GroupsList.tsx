import { motion } from 'framer-motion';
import { Users, ChevronRight, UserPlus, UserMinus, Check } from 'lucide-react';
import { CommunityGroup, useJoinGroup, useLeaveGroup } from '@/hooks/useCommunity';
import { Skeleton } from '@/components/ui/skeleton';

interface GroupsListProps {
  groups: CommunityGroup[];
  memberGroupIds: Set<string>;
  onSelectGroup: (groupId: string) => void;
  searchQuery: string;
  isLoading: boolean;
}

const GROUP_TYPE_LABELS: Record<string, string> = {
  birth_month: '🍼 Doğum Ayı',
  pregnancy_month: '🤰 Hamiləlik Ayı',
  baby_gender: '👶 Uşaq Cinsi',
  multiples: '👶👶 Əkizlər/Üçüzlər',
  general: '💬 Ümumi',
};

const GroupsList = ({ groups, memberGroupIds, onSelectGroup, searchQuery, isLoading }: GroupsListProps) => {
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[76px] rounded-[20px]" />
        ))}
      </div>
    );
  }

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByType = filteredGroups.reduce((acc, group) => {
    const type = group.group_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(group);
    return acc;
  }, {} as Record<string, CommunityGroup[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByType).map(([type, typeGroups]) => (
        <div key={type}>
          <h3 className="text-[11px] font-extrabold text-muted-foreground/50 uppercase tracking-[0.08em] mb-3 px-1">
            {GROUP_TYPE_LABELS[type] || type}
          </h3>
          <div className="space-y-2">
            {typeGroups.map((group, index) => {
              const isMember = memberGroupIds.has(group.id);

              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
                  onClick={() => isMember ? onSelectGroup(group.id) : undefined}
                  className={`bg-card rounded-[20px] border border-border/15 overflow-hidden transition-all duration-250 ${
                    isMember ? 'cursor-pointer hover:border-primary/15 hover:shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.08)]' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3.5">
                      {/* Icon */}
                      <div className="w-12 h-12 min-w-12 rounded-2xl bg-gradient-to-br from-primary/6 to-accent/4 flex items-center justify-center">
                        <span className="text-[22px] leading-none">{group.icon_emoji || '👥'}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground text-[14px] leading-snug line-clamp-1">
                          {group.name}
                        </h4>
                        {group.description && (
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-1 font-medium">
                            {group.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-semibold">
                            <Users className="w-[10px] h-[10px]" />
                            <span>{group.member_count} üzv</span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex-shrink-0">
                        {isMember ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 px-3 py-[7px] rounded-2xl bg-primary/6 text-primary text-[11px] font-bold">
                              <Check className="w-3 h-3" />
                              Üzv
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                          </div>
                        ) : (
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              joinGroup.mutate(group.id);
                            }}
                            disabled={joinGroup.isPending}
                            className="flex items-center gap-1.5 px-4 py-[7px] rounded-2xl gradient-primary text-primary-foreground text-[11px] font-bold shadow-[0_2px_12px_-3px_hsl(var(--primary)/0.35)]"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.94 }}
                          >
                            <UserPlus className="w-3 h-3" />
                            Qoşul
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* Leave action for members */}
                    {isMember && (
                      <div className="flex justify-end mt-2.5 pt-2.5 border-t border-border/10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            leaveGroup.mutate(group.id);
                          }}
                          disabled={leaveGroup.isPending}
                          className="text-[10px] text-muted-foreground/40 hover:text-destructive transition-colors duration-200 flex items-center gap-1 font-semibold"
                        >
                          <UserMinus className="w-2.5 h-2.5" />
                          Ayrıl
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {filteredGroups.length === 0 && (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-[20px] bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground/50 text-[13px] font-bold">Qrup tapılmadı</p>
        </motion.div>
      )}
    </div>
  );
};

export default GroupsList;
