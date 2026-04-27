import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import type { Repository } from 'typeorm';

import { User } from '../../database/entities';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn((data: Partial<User>) => ({ id: 0, ...data })),
      save: jest.fn((entity: Partial<User>) =>
        Promise.resolve({
          ...entity,
          id: 1,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        } as User),
      ),
      createQueryBuilder: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-jwt') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository as unknown as Repository<User>,
        },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('throws ConflictException when email already exists', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(
        service.register({
          name: 'A',
          email: 'a@a.com',
          password: 'password12',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('saves user with hashed password and returns public fields only', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValue(null);
      (usersRepository.save as jest.Mock).mockImplementation(
        (entity: Partial<User>) =>
          Promise.resolve({
            ...entity,
            id: 2,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          } as User),
      );

      const out = await service.register({
        name: 'B',
        email: 'User@X.com',
        password: 'password12',
      });

      const savedArg = (usersRepository.save as jest.Mock).mock.calls[0][0] as User;
      expect(savedArg.email).toBe('user@x.com');
      expect(savedArg.passwordHash).toBeDefined();
      expect((out as { passwordHash?: string }).passwordHash).toBeUndefined();
      expect(out).toEqual({
        id: 2,
        name: 'B',
        email: 'user@x.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
    });
  });

  describe('login', () => {
    it('returns token and user when password matches', async () => {
      const digest = await hash('right-pass', 4);
      const mockUser = {
        id: 3,
        name: 'C',
        email: 'c@c.com',
        passwordHash: digest,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      } as User;

      const getOne = jest.fn().mockResolvedValue(mockUser);
      (usersRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne,
      });

      const out = await service.login({ email: 'C@c.com', password: 'right-pass' });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(out.accessToken).toBe('signed-jwt');
      expect(out.user.email).toBe('c@c.com');
      expect('passwordHash' in out.user).toBe(false);
    });

    it('throws UnauthorizedException when user not found', async () => {
      (usersRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.login({ email: 'nope@test.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when password is wrong', async () => {
      const digest = await hash('one', 4);
      (usersRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 1,
          email: 'a@a.com',
          passwordHash: digest,
        }),
      });

      await expect(
        service.login({ email: 'a@a.com', password: 'other' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
