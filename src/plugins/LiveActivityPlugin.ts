import { registerPlugin } from '@capacitor/core';

export interface LiveActivityPlugin {
  startActivity(options: {
    type: string;
    label: string;
    startTime: number;
    feedType?: string;
  }): Promise<void>;
  stopActivity(options?: { timerId?: string }): Promise<void>;
}

const LiveActivity = registerPlugin<LiveActivityPlugin>('LiveActivity');

export default LiveActivity;
