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
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[68px] rounded-2xl" />
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
    <div className="space-y-4">
      {Object.entries(groupedByType).map(([type, typeGroups]) => (
        <div key={type}>
          <h3 className="text-[10px] font-extrabold text-muted-foreground/40 uppercase tracking-[0.1em] mb-2 px-0.5">
            {GROUP_TYPE_LABELS[type] || type}
          </h3>
          <div className="space-y-1.5">
            {typeGroups.map((group, index) => {
              const isMember = memberGroupIds.has(group.id);
              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => isMember ? onSelectGroup(group.id) : undefined}
                  className={`bg-card rounded-2xl border border-border/10 overflow-hidden transition-all duration-200 ${
                    isMember ? 'cursor-pointer active:scale-[0.99]' : ''
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 min-w-10 rounded-xl bg-gradient-to-br from-primary/6 to-accent/4 flex items-center justify-center">
                        <span className="text-lg leading-none">{group.icon_emoji || '👥'}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground text-[13px] leading-tight line-clamp-1">{group.name}</h4>
                        {group.description && (
                          <p className="text-[10px] text-muted-foreground/50 mt-[2px] line-clamp-1 font-medium">{group.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground/35 font-semibold">
                          <Users className="w-[9px] h-[9px]" />
                          <span>{group.member_count} üzv</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {isMember ? (
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-0.5 px-2 py-[5px] rounded-lg bg-primary/6 text-primary text-[10px] font-bold">
                              <Check className="w-2.5 h-2.5" /> Üzv
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/25" />
                          </div>
                        ) : (
                          <motion.button
                            onClick={(e) => { e.stopPropagation(); joinGroup.mutate(group.id); }}
                            disabled={joinGroup.isPending}
                            className="flex items-center gap-1 px-3 py-[5px] rounded-lg gradient-primary text-primary-foreground text-[10px] font-bold shadow-sm"
                            whileTap={{ scale: 0.93 }}
                          >
                            <UserPlus className="w-2.5 h-2.5" /> Qoşul
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {isMember && (
                      <div className="flex justify-end mt-2 pt-2 border-t border-border/8">
                        <button
                          onClick={(e) => { e.stopPropagation(); leaveGroup.mutate(group.id); }}
                          disabled={leaveGroup.isPending}
                          className="text-[9px] text-muted-foreground/30 hover:text-destructive transition-colors flex items-center gap-0.5 font-semibold"
                        >
                          <UserMinus className="w-2 h-2" /> Ayrıl
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
        <div className="text-center py-14">
          <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-muted-foreground/25" />
          </div>
          <p className="text-muted-foreground/40 text-[12px] font-bold">Qrup tapılmadı</p>
        </div>
      )}
    </div>
  );
};

export default GroupsList;
