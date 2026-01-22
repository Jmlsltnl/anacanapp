import { motion } from 'framer-motion';
import { Users, ChevronRight, UserPlus, UserMinus } from 'lucide-react';
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
          <Skeleton key={i} className="h-20 rounded-2xl" />
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
    <div className="space-y-6">
      {Object.entries(groupedByType).map(([type, typeGroups]) => (
        <div key={type}>
          <h3 className="text-sm font-bold text-muted-foreground mb-3">
            {GROUP_TYPE_LABELS[type] || type}
          </h3>
          <div className="space-y-3">
            {typeGroups.map((group, index) => {
              const isMember = memberGroupIds.has(group.id);

              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-2xl border border-border/50 overflow-hidden"
                >
                  <button
                    onClick={() => isMember && onSelectGroup(group.id)}
                    className={`w-full p-4 text-left ${isMember ? 'cursor-pointer' : 'cursor-default'}`}
                    disabled={!isMember}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                        {group.icon_emoji || '👥'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate">{group.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {group.description}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{group.member_count} üzv</span>
                        </div>
                      </div>
                      {isMember ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              leaveGroup.mutate(group.id);
                            }}
                            disabled={leaveGroup.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            joinGroup.mutate(group.id);
                          }}
                          disabled={joinGroup.isPending}
                          className="gradient-primary"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Qoşul
                        </Button>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {filteredGroups.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Qrup tapılmadı</p>
        </div>
      )}
    </div>
  );
};

export default GroupsList;
