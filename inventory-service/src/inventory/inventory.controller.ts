import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getAllInventory() {
    return this.inventoryService.getInventory();
  }

  @Get(':id')
  async getInventoryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.getInventoryById(id);
  }
}