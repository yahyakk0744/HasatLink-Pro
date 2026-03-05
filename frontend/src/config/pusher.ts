import Pusher from 'pusher-js';

let pusherInstance: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher('66627331807eb280e98c', {
      cluster: 'eu',
    });
  }
  return pusherInstance;
}
