import { Analysis } from './analysis.entity';
import { Company } from './company.entity';
import { Document } from './document.entity';
import { RiskFinding } from './risk-finding.entity';
import { User } from './user.entity';

export const databaseEntities = [User, Company, Analysis, Document, RiskFinding];

export { Analysis, Company, Document, RiskFinding, User };
