import Pusher from 'pusher';

let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID || '2123939',
      key: process.env.PUSHER_KEY || '66627331807eb280e98c',
      secret: process.env.PUSHER_SECRET || '7f9e6c4aa60d3a4cc8e0',
      cluster: process.env.PUSHER_CLUSTER || 'eu',
      useTLS: true,
    });
  }
  return pusherInstance;
}
