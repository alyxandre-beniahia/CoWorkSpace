import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SpaceRepository } from '../infrastructure/space.repository';
import { GetSpaceByIdUseCase } from './get-space-by-id.use-case';

describe('GetSpaceByIdUseCase', () => {
  let useCase: GetSpaceByIdUseCase;
  let repository: jest.Mocked<Pick<SpaceRepository, 'findById'>>;

  const mockSpace = {
    id: 'space-1',
    name: 'Salle A',
    code: 'A01',
    type: 'MEETING_ROOM',
    capacity: 8,
    status: 'AVAILABLE',
    description: 'Grande salle',
    positionX: 10,
    positionY: 20,
    equipements: [{ name: 'Vidéoprojecteur' }, { name: 'Tableau' }],
  };

  beforeEach(async () => {
    repository = {
      findById: jest.fn().mockResolvedValue(mockSpace),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSpaceByIdUseCase,
        { provide: SpaceRepository, useValue: repository },
      ],
    }).compile();

    useCase = module.get(GetSpaceByIdUseCase);
  });

  it('retourne l’espace avec équipements si trouvé', async () => {
    const result = await useCase.run('space-1');

    expect(result).toEqual(mockSpace);
    expect(repository.findById).toHaveBeenCalledWith('space-1');
  });

  it('lance NotFoundException si l’espace n’existe pas', async () => {
    (repository.findById as jest.Mock).mockResolvedValue(null);

    await expect(useCase.run('unknown-id')).rejects.toThrow(NotFoundException);
  });
});
