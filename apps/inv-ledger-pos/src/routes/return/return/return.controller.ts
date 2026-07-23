import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReturnService } from './return.service.js';
import { ProcessReturnDto, RestockReturnDto } from '../dto/return.dto.js';

@ApiTags('returns')
@ApiBearerAuth()
@Controller('api/returns')
export class ReturnController {
  constructor(private readonly returnsService: ReturnService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process customer return into quarantine' })
  @ApiResponse({
    status: 201,
    description: 'Return processed and ledger event returned',
  })
  async processReturn(@Body() dto: ProcessReturnDto) {
    return this.returnsService.processReturn(dto);
  }

  @Post(':id/restock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Move pristine item from quarantine back to sales floor',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the original RETURN ledger entry',
  })
  async restock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestockReturnDto,
  ) {
    return this.returnsService.restock(id, dto);
  }

  @Post(':id/discard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Write off damaged item from quarantine' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the original RETURN ledger entry',
  })
  async discard(@Param('id', ParseUUIDPipe) id: string) {
    return this.returnsService.discard(id);
  }
}
