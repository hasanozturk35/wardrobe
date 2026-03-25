import { Controller, Get, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('shop')
@UseGuards(AuthGuard('jwt'))
export class ShopController {
    constructor(private readonly shopService: ShopService) {}

    @Get('discover')
    getDiscoverItems() {
        return this.shopService.getDiscoverItems();
    }
}
