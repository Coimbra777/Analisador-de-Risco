import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Company } from '../../database/entities';
import { CompaniesService } from './companies.service';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((x: object) => x),
      save: jest.fn((entity: Company) =>
        Promise.resolve({
          ...entity,
          id: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        } as Company),
      ),
      find: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getRepositoryToken(Company), useValue: repo },
      ],
    }).compile();

    service = module.get(CompaniesService);
  });

  describe('create', () => {
    it('throws Conflict when registration number already exists for the same user', async () => {
      repo.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.create(
          { legalName: 'ACME', registrationNumber: '12.345' },
          { sub: 9, email: 'u@u.com' },
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates with createdByUserId from JWT sub and returns mapped fields', async () => {
      repo.findOne.mockResolvedValue(null);

      const out = await service.create(
        {
          legalName: 'XPTO',
          tradeName: 'T',
          registrationNumber: '99',
          country: 'BR',
        },
        { sub: 42, email: 'a@a.com' },
      );

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdByUserId: 42,
          legalName: 'XPTO',
          tradeName: 'T',
          registrationNumber: '99',
          country: 'BR',
        }),
      );
      expect(out).toEqual({
        id: 5,
        legalName: 'XPTO',
        tradeName: 'T',
        registrationNumber: '99',
        country: 'BR',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
    });
  });
});
