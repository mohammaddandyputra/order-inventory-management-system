import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Param, 
  Patch,
  UsePipes,
  ParseUUIDPipe,
  ValidationPipe
} from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Controller("orders")
@UseGuards(ThrottlerGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @Get()
  async getOrders() {
    return this.orderService.getAllOrders();
  }

  @Get(":id")
  async getOrderById(@Param("id", ParseUUIDPipe) id: string) {
    return this.orderService.getOrderById(id);
  }
  
  @Patch(":id/status")
  async updateOrderStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { status: string }
  ) {
    return this.orderService.updateOrderStatus(id, body.status);
  }
}
