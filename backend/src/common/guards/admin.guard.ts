import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const isAdminByEmail = user?.email?.toLowerCase().startsWith('admin@');
    
    if (!user || (user.role !== UserRole.ADMIN && !isAdminByEmail)) {
      throw new ForbiddenException('Bu işlem için yönetici yetkisi gereklidir.');
    }

    return true;
  }
}
