import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(o => o.trim()),
        credentials: true,
    },
})
export class SocialGateway {
    @WebSocketServer()
    server!: Server;

    emitNewPost(post: any) {
        this.server.emit('new-post', post);
    }

    emitLikeUpdate(outfitId: string, count: number) {
        this.server.emit('like-update', { outfitId, count });
    }

    emitNewComment(outfitId: string, comment: any) {
        this.server.emit('new-comment', { outfitId, comment });
    }
}
