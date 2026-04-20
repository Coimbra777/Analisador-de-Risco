import { Injectable, NotImplementedException } from '@nestjs/common';

import { CreateAnalysisDto } from './dto/create-analysis.dto';

@Injectable()
export class AnalysesService {
  create(_createAnalysisDto: CreateAnalysisDto) {
    throw new NotImplementedException('Analysis creation is not implemented yet.');
  }
}
