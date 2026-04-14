import { Controller, Get, UseGuards, Patch, Param, Body, Delete, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminService } from './admin.service';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('logs')
  async getLogs(
    @Query('limit') limit?: string, 
    @Query('skip') skip?: string,
    @Query('level') level?: string
  ) {
    return this.adminService.getLogs(Number(limit) || 100, Number(skip) || 0, level);
  }

  @Get('logs/export')
  async exportLogs() {
    return this.adminService.exportLogsCSV();
  }

  @Delete('logs/clear')
  async clearLogs() {
    return this.adminService.clearAllLogs();
  }

  @Delete('logs/:id')
  async deleteLog(@Param('id') logId: string) {
    return this.adminService.deleteLog(logId);
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/role')
  async updateRole(@Param('id') userId: string, @Body('role') role: UserRole) {
    return this.adminService.updateUserRole(userId, role);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }
}
