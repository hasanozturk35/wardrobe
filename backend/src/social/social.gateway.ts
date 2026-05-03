import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class SocialGateway {
    @WebSocketServer()
    server: Server;

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
