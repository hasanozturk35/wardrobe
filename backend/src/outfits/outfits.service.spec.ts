import { Test, TestingModule } from '@nestjs/testing';
import { OutfitsService } from './outfits.service';

describe('OutfitsService', () => {
  let service: OutfitsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutfitsService,
        { provide: 'PrismaService', useValue: {} },
        { provide: (require('../infrastructure/prisma/prisma.service').PrismaService), useValue: {} }
      ],
    }).compile();

    service = module.get<OutfitsService>(OutfitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
