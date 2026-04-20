import { Injectable, NotImplementedException } from '@nestjs/common';

import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SuppliersService {
  create(_createSupplierDto: CreateSupplierDto) {
    throw new NotImplementedException('Supplier creation is not implemented yet.');
  }
}
