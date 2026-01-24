import { motion } from 'framer-motion';
import { Users, ChevronRight, UserPlus, UserMinus, Check } from 'lucide-react';
import { CommunityGroup, useJoinGroup, useLeaveGroup } from '@/hooks/useCommunity';
import { Button } from '@/components/ui/button';
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
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  // Filter and group by type
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
          <h3 className="text-xs font-bold text-muted-foreground mb-2 px-1">
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
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm"
                >
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      {/* Icon - Fixed size, no overflow */}
                      <div className="w-10 h-10 min-w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-lg leading-none">{group.icon_emoji || '👥'}</span>
                      </div>
                      
                      {/* Content - Flexible but truncated */}
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className="font-bold text-foreground text-xs leading-tight line-clamp-2">
                          {group.name}
                        </h4>
                        {group.description && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                            {group.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                          <Users className="w-2.5 h-2.5 flex-shrink-0" />
                          <span>{group.member_count} üzv</span>
                        </div>
                      </div>
                      
                      {/* Action Button - Fixed width */}
                      <div className="flex-shrink-0">
                        {isMember ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectGroup(group.id);
                            }}
                            className="h-7 px-2 text-[10px] font-medium"
                          >
                            <Check className="w-3 h-3 mr-1 text-green-600" />
                            Üzv
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              joinGroup.mutate(group.id);
                            }}
                            disabled={joinGroup.isPending}
                            className="h-7 px-2 text-[10px] font-medium gradient-primary"
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Qoşul
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Member Actions Row */}
                    {isMember && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                        <button
                          onClick={() => onSelectGroup(group.id)}
                          className="text-[10px] text-primary font-medium flex items-center gap-0.5 hover:underline"
                        >
                          Qrupа keç
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            leaveGroup.mutate(group.id);
                          }}
                          disabled={leaveGroup.isPending}
                          className="text-[10px] text-destructive hover:underline"
                        >
                          <UserMinus className="w-2.5 h-2.5 inline mr-0.5" />
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
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Qrup tapılmadı</p>
        </div>
      )}
    </div>
  );
};

export default GroupsList;
